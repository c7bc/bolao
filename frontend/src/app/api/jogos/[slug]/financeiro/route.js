// frontend/src/app/api/jogos/[slug]/financeiro/route.js

import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  BatchGetItemCommand
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { verifyToken } from "../../../../utils/auth";
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    // console.log(`[GET] - Parâmetro slug recebido: ${slug}`);

    if (!slug) {
      return NextResponse.json({ error: "Slug não fornecido." }, { status: 400 });
    }

    // Authentication
    const authorizationHeader = req.headers.get("authorization");
    // console.log(`[GET] - Header de autorização: ${authorizationHeader ? 'Presente' : 'Ausente'}`);
    if (!authorizationHeader) {
      return NextResponse.json({ error: "Cabeçalho de autorização ausente." }, { status: 401 });
    }

    const token = authorizationHeader.split(" ")[1];
    const decodedToken = verifyToken(token);
    // console.log(`[GET] - Token verificado para o usuário: ${decodedToken?.sub || 'Erro na verificação'}`);

    if (!decodedToken || !["admin", "superadmin"].includes(decodedToken.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Retrieve game data
    const jogo = await getJogoBySlug(slug);
    // console.log(`[GET] - Jogo encontrado:`, jogo);
    if (!jogo) {
      return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
    }

    // Check premiation configuration
    if (!jogo.premiation) {
      return NextResponse.json({ error: "Configuração de premiação não encontrada." }, { status: 400 });
    }

    // Calculate financial values
    const financeiroData = await calcularDadosFinanceiros(jogo);
    // console.log(`[GET] - Dados financeiros calculados:`, financeiroData);

    // Fetch payment status for all awardees
    await atualizarStatusPagamento(financeiroData.premiacoes);
    // console.log(`[GET] - Status de pagamento atualizado para todas as premiações.`);

    // Fetch each premiado based on premiacaoId
    for (const categoria in financeiroData.premiacoes) {
      for (const premiacao of financeiroData.premiacoes[categoria]) {
        const pago = await buscarPremiado(premiacao.premiacao_id);
        if (pago !== null) {
          console.log(`Pagamento status para ${premiacao.premiacao_id}: ${pago}`);
        } else {
          console.log(`Premiado não encontrado para ${premiacao.premiacao_id}`);
        }
      }
    }

    // Return response
    return NextResponse.json({ financeiro: financeiroData }, { status: 200 });

  } catch (error) {
    console.error("[GET] - Erro ao buscar financeiro:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { slug } = await params;
    // console.log(`[PUT] - Parâmetro slug recebido: ${slug}`);
    const { cli_id, categoriaPremio } = await req.json();
    // console.log(`[PUT] - Parâmetros de corpo recebidos: cli_id=${cli_id}, categoriaPremio=${categoriaPremio}`);

    if (!slug || !cli_id || !categoriaPremio) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    // Authentication
    const authorizationHeader = req.headers.get("authorization");
    // console.log(`[PUT] - Header de autorização: ${authorizationHeader ? 'Presente' : 'Ausente'}`);
    if (!authorizationHeader) {
      return NextResponse.json({ error: "Cabeçalho de autorização ausente." }, { status: 401 });
    }

    const token = authorizationHeader.split(" ")[1];
    const decodedToken = verifyToken(token);
    // console.log(`[PUT] - Token verificado para o usuário: ${decodedToken?.sub || 'Erro na verificação'}`);

    if (!decodedToken || !["admin", "superadmin"].includes(decodedToken.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Update payment status
    const resultado = await marcarPagamentoRealizado(slug, cli_id, categoriaPremio);
    // console.log(`[PUT] - Resultado da atualização de pagamento:`, resultado);

    return NextResponse.json(resultado, { status: 200 });

  } catch (error) {
    // console.error("[PUT] - Erro ao atualizar pagamento:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}

async function calcularDadosFinanceiros(jogo) {
  try {
    // 1. Retrieve all bets for the game
    const apostas = await getApostasByJogo(jogo.jog_id);
    if (apostas.length === 0) {
      throw new Error("Nenhuma aposta registrada para este jogo.");
    }

    // 2. Calculate total collected
    const totalArrecadado = apostas.reduce((total, aposta) => 
      total + (parseFloat(aposta.valor) || 0), 0
    );

    // 3. Calculate prize distribution based on game configuration
    let distribuicaoPremios;
    if (jogo.premiation.fixedPremiation) {
      distribuicaoPremios = calcularDistribuicaoPremiosFixed(
        totalArrecadado,
        jogo.premiation.fixedPremiation
      );
    } else if (jogo.premiation.pointPrizes) {
      distribuicaoPremios = calcularDistribuicaoPremiosPoint(
        totalArrecadado,
        jogo.premiation.pointPrizes
      );
    } else {
      throw new Error("Configuração de premiação inválida.");
    }

    // 4. Process bet results
    const numerosSorteados = await getAllSorteadosByJogo(jogo.jog_id);
    const pontosPorAcerto = parseFloat(jogo.pontosPorAcerto) || 1;
    const resultadoApostas = await processarApostas(apostas, numerosSorteados, pontosPorAcerto);

    // 5. Determine winners
    const vencedores = determinarVencedores(resultadoApostas);

    // 6. Distribute prizes
    const premiacoes = await distribuirPremios(jogo, vencedores, distribuicaoPremios);
    // console.log('Premiações distribuídas:', premiacoes);

    // Ensure premiacoes is an array before saving to history
    const premiacoesArray = Array.isArray(premiacoes) ? premiacoes : Object.values(premiacoes).flat();

    // 7. Save financial history
    await salvarHistoricoFinanceiro(jogo.jog_id, {
      totalArrecadado,
      distribuicaoPremios,
      resultadoApostas,
      vencedores,
      premiacoes: premiacoesArray
    });

    // 8. Prepare response
    return {
      jog_id: jogo.jog_id,
      jog_nome: jogo.jog_nome,
      total_arrecadado: totalArrecadado,
      custos_administrativos: distribuicaoPremios.custosAdministrativos,
      valor_liquido_premiacao: totalArrecadado - distribuicaoPremios.custosAdministrativos,
      premiacoes_totais: {
        campeao: distribuicaoPremios.campeao,
        vice: distribuicaoPremios.vice,
        menos_pontos: distribuicaoPremios.ultimoColocado
      },
      premiacoes: premiacoes,
      status: jogo.jog_status
    };
  } catch (error) {
    // console.error("Erro ao calcular dados financeiros:", error);
    throw error;
  }
}

function calcularDistribuicaoPremiosFixed(totalArrecadado, fixedPremiation) {
  const distribuicao = {};
  const categorias = ['campeao', 'vice', 'ultimoColocado', 'custosAdministrativos'];

  categorias.forEach(categoria => {
    const porcentagem = parseFloat(fixedPremiation[categoria]);
    if (isNaN(porcentagem)) {
      distribuicao[categoria] = 0;
    } else {
      distribuicao[categoria] = parseFloat((totalArrecadado * (porcentagem / 100)).toFixed(2));
    }
  });

  return distribuicao;
}

function calcularDistribuicaoPremiosPoint(totalArrecadado, pointPrizes) {
  const distribuicao = {
    custosAdministrativos: parseFloat((totalArrecadado * 0.10).toFixed(2))
  };

  const valorLiquido = totalArrecadado - distribuicao.custosAdministrativos;
  const totalPontos = pointPrizes.reduce((acc, prize) => acc + prize.porcentagem, 0);

  pointPrizes.forEach(prize => {
    distribuicao[prize.categoria] = parseFloat(
      (valorLiquido * (prize.porcentagem / totalPontos)).toFixed(2)
    );
  });

  return distribuicao;
}

async function processarApostas(apostas, numerosSorteados, pontosPorAcerto) {
  const processadas = [];
  const clientesIds = [...new Set(apostas.map(a => a.cli_id))];
  const clientesInfo = await getClientesInfo(clientesIds);

  for (const aposta of apostas) {
    const numerosApostados = aposta.palpite_numbers.map(String);
    const acertos = numerosApostados.filter(num => numerosSorteados.includes(num));
    const pontos = acertos.length * pontosPorAcerto;

    processadas.push({
      ...aposta,
      nome: clientesInfo[aposta.cli_id]?.cli_nome || 'Nome não encontrado',
      email: clientesInfo[aposta.cli_id]?.cli_email || 'Email não encontrado',
      telefone: clientesInfo[aposta.cli_id]?.cli_telefone || 'Telefone não encontrado',
      acertos,
      pontos_totais: pontos,
      statusPago: aposta.status, 
      MetodoPagamento: aposta.metodo_pagamento 
    });
  }

  return processadas;
}

async function distribuirPremios(jogo, vencedores, distribuicaoPremios) {
  const premiacoes = {};
  const categorias = {
    campeao: vencedores.campeao,
    vice: vencedores.vice,
    ultimoColocado: vencedores.menos_pontos
  };

  for (const [categoria, ganhadores] of Object.entries(categorias)) {
    if (ganhadores.length === 0) {
      premiacoes[categoria] = [];
      continue;
    }

    const valorPremio = distribuicaoPremios[categoria];
    const premioPorPessoa = isNaN(valorPremio) ? 0 : parseFloat((valorPremio / ganhadores.length).toFixed(2));

    const premiadosCategoria = await Promise.all(ganhadores.map(async (ganhador) => {
      const premiacaoId = `${jogo.slug}_${ganhador.cli_id}_${categoria}`;
      
      const premiacaoExistente = await getPremiacaoById(premiacaoId);
      if (premiacaoExistente) {
        // Ensure we use the existing payment status if available
        return {
          ...premiacaoExistente,
          statusPago: ganhador.statusPago || premiacaoExistente.statusPago,
          MetodoPagamento: ganhador.MetodoPagamento || premiacaoExistente.MetodoPagamento
        };
      }

      const premiacao = {
        premiacao_id: premiacaoId,
        jog_id: jogo.jog_id,
        cli_id: ganhador.cli_id,
        nome: ganhador.nome,
        email: ganhador.email,
        telefone: ganhador.telefone,
        categoria,
        premio: premioPorPessoa,
        pontos_totais: ganhador.pontos_totais,
        pago: false, // Default to false if new record
        statusPago: ganhador.statusPago,
        MetodoPagamento: ganhador.MetodoPagamento,
        data_criacao: new Date().toISOString(),
        data_pagamento: null
      };

      await salvarPremiacao(premiacao);
      return premiacao;
    }));

    premiacoes[categoria] = premiadosCategoria;
  }

  return premiacoes;
}

async function salvarHistoricoFinanceiro(jogId, dados) {
  const historicoId = `hist_${jogId}_${Date.now()}`;
  
  // Check if premiacoes exists and is an array before mapping
  const premiacoesArray = Array.isArray(dados.premiacoes) ? dados.premiacoes : [];

  const historicoItem = {
    historico_id: historicoId,
    jog_id: jogId,
    ...dados,
    premiacoes: premiacoesArray.map(premiacao => ({
      ...premiacao,
      statusPago: premiacao.statusPago,
      MetodoPagamento: premiacao.MetodoPagamento
    })),
    data_registro: new Date().toISOString()
  };

  const putParams = {
    TableName: "HistoricoFinanceiro",
    Item: marshall(historicoItem)
  };

  try {
    await dynamoDbClient.send(new PutItemCommand(putParams));
  } catch (error) {
    // console.error("Erro ao salvar histórico financeiro:", error);
    throw error;
  }
}

async function marcarPagamentoRealizado(slug, cli_id, categoria) {
  const jogo = await getJogoBySlug(slug);
  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const premiacaoId = `${jogo.jog_id}_${cli_id}_${categoria}`;
  
  const updateParams = {
    TableName: "Premiacoes",
    Key: marshall({ premiacao_id: premiacaoId }),
    UpdateExpression: "SET pago = :pago, data_pagamento = :data, statusPago = :statusPago",
    ExpressionAttributeValues: marshall({
      ":pago": true,
      ":data": new Date().toISOString(),
      ":statusPago": "confirmado"
    }),
    ReturnValues: "ALL_NEW"
  };

  try {
    const result = await dynamoDbClient.send(new UpdateItemCommand(updateParams));
    return {
      message: "Pagamento marcado como realizado com sucesso.",
      premiacao: unmarshall(result.Attributes)
    };
  } catch (error) {
    console.error("Erro ao marcar pagamento:", error);
    throw error;
  }
}

// Helper functions for database access
async function getJogoBySlug(slug) {
  const queryParams = {
    TableName: "Jogos",
    IndexName: "slug-index",
    KeyConditionExpression: "slug = :slug",
    ExpressionAttributeValues: marshall({
      ":slug": slug
    })
  };

  try {
    const result = await dynamoDbClient.send(new QueryCommand(queryParams));
    if (!result.Items || result.Items.length === 0) return null;
    return unmarshall(result.Items[0]);
  } catch (error) {
    console.error("Erro ao buscar jogo:", error);
    throw error;
  }
}

async function getApostasByJogo(jogId) {
  const queryParams = {
    TableName: "Apostas",
    IndexName: "jog_id-index",
    KeyConditionExpression: "jog_id = :jog_id",
    ExpressionAttributeValues: marshall({
      ":jog_id": jogId
    })
  };

  try {
    const result = await dynamoDbClient.send(new QueryCommand(queryParams));
    return result.Items ? result.Items.map(item => unmarshall(item)) : [];
  } catch (error) {
    // console.error("Erro ao buscar apostas:", error);
    throw error;
  }
}

async function getAllSorteadosByJogo(jogId) {
  const queryParams = {
    TableName: "Sorteios",
    IndexName: "jog_id-index",
    KeyConditionExpression: "jog_id = :jog_id",
    ExpressionAttributeValues: marshall({
      ":jog_id": jogId
    })
  };

  try {
    const result = await dynamoDbClient.send(new QueryCommand(queryParams));
    if (!result.Items || result.Items.length === 0) return [];

    const todosNumeros = result.Items.flatMap(item => {
      const sorteio = unmarshall(item);
      return sorteio.numerosSorteados.split(',').map(num => num.trim());
    });

    return [...new Set(todosNumeros)];
  } catch (error) {
    // console.error("Erro ao buscar números sorteados:", error);
    throw error;
  }
}

async function getClientesInfo(clienteIds) {
  if (!clienteIds || clienteIds.length === 0) return {};

  const clientesInfo = {};
  const batchSize = 25; // DynamoDB limit for BatchGetItem

  for (let i = 0; i < clienteIds.length; i += batchSize) {
    const batchIds = clienteIds.slice(i, i + batchSize);
    const keys = batchIds.map(id => ({
      cli_id: { S: id }
    }));

    const batchParams = {
      RequestItems: {
        Cliente: {
          Keys: keys
        }
      }
    };

    try {
      const result = await dynamoDbClient.send(new BatchGetItemCommand(batchParams));
      const items = result.Responses?.Cliente || [];
      
      items.forEach(item => {
        const cliente = unmarshall(item);
        clientesInfo[cliente.cli_id] = cliente;
      });
    } catch (error) {
      // console.error("Erro ao buscar informações dos clientes:", error);
      throw error;
    }
  }

  return clientesInfo;
}

async function getPremiacaoById(premiacaoId) {
  const getParams = {
    TableName: "Premiacoes",
    Key: marshall({
      premiacao_id: premiacaoId
    })
  };

  try {
    const result = await dynamoDbClient.send(new GetItemCommand(getParams));
    return result.Item ? unmarshall(result.Item) : null;
  } catch (error) {
    // console.error("Erro ao buscar premiação:", error);
    throw error;
  }
}

async function salvarPremiacao(premiacao) {
  // Ensure all numeric fields are not NaN before marshalling
  const safePremiacao = {
    ...premiacao,
    premio: isNaN(premiacao.premio) ? 0 : premiacao.premio,
    pontos_totais: isNaN(premiacao.pontos_totais) ? 0 : premiacao.pontos_totais
  };

  const putParams = {
    TableName: "Premiacoes",
    Item: marshall(safePremiacao),
    ConditionExpression: "attribute_not_exists(premiacao_id)"
  };

  try {
    await dynamoDbClient.send(new PutItemCommand(putParams));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn("Premiação já existe:", premiacao.premiacao_id);
      return;
    }
    console.error("Erro ao salvar premiação:", error);
    throw error;
  }
}

function determinarVencedores(resultadoApostas) {
  // Sort bets by points (descending)
  const apostasPorPontos = [...resultadoApostas].sort(
    (a, b) => b.pontos_totais - a.pontos_totais
  );

  // Identify unique scores
  const pontuacoes = [...new Set(apostasPorPontos.map(a => a.pontos_totais))];

  // Champions (10 points or more)
  const campeao = apostasPorPontos.filter(a => a.pontos_totais >= 10);

  // Vice (exactly 9 points)
  const vice = apostasPorPontos.filter(a => a.pontos_totais === 9);

  // Lowest score
  const menorPontuacao = Math.min(...pontuacoes);
  const menos_pontos = apostasPorPontos.filter(
    a => a.pontos_totais === menorPontuacao
  );

  return {
    campeao,
    vice,
    menos_pontos
  };
}

async function buscarPremiado(premiacaoId) {
  const getParams = {
    TableName: "Premiacoes",
    Key: marshall({
      premiacao_id: premiacaoId,
    }),
    ProjectionExpression: "pago", // Adicione essa linha para retornar apenas o campo 'pago'
  };

  try {
    const command = new GetItemCommand(getParams);
    const result = await dynamoDbClient.send(command);

    if (result.Item) {
      const { pago } = unmarshall(result.Item);
      return pago; // Retorne apenas o valor do campo 'pago'
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar premiado:", error);
    throw error;
  }
}

async function atualizarStatusPagamento(premiacoes) {
  for (const categoria in premiacoes) {
    for (let premiacao of premiacoes[categoria]) {
      const premiacaoExistente = await getPremiacaoById(premiacao.premiacao_id);
      if (premiacaoExistente) {
        premiacao.pago = premiacaoExistente.pago;
        premiacao.data_pagamento = premiacaoExistente.data_pagamento;
      }
    }
  }
}