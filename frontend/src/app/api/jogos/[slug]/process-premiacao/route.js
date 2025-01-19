// frontend/src/app/api/jogos/[slug]/process-premiacao/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  UpdateItemCommand,
  BatchGetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * Inicialização do cliente DynamoDB
 */
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler POST - Processa a premiação de um jogo específico.
 */
export async function POST(request, context) {
  try {
    // Recuperar os parâmetros da URL
    const params = context.params;
    const { slug } = params;

    if (!slug) {
      console.error('Slug não fornecido.');
      return NextResponse.json(
        { error: 'Slug não fornecido.' },
        { status: 400 }
      );
    }

    // 1. Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');

    if (!authorizationHeader) {
      return NextResponse.json(
        { error: 'Cabeçalho de autorização ausente.' },
        { status: 401 }
      );
    }

    const token = authorizationHeader.split(' ')[1];

    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      !['admin', 'superadmin'].includes(decodedToken.role)
    ) {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    // 2. Recuperação de Dados do Jogo
    const jogo = await getJogoBySlug(slug);
    console.log('Jogo Recuperado:', jogo);

    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    // Verificar se o jogo já está encerrado
    if (jogo.jog_status === 'encerrado') {
      return NextResponse.json(
        { error: 'O jogo já está encerrado.' },
        { status: 400 }
      );
    }

    // 3. Recuperar os Números Sorteados de Todos os Sorteios
    const numerosSorteados = await getAllSorteadosByJogo(jogo.jog_id);

    if (!numerosSorteados || numerosSorteados.length === 0) {
      console.error('Números sorteados não definidos para o jogo.');
      return NextResponse.json(
        { error: 'Números sorteados não definidos para o jogo.' },
        { status: 400 }
      );
    }

    console.log('Números Sorteados:', numerosSorteados);

    // 4. Recuperar Dados do Criador
    const criador = await getCreatorDetails(
      jogo.creator_id,
      jogo.creator_role
    );
    console.log('Criador Recuperado:', criador);

    if (!criador) {
      console.error('Detalhes do criador não encontrados.');
      return NextResponse.json(
        { error: 'Detalhes do criador não encontrados.' },
        { status: 404 }
      );
    }

    // 5. Cálculo da Premiação
    const totalArrecadado = await calcularTotalArrecadado(jogo.jog_id);
    console.log('Total Arrecadado:', totalArrecadado);

    if (totalArrecadado === 0) {
      return NextResponse.json(
        { error: 'Nenhum valor arrecadado para este jogo.' },
        { status: 400 }
      );
    }

    // Definir pontosPorAcerto conforme as regras do jogo
    const pontosPorAcerto = parseFloat(jogo.pontosPorAcerto) || 1;

    const premiation = jogo.premiation; // Usando 'premiation' conforme definido na criação
    console.log('Configurações de Premiação:', premiation);

    if (!premiation) {
      console.error('Configurações de premiação não definidas.');
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

    // 6. Processamento das Apostas
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

    // 7. Determinação dos Vencedores
    const vencedores = determinarVencedores(resultadoApostas);

    // 8. Distribuição dos Prêmios
    const premios = distribuirPremios(vencedores, distribuicaoPremios);

    // 9. Verificação de ganhador máximo
    const algumGanhadorMaximo = vencedores.campeao.length > 0;

    if (algumGanhadorMaximo) {
      await atualizarStatusJogo(jogo.jog_id, 'encerrado');
      console.log('Status do jogo atualizado para encerrado.');
    }

    // 10. Atualização do jogo com totalArrecadado e premiacoes
    await atualizarJogoPremiacao(jogo.jog_id, totalArrecadado, distribuicaoPremios);

    // 11. Retorno dos Resultados
    const premiacoesResponse = {
      jog_id: jogo.jog_id,
      premiacoes: {
        campeao: premios.campeao || [],
        vice: premios.vice || [],
        ultimoColocado: premios.ultimoColocado || [],
      },
      status: {
        totalArrecadado,
        distribuicaoPremios,
        algumGanhadorMaximo
      },
      data_processamento: new Date().toISOString()
    };

    await salvarPremiacoes(
      jogo.jog_id,
      totalArrecadado,
      distribuicaoPremios.custosAdministrativos || 0, // Substitua se for diferente
      totalArrecadado - (distribuicaoPremios.custosAdministrativos || 0),
      premios
    );

    return NextResponse.json(
      {
        jogo: {
          jog_id: jogo.jog_id,
          jog_nome: jogo.jog_nome,
          status: algumGanhadorMaximo ? 'encerrado' : jogo.jog_status,
          data_inicio: jogo.data_inicio,
          data_fim: jogo.data_fim,
        },
        criador,
        totalArrecadado,
        distribuicaoPremios,
        resultadosApostas: resultadoApostas,
        vencedores,
        premiacoes: premiacoesResponse.premiacoes,
        numerosSorteados, // Incluindo os números sorteados
        historicoSorteios: await getHistoricoSorteios(jogo.jog_id), // Função para obter histórico de sorteios
      },
      { status: 200 }
    );

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'Tabela DynamoDB não encontrada.' },
        { status: 500 }
      );
    }

    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json(
        { error: 'ID do jogo já existe.' },
        { status: 400 }
      );
    }

    if (
      error.name === 'CredentialsError' ||
      error.message.includes('credentials')
    ) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    // Retornar erro genérico
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Função para salvar as informações de premiação no documento do jogo
async function salvarPremiacoes(jog_id, totalArrecadado, custosAdministrativos, valorLiquidoPremiacao, premiacoes) {
  const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
      UpdateExpression: `
          SET 
              totalArrecadado = :totalArrecadado,
              custosAdministrativos = :custosAdministrativos,
              valorLiquidoPremiacao = :valorLiquidoPremiacao,
              premiacoes = :premiacoes,
              #tp = :totalCampeao,
              #tv = :totalVice,
              #tu = :totalUltimoColocado
      `,
      ExpressionAttributeNames: {
          '#tp': 'totalCampeao',
          '#tv': 'totalVice',
          '#tu': 'totalUltimoColocado',
      },
      ExpressionAttributeValues: marshall({
          ':totalArrecadado': totalArrecadado,
          ':custosAdministrativos': custosAdministrativos,
          ':valorLiquidoPremiacao': valorLiquidoPremiacao,
          ':premiacoes': premiacoes,
          ':totalCampeao': calcularTotalPremiacao(premiacoes.campeao),
          ':totalVice': calcularTotalPremiacao(premiacoes.vice),
          ':totalUltimoColocado': calcularTotalPremiacao(premiacoes.ultimo_colocado),
      }),
      ReturnValues: 'ALL_NEW',
  };

  try {
      const updateCommand = new UpdateItemCommand(updateParams);
      const result = await dynamoDbClient.send(updateCommand);
      console.log('Informações de premiação salvas com sucesso.', result);
  } catch (error) {
      console.error('Erro ao salvar informações de premiação:', error);
      throw error;
  }
}

// Função auxiliar para calcular o valor total de uma premiação
function calcularTotalPremiacao(vencedores) {
  if (!vencedores || vencedores.length === 0) return 0;
  return vencedores.reduce((total, vencedor) => total + (vencedor.premio || 0), 0);
}

/**
 * Recupera os detalhes do jogo pelo slug.
 */
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
      console.error('Nenhum jogo encontrado com o slug fornecido.');
      return null;
    }

    const jogo = unmarshall(queryResult.Items[0]);
    return jogo;
  } catch (error) {
    throw error;
  }
}

/**
 * Recupera todos os números sorteados de todos os sorteios para o jogo.
 */
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

    // Coletar todos os números sorteados de todos os sorteios
    const todosNumeros = queryResult.Items.flatMap(item => {
      const sorteio = unmarshall(item);
      if (sorteio.numerosSorteados) {
        return sorteio.numerosSorteados.split(',').map(num => num.trim());
      }
      return [];
    });

    // Remover duplicatas
    const numerosUnicos = [...new Set(todosNumeros)];

    return numerosUnicos;
  } catch (error) {
    throw error;
  }
}

/**
 * Recupera o histórico de sorteios para o jogo.
 */
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

    // Ordenar os sorteios por data_fim (assumindo que data_fim indica a ordem)
    const sorteios = queryResult.Items.map(item => unmarshall(item));
    sorteios.sort((a, b) => new Date(a.data_fim) - new Date(b.data_fim));

    // Retornar uma lista de objetos com ordem, descrição, data do sorteio e números sorteados
    return sorteios.map((sorteio, index) => ({
      sorteio_id: sorteio.sorteio_id,
      ordem: sorteios.length - index,
      descricao: sorteio.descricao,
      data_sorteio: sorteio.dataSorteio, // Correção aqui
      numerosSorteados: sorteio.numerosSorteados.split(',').map(num => num.trim()),
      numerosArray: sorteio.numerosSorteados.split(',').map(num => num.trim()), // Adicionado
      duplicacoesDetalhadas: sorteio.duplicacoesDetalhadas || [], // Adiciona duplicações detalhadas se disponíveis
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Recupera os detalhes do criador com base no ID e no role.
 */
async function getCreatorDetails(creatorId, role) {
  let tableName = '';
  let keyName = '';

  switch (role) {
    case 'cliente':
      tableName = 'Cliente';
      keyName = 'cli_id';
      break;
    case 'admin':
    case 'superadmin':
      tableName = 'Admin';
      keyName = 'adm_id';
      break;
    default:
      console.error(`Role inválido: ${role}`);
      return null;
  }

  const getParams = {
    TableName: tableName,
    Key: marshall({ [keyName]: creatorId }),
  };

  try {
    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);
    console.log('Resultado da Query de Criador:', getResult);

    if (!getResult.Item) {
      console.error(`Criador com ID ${creatorId} não encontrado na tabela ${tableName}.`);
      return null;
    }

    const criador = unmarshall(getResult.Item);
    console.log('Criador Desmarshalled:', criador);

    // Remover campos sensíveis
    if (role === 'cliente') {
      delete criador.cli_password;
      console.log('Campo cli_password removido.');
    }
    if (role === 'admin' || role === 'superadmin') {
      delete criador.adm_password;
      console.log('Campo adm_password removido.');
    }

    return criador;
  } catch (error) {
    console.error('Erro ao buscar criador:', error);
    throw error;
  }
}

/**
 * Calcula o total arrecadado por um jogo.
 */
async function calcularTotalArrecadado(jog_id) {
  console.log(`Calculando total arrecadado para o jogo ID: ${jog_id}`);
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

    const total = apostas.reduce(
      (acc, aposta) => acc + parseFloat(aposta.valor || 0),
      0
    );
    return total;
  } catch (error) {
    console.error('Erro ao calcular total arrecadado:', error);
    throw error;
  }
}

/**
 * Calcula a distribuição dos prêmios para premiação fixa.
 */
function calcularDistribuicaoPremiosFixed(totalArrecadado, fixedPremiation) {
  const categorias = ['campeao', 'vice', 'ultimoColocado', 'custosAdministrativos'];
  const distribuicao = {};

  categorias.forEach(categoria => {
    const porcentagemRaw = fixedPremiation[categoria];
    const porcentagem = parseFloat(porcentagemRaw);
    if (isNaN(porcentagem)) {
      distribuicao[categoria] = 0;
    } else {
      const valor = totalArrecadado * (porcentagem / 100);
      distribuicao[categoria] = parseFloat(valor.toFixed(2));
    }
  });

  console.log('Distribuição de Prêmios Calculada:', distribuicao);
  return distribuicao;
}

/**
 * Calcula a distribuição dos prêmios para premiação por pontuação.
 */
function calcularDistribuicaoPremiosPoint(totalArrecadado, pointPrizes) {
  const distribuicao = {
    campeao: 0,
    vice: 0,
    ultimoColocado: 0,
    custosAdministrativos: 0,
  };

  // Distribuir uma porcentagem fixa para custos administrativos
  distribuicao.custosAdministrativos = parseFloat((totalArrecadado * 0.10).toFixed(2)); // 10%

  // O restante será distribuído com base nos pointPrizes
  const restante = totalArrecadado - distribuicao.custosAdministrativos;

  // Distribuir proporcionalmente com base nos prêmios definidos
  const totalPontos = pointPrizes.reduce((acc, prize) => acc + prize.porcentagem, 0);
  pointPrizes.forEach(prize => {
    distribuicao[prize.pontos] = parseFloat((restante * (prize.porcentagem / totalPontos)).toFixed(2));
  });
  return distribuicao;
}

/**
 * Recupera todas as apostas de um jogo.
 */
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

    const apostas = (queryResult.Items || []).map(item => unmarshall(item));
    return apostas;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém os nomes dos clientes a partir dos cli_ids
 */
async function obterNomesClientes(cli_ids) {
  if (cli_ids.length === 0) return {};

  const nomesMap = {};
  const batchSize = 100; // Limite de BatchGetItem é 100 por chamada
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
      console.error('Erro ao obter nomes dos clientes:', error);
      throw error;
    }
  }

  return nomesMap;
}

/**
 * Processa cada aposta para calcular pontos e acertos.
 */
async function processarApostas(apostas, numerosSorteados, pontosPorAcerto) {
  if (apostas.length === 0) return [];

  // Obter nomes dos clientes
  const clientIds = apostas.map(aposta => aposta.cli_id);
  const uniqueClientIds = [...new Set(clientIds)];

  const nomesMap = await obterNomesClientes(uniqueClientIds);

  return apostas.map(aposta => {
    const numerosApostados = aposta.palpite_numbers.map(String); // Garantir que sejam strings
    const acertos = numerosApostados.filter(num => numerosSorteados.includes(num));
    const pontos = acertos.length * pontosPorAcerto;
    const nome = nomesMap[aposta.cli_id] || 'Nome Não Encontrado';

    return {
      aposta_id: aposta.aposta_id,
      cli_id: aposta.cli_id,
      nome,
      palpite_numbers: numerosApostados,
      numeros_acertados: acertos,
      quantidade_acertos: acertos.length,
      pontos_totais: pontos,
    };
  });
}

/**
 * Determina os vencedores com base nos pontos.
 */
function determinarVencedores(resultadoApostas) {
  // Campeão: quem fez >=10 pontos
  const campeaoApostas = resultadoApostas.filter(
    aposta => aposta.pontos_totais >= 10
  );

  // Vice-Campeão: quem fez ==9 pontos
  const viceApostas = resultadoApostas.filter(
    aposta => aposta.pontos_totais === 9
  );

  // Último Colocado: quem fez os menores pontos
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

/**
 * Distribui os prêmios entre os vencedores.
 */
function distribuirPremios(vencedores, distribuicao) {
  const premios = {};

  // Função para distribuir igualmente
  const distribuir = (categoria, ganhadoresArray) => {
    if (ganhadoresArray.length === 0) {
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

    const valorPorGanhador = valorTotal / ganhadoresArray.length;

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

/**
 * Atualiza o status do jogo.
 */
async function atualizarStatusJogo(jog_id, novoStatus) {
  const updateParams = {
    TableName: 'Jogos',
    Key: marshall({ jog_id }),
    UpdateExpression: 'SET jog_status = :status, jog_datamodificacao = :datamodificacao',
    ExpressionAttributeValues: marshall({
      ':status': novoStatus,
      ':datamodificacao': new Date().toISOString(),
    }),
    ReturnValues: 'ALL_NEW',
  };

  try {
    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);
    const jogoAtualizado = unmarshall(updateResult.Attributes);
    return jogoAtualizado;
  } catch (error) {
    console.error('Erro ao atualizar status do jogo:', error);
    throw error;
  }
}

/**
 * Atualiza o jogo com total arrecadado e premiacoes.
 */
async function atualizarJogoPremiacao(jog_id, totalArrecadado, distribuicaoPremios) {
  const updateParams = {
    TableName: 'Jogos',
    Key: marshall({ jog_id }),
    UpdateExpression: 'SET totalArrecadado = :total, premiacoes = :premiacoes, jog_datamodificacao = :datamodificacao',
    ExpressionAttributeValues: marshall({
      ':total': totalArrecadado,
      ':premiacoes': distribuicaoPremios,
      ':datamodificacao': new Date().toISOString(),
    }),
    ReturnValues: 'ALL_NEW',
  };

  try {
    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);
    const jogoAtualizado = unmarshall(updateResult.Attributes);
    return jogoAtualizado;
  } catch (error) {
    console.error('Erro ao atualizar premiacao do jogo:', error);
    throw error;
  }
}

export default POST;
