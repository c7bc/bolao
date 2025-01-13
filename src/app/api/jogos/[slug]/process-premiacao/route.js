// src/app/api/jogos/[slug]/process-premiacao/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

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
    const { slug } = context.params;

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

    // 3. Recuperar os Números Sorteados do Último Sorteio
    const sorteio = await getLatestSorteioByJogo(jogo.jog_id);

    if (!sorteio || !sorteio.numerosSorteados) {
      console.error('Números sorteados não definidos para o jogo.');
      return NextResponse.json(
        { error: 'Números sorteados não definidos para o jogo.' },
        { status: 400 }
      );
    }

    const numerosSorteados = sorteio.numerosSorteados
      .split(',')
      .map(num => num.trim());
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

    const resultadoApostas = processarApostas(
      apostas,
      numerosSorteados,
      jogo.pontosPorAcerto
    );
    // 7. Determinação dos Vencedores
    const vencedores = determinarVencedores(resultadoApostas, jogo.pontuacaoMaxima);

    // 8. Distribuição dos Prêmios
    const premios = distribuirPremios(vencedores, distribuicaoPremios);

    // 9. Verificação de ganhador máximo
    const algumGanhadorMaximo = vencedores.campeao.some(
      vencedor => vencedor.pontos_totais >= jogo.pontuacaoMaxima
    );

    if (algumGanhadorMaximo) {
      await atualizarStatusJogo(jogo.jog_id, 'encerrado');
      console.log('Status do jogo atualizado para encerrado.');
    }

    // 11. Retorno dos Resultados
    const premiacoes = {
      jog_id: jogo.jog_id,
      premiacoes: {
        campeao: premios.campeao || [],
        vice: premios.vice || [],
        ultimoColocado: premios.ultimoColocado || [],
        comissaoColaboradores: premios.comissaoColaboradores || []
      },
      status: {
        totalArrecadado,
        distribuicaoPremios,
        algumGanhadorMaximo
      },
      data_processamento: new Date().toISOString()
    };

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
        premiosDistribuidos: premios,
        premiacoes
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
 * Recupera o último sorteio realizado para o jogo.
 */
async function getLatestSorteioByJogo(jog_id) {
  const queryParams = {
    TableName: 'Sorteios',
    IndexName: 'jog_id-index',
    KeyConditionExpression: 'jog_id = :jog_id',
    ExpressionAttributeValues: marshall({
      ':jog_id': jog_id,
    }),
    ScanIndexForward: false, // Ordem decrescente para pegar o mais recente
    Limit: 1,
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return null;
    }

    const sorteio = unmarshall(queryResult.Items[0]);
    return sorteio;
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
    case 'colaborador':
      tableName = 'Colaborador';
      keyName = 'col_id';
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
    if (role === 'colaborador') {
      delete criador.col_password;
      console.log('Campo col_password removido.');
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
      (acc, aposta) => acc + parseFloat(aposta.valor_total || 0),
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
  const categorias = ['campeao', 'vice', 'ultimoColocado', 'custosAdministrativos', 'comissaoColaboradores'];
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
function calcularDistribuicaoPremiosPoint(totalArrecadado, pointPrizes) {;
  const distribuicao = {
    campeao: 0,
    vice: 0,
    ultimoColocado: 0,
    custosAdministrativos: 0,
    comissaoColaboradores: 0
  };

  // Exemplo de distribuição: você pode ajustar conforme necessário
  // Aqui, vamos distribuir uma porcentagem fixa para custos administrativos e comissão
  distribuicao.custosAdministrativos = totalArrecadado * 0.10; // 10%
  distribuicao.comissaoColaboradores = totalArrecadado * 0.05; // 5%

  // O restante será distribuído com base nos pointPrizes
  const restante = totalArrecadado - distribuicao.custosAdministrativos - distribuicao.comissaoColaboradores;

  // Distribuir proporcionalmente com base nos prêmios definidos
  const totalPontos = pointPrizes.reduce((acc, prize) => acc + prize.premio, 0);
  pointPrizes.forEach(prize => {
    distribuicao[prize.pontos] = restante * (prize.premio / totalPontos);
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
 * Processa cada aposta para calcular pontos e acertos.
 */
function processarApostas(apostas, numerosSorteados, pontosPorAcerto) {
  return apostas.map(aposta => {
    const numerosApostados = aposta.palpite_numbers
      .split(',')
      .map(num => num.trim());
    const acertos = numerosApostados.filter(num =>
      numerosSorteados.includes(num)
    );
    const pontos = acertos.length * pontosPorAcerto;

    return {
      aposta_id: aposta.aposta_id,
      cli_id: aposta.cli_id,
      palpite_numbers: numerosApostados,
      numeros_acertados: acertos,
      quantidade_acertos: acertos.length,
      pontos_totais: pontos,
      col_id: aposta.col_id,
    };
  });
}

/**
 * Determina os vencedores com base nos pontos.
 */
function determinarVencedores(resultadoApostas, pontuacaoMaxima) {
  const apostasOrdenadas = [...resultadoApostas].sort(
    (a, b) => b.pontos_totais - a.pontos_totais
  );

  if (apostasOrdenadas.length === 0) {
    return {
      campeao: [],
      vice: [],
      ultimoColocado: [],
    };
  }

  // Determinar Campeão
  const campeao = apostasOrdenadas.filter(
    aposta => aposta.pontos_totais >= pontuacaoMaxima
  );

  // Determinar Vice-Campeão
  let vice = [];
  if (campeao.length === 0) {
    // Se nenhum campeão com pontuação máxima, considerar o primeiro colocado
    const primeiroColocado = apostasOrdenadas[0];
    vice = apostasOrdenadas.filter(
      aposta => aposta.pontos_totais === primeiroColocado.pontos_totais
    );
  } else {
    // Procurar a próxima pontuação menor que a máxima
    const pontuacaoVice = apostasOrdenadas.find(
      aposta => aposta.pontos_totais < pontuacaoMaxima
    )?.pontos_totais;

    if (pontuacaoVice !== undefined) {
      vice = apostasOrdenadas.filter(
        aposta => aposta.pontos_totais === pontuacaoVice
      );
    }
  }

  // Determinar Último Colocado
  const minPontos = apostasOrdenadas[apostasOrdenadas.length - 1]
    .pontos_totais;
  const ultimoColocado = apostasOrdenadas.filter(
    aposta => aposta.pontos_totais === minPontos
  );

  return {
    campeao,
    vice,
    ultimoColocado,
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
        cli_id: ganhador.cli_id || ganhador.col_id,
        pontos: ganhador.pontos_totais || 0,
        premio: 0,
      }));
      return;
    }

    const valorPorGanhador = valorTotal / ganhadoresArray.length;

    premios[categoria] = ganhadoresArray.map(ganhador => ({
      cli_id: ganhador.cli_id || ganhador.col_id,
      pontos: ganhador.pontos_totais || 0,
      premio: parseFloat(valorPorGanhador.toFixed(2)),
    }));
  };

  distribuir('campeao', vencedores.campeao);
  distribuir('vice', vencedores.vice);
  distribuir('ultimoColocado', vencedores.ultimoColocado);

  // Distribuição de Comissão para Colaboradores
  const colaboradoresUnicos = getUniqueColaboradores(
    vencedores.campeao,
    vencedores.vice,
    vencedores.ultimoColocado
  );
  distribuir(
    'comissaoColaboradores',
    colaboradoresUnicos.map(col => ({ col_id: col.col_id }))
  );
  return premios;
}

/**
 * Obtém uma lista única de colaboradores a partir dos vencedores.
 */
function getUniqueColaboradores(...arrays) {
  const colaboradoresSet = new Set();
  arrays.forEach(array => {
    array.forEach(item => {
      if (item.col_id) {
        colaboradoresSet.add(item.col_id);
      }
    });
  });
  return Array.from(colaboradoresSet).map(col_id => ({ col_id }));
}
