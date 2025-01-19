// frontend/src/app/api/jogos/[slug]/process-premiacao-client/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  BatchGetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request, context) {
  try {
    const params = context.params;
    const { slug } = params;

    if (!slug) {
      console.error('Slug não fornecido.');
      return NextResponse.json(
        { error: 'Slug não fornecido.' },
        { status: 400 }
      );
    }

    // Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');

    if (!authorizationHeader) {
      return NextResponse.json(
        { error: 'Cabeçalho de autorização ausente.' },
        { status: 401 }
      );
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    // Recuperação de Dados do Jogo
    const jogo = await getJogoBySlug(slug);

    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    // Recuperar os Números Sorteados
    const numerosSorteados = await getAllSorteadosByJogo(jogo.jog_id);

    if (!numerosSorteados || numerosSorteados.length === 0) {
      return NextResponse.json(
        { error: 'Números sorteados não definidos para o jogo.' },
        { status: 400 }
      );
    }

    // Cálculo da Premiação
    const totalArrecadado = await calcularTotalArrecadado(jogo.jog_id);

    if (totalArrecadado === 0) {
      return NextResponse.json(
        { error: 'Nenhum valor arrecadado para este jogo.' },
        { status: 400 }
      );
    }

    const pontosPorAcerto = parseFloat(jogo.pontosPorAcerto) || 1;
    const premiation = jogo.premiation;

    if (!premiation) {
      return NextResponse.json(
        { error: 'Configurações de premiação não definidas.' },
        { status: 400 }
      );
    }

    let distribuicaoPremios = {};
    if (premiation.fixedPremiation) {
      distribuicaoPremios = calcularDistribuicaoPremiosFixed(
        totalArrecadado,
        premiation.fixedPremiation
      );
    } else if (premiation.pointPrizes && premiation.pointPrizes.length > 0) {
      distribuicaoPremios = calcularDistribuicaoPremiosPoint(
        totalArrecadado,
        premiation.pointPrizes
      );
    } else {
      return NextResponse.json(
        { error: 'Tipo de premiação não reconhecido.' },
        { status: 400 }
      );
    }

    // Processamento das Apostas
    const apostas = await getApostasByJogo(jogo.jog_id);
    if (apostas.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma aposta registrada para este jogo.' },
        { status: 400 }
      );
    }

    const resultadoApostas = await processarApostas(
      apostas,
      numerosSorteados,
      pontosPorAcerto
    );

    // Determinação dos Vencedores
    const vencedores = determinarVencedores(resultadoApostas);

    // Distribuição dos Prêmios (valores líquidos)
    const premios = distribuirPremiosLiquidos(vencedores, distribuicaoPremios);

    // Verificação de ganhador máximo
    const algumGanhadorMaximo = vencedores.campeao.length > 0;

    // Retorno dos Resultados
    return NextResponse.json(
      {
        jogo: {
          jog_id: jogo.jog_id,
          jog_nome: jogo.jog_nome,
          status: algumGanhadorMaximo ? 'encerrado' : jogo.jog_status,
          data_inicio: jogo.data_inicio,
          data_fim: jogo.data_fim,
        },
        totalArrecadado: calcularValorLiquido(totalArrecadado, distribuicaoPremios.custosAdministrativos),
        distribuicaoPremiosLiquida: {
          campeao: calcularValorLiquido(distribuicaoPremios.campeao, 0),
          vice: calcularValorLiquido(distribuicaoPremios.vice, 0),
          ultimoColocado: calcularValorLiquido(distribuicaoPremios.ultimoColocado, 0)
        },
        resultadosApostas: resultadoApostas,
        vencedores,
        premiacoes: {
          campeao: premios.campeao || [],
          vice: premios.vice || [],
          ultimoColocado: premios.ultimoColocado || []
        },
        numerosSorteados,
        historicoSorteios: await getHistoricoSorteios(jogo.jog_id)
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

function calcularValorLiquido(valor, custos) {
  return valor - (custos || 0);
}

async function getJogoBySlug(slug) {
  const queryParams = {
    TableName: 'Jogos',
    IndexName: 'slug-index',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: marshall({
      ':slug': slug,
    }),
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return null;
    }

    return unmarshall(queryResult.Items[0]);
  } catch (error) {
    throw error;
  }
}

async function getAllSorteadosByJogo(jog_id) {
  const queryParams = {
    TableName: 'Sorteios',
    IndexName: 'jog_id-index',
    KeyConditionExpression: 'jog_id = :jog_id',
    ExpressionAttributeValues: marshall({
      ':jog_id': jog_id,
    }),
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return [];
    }

    const todosNumeros = queryResult.Items.flatMap(item => {
      const sorteio = unmarshall(item);
      if (sorteio.numerosSorteados) {
        return sorteio.numerosSorteados.split(',').map(num => num.trim());
      }
      return [];
    });

    return [...new Set(todosNumeros)];
  } catch (error) {
    throw error;
  }
}

async function getHistoricoSorteios(jog_id) {
  const queryParams = {
    TableName: 'Sorteios',
    IndexName: 'jog_id-index',
    KeyConditionExpression: 'jog_id = :jog_id',
    ExpressionAttributeValues: marshall({
      ':jog_id': jog_id,
    }),
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return [];
    }

    const sorteios = queryResult.Items.map(item => unmarshall(item));
    sorteios.sort((a, b) => new Date(a.data_fim) - new Date(b.data_fim));

    return sorteios.map((sorteio, index) => ({
      sorteio_id: sorteio.sorteio_id,
      ordem: sorteios.length - index,
      descricao: sorteio.descricao,
      data_sorteio: sorteio.dataSorteio,
      numerosSorteados: sorteio.numerosSorteados.split(',').map(num => num.trim()),
      numerosArray: sorteio.numerosSorteados.split(',').map(num => num.trim()),
      duplicacoesDetalhadas: sorteio.duplicacoesDetalhadas || [],
    }));
  } catch (error) {
    throw error;
  }
}

async function calcularTotalArrecadado(jog_id) {
  const queryParams = {
    TableName: 'Apostas',
    IndexName: 'jog_id-index',
    KeyConditionExpression: 'jog_id = :jog_id',
    ExpressionAttributeValues: marshall({
      ':jog_id': jog_id,
    }),
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    const apostas = (queryResult.Items || []).map(item => unmarshall(item));
    return apostas.reduce((acc, aposta) => acc + parseFloat(aposta.valor || 0), 0);
  } catch (error) {
    throw error;
  }
}

function calcularDistribuicaoPremiosFixed(totalArrecadado, fixedPremiation) {
  const categorias = ['campeao', 'vice', 'ultimoColocado', 'custosAdministrativos'];
  const distribuicao = {};

  categorias.forEach(categoria => {
    const porcentagem = parseFloat(fixedPremiation[categoria]);
    distribuicao[categoria] = isNaN(porcentagem) ? 0 : parseFloat((totalArrecadado * (porcentagem / 100)).toFixed(2));
  });

  return distribuicao;
}

function calcularDistribuicaoPremiosPoint(totalArrecadado, pointPrizes) {
  const distribuicao = {
    campeao: 0,
    vice: 0,
    ultimoColocado: 0,
    custosAdministrativos: parseFloat((totalArrecadado * 0.10).toFixed(2))
  };

  const restante = totalArrecadado - distribuicao.custosAdministrativos;
  const totalPontos = pointPrizes.reduce((acc, prize) => acc + prize.porcentagem, 0);

  pointPrizes.forEach(prize => {
    distribuicao[prize.pontos] = parseFloat((restante * (prize.porcentagem / totalPontos)).toFixed(2));
  });

  return distribuicao;
}

async function getApostasByJogo(jog_id) {
  const queryParams = {
    TableName: 'Apostas',
    IndexName: 'jog_id-index',
    KeyConditionExpression: 'jog_id = :jog_id',
    ExpressionAttributeValues: marshall({
      ':jog_id': jog_id,
    }),
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);
    return (queryResult.Items || []).map(item => unmarshall(item));
  } catch (error) {
    throw error;
  }
}

async function obterNomesClientes(cli_ids) {
  if (cli_ids.length === 0) return {};

  const nomesMap = {};
  const batchSize = 100;
  
  for (let i = 0; i < cli_ids.length; i += batchSize) {
    const batch = cli_ids.slice(i, i + batchSize);
    const getRequests = batch.map(cli_id => ({
      cli_id: { S: cli_id },
    }));

    const params = {
      RequestItems: {
        Cliente: {
          Keys: getRequests,
        },
      },
    };

    try {
      const batchGetCommand = new BatchGetItemCommand(params);
      const batchGetResult = await dynamoDbClient.send(batchGetCommand);
      const clientes = (batchGetResult.Responses?.Cliente || []).map(item => unmarshall(item));
      clientes.forEach(cliente => {
        nomesMap[cliente.cli_id] = cliente.cli_nome;
      });
    } catch (error) {
      throw error;
    }
  }

  return nomesMap;
}

async function processarApostas(apostas, numerosSorteados, pontosPorAcerto) {
  if (apostas.length === 0) return [];

  const clientIds = apostas.map(aposta => aposta.cli_id);
  const uniqueClientIds = [...new Set(clientIds)];
  const nomesMap = await obterNomesClientes(uniqueClientIds);

  return apostas.map(aposta => {
    const numerosApostados = aposta.palpite_numbers.map(String);
    const acertos = numerosApostados.filter(num => numerosSorteados.includes(num));
    const pontos = acertos.length * pontosPorAcerto;

    return {
      aposta_id: aposta.aposta_id,
      cli_id: aposta.cli_id,
      nome: nomesMap[aposta.cli_id] || 'Nome Não Encontrado',
      palpite_numbers: numerosApostados,
      numeros_acertados: acertos,
      quantidade_acertos: acertos.length,
      pontos_totais: pontos,
    };
  });
}

function determinarVencedores(resultadoApostas) {
  const campeaoApostas = resultadoApostas.filter(
    aposta => aposta.pontos_totais >= 10
  );

  const viceApostas = resultadoApostas.filter(
    aposta => aposta.pontos_totais === 9
  );

  const pontos = resultadoApostas.map(aposta => aposta.pontos_totais);
  const menorPonto = Math.min(...pontos);
  const ultimoColocadoApostas = resultadoApostas.filter(
    aposta => aposta.pontos_totais === menorPonto
  );

  return {
    campeao: campeaoApostas,
    vice: viceApostas,
    ultimoColocado: ultimoColocadoApostas,
  };
}

function distribuirPremiosLiquidos(vencedores, distribuicao) {
  const premios = {};

  const distribuir = (categoria, ganhadoresArray) => {
    if (ganhadoresArray.length === 0) {
      premios[categoria] = [];
      return;
    }

    const valorTotal = distribuicao[categoria];
    if (valorTotal === undefined) {
      premios[categoria] = ganhadoresArray.map(ganhador => ({
        nome: ganhador.nome || 'N/A',
        pontos: ganhador.pontos_totais || 0,
        premio: 0,
      }));
      return;
    }

    // Calcula o valor por ganhador já descontando custos administrativos
    const valorLiquido = categoria === 'custosAdministrativos' ? 0 : valorTotal;
    const valorPorGanhador = valorLiquido / ganhadoresArray.length;

    premios[categoria] = ganhadoresArray.map(ganhador => ({
      nome: ganhador.nome || 'N/A',
      pontos: ganhador.pontos_totais || 0,
      premio: parseFloat(valorPorGanhador.toFixed(2)),
    }));
  };

  distribuir('campeao', vencedores.campeao);
  distribuir('vice', vencedores.vice);
  distribuir('ultimoColocado', vencedores.ultimoColocado);

  return premios;
}

export default POST;