import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const resultadosTableName = 'Resultados';
const jogosTableName = 'Jogos';
const apostasTableName = 'Apostas';
const ganhadoresTableName = 'Ganhadores';
const configuracoesTableName = 'Configuracoes';

/**
 * Rota POST para distribuir prêmios com base no rateio configurado.
 */
export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar resultados pendentes
    const scanParams = {
      TableName: resultadosTableName,
      FilterExpression: 'status = :status',
      ExpressionAttributeValues: marshall({
        ':status': 'PENDENTE',
      }),
    };

    const scanCommand = new ScanCommand(scanParams);
    const resultadosScan = await dynamoDbClient.send(scanCommand);
    const resultadosPendentes = resultadosScan.Items.map(item => unmarshall(item));

    if (resultadosPendentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhum resultado pendente para processar.',
      }, { status: 200 });
    }

    // Buscar configurações de rateio
    const configParams = {
      TableName: configuracoesTableName,
      Key: marshall({ conf_nome: 'rateio' }),
    };

    const configCommand = new GetItemCommand(configParams);
    const configResult = await dynamoDbClient.send(configCommand);

    if (!configResult.Item) {
      return NextResponse.json({
        error: 'Configurações de rateio não encontradas.',
      }, { status: 500 });
    }

    const rateioConfig = unmarshall(configResult.Item);

    const processados = [];

    for (const resultado of resultadosPendentes) {
      // Buscar o jogo correspondente
      const jogoParams = {
        TableName: jogosTableName,
        Key: marshall({ jog_id: resultado.jog_id }),
      };

      const jogoCommand = new GetItemCommand(jogoParams);
      const jogoResult = await dynamoDbClient.send(jogoCommand);

      if (!jogoResult.Item) {
        console.warn(`Jogo ${resultado.jog_id} não encontrado.`);
        continue;
      }

      const jogo = unmarshall(jogoResult.Item);

      // Buscar apostas relacionadas ao jogo
      const apostasParams = {
        TableName: apostasTableName,
        IndexName: 'jog_id-index', // Verifique se este índice existe
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: {
          ':jogId': { S: resultado.jog_id },
        },
      };

      const apostasCommand = new QueryCommand(apostasParams);
      const apostasResult = await dynamoDbClient.send(apostasCommand);
      const apostas = apostasResult.Items ? apostasResult.Items.map(item => unmarshall(item)) : [];

      // Identificar ganhadores por categoria
      const ganhadoresPorCategoria = {
        '10_pontos': [],
        '9_pontos': [],
        'menos_pontos': [],
      };

      for (const aposta of apostas) {
        const acertos = calcularAcertos(jogo.numeros_sorteados, aposta.numeros_escolhidos);

        if (acertos >= 10) {
          ganhadoresPorCategoria['10_pontos'].push(aposta);
        } else if (acertos === 9) {
          ganhadoresPorCategoria['9_pontos'].push(aposta);
        } else {
          ganhadoresPorCategoria['menos_pontos'].push(aposta);
        }
      }

      // Distribuir prêmios conforme o rateio
      for (const categoria in ganhadoresPorCategoria) {
        const ganhadores = ganhadoresPorCategoria[categoria];
        if (ganhadores.length === 0) continue;

        const porcentagem = rateioConfig[`rateio_${categoria}`];
        const premioTotal = resultado.valor_total * (porcentagem / 100);
        const premioPorGanhador = premioTotal / ganhadores.length;

        for (const ganhador of ganhadores) {
          const ganhadorParams = {
            TableName: ganhadoresTableName,
            Item: marshall({
              ganhador_id: uuidv4(),
              resultado_id: resultado.resultado_id,
              jog_id: resultado.jog_id,
              cli_id: ganhador.cli_id,
              acertos,
              premio: premioPorGanhador.toFixed(2),
              data_processamento: new Date().toISOString(),
            }),
          };

          const putGanhadorCommand = new PutItemCommand(ganhadorParams);
          await dynamoDbClient.send(putGanhadorCommand);
        }
      }

      // Atualizar status do resultado para 'PROCESSADO'
      const updateResultadoParams = {
        TableName: resultadosTableName,
        Key: marshall({
          resultado_id: resultado.resultado_id,
        }),
        UpdateExpression: 'SET status = :status, data_processamento = :dataProc',
        ExpressionAttributeValues: marshall({
          ':status': 'PROCESSADO',
          ':dataProc': new Date().toISOString(),
        }),
        ReturnValues: 'UPDATED_NEW',
      };

      const updateCommand = new UpdateItemCommand(updateResultadoParams);
      await dynamoDbClient.send(updateCommand);

      processados.push({
        resultado_id: resultado.resultado_id,
        jog_id: resultado.jog_id,
        numeros_sorteados: resultado.numeros_sorteados,
        total_ganhadores_10_pontos: ganhadoresPorCategoria['10_pontos'].length,
        total_ganhadores_9_pontos: ganhadoresPorCategoria['9_pontos'].length,
        total_ganhadores_menos_pontos: ganhadoresPorCategoria['menos_pontos'].length,
        premio_total: resultado.valor_total,
      });

      // Atualizar status do jogo para 'FINALIZADO'
      const updateJogoParams = {
        TableName: jogosTableName,
        Key: marshall({ jog_id: resultado.jog_id }),
        UpdateExpression: 'SET jog_status = :status, data_processamento = :dataProc',
        ExpressionAttributeValues: marshall({
          ':status': 'FINALIZADO',
          ':dataProc': new Date().toISOString(),
        }),
        ReturnValues: 'UPDATED_NEW',
      };

      const updateJogoCommand = new UpdateItemCommand(updateJogoParams);
      await dynamoDbClient.send(updateJogoCommand);
    }

    return NextResponse.json({
      message: 'Resultados processados com sucesso.',
      processados,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao distribuir prêmios:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor.',
    }, { status: 500 });
  }
}

/**
 * Calcula o número de acertos entre os números sorteados e os escolhidos na aposta.
 * @param {string} numerosSorteados - Números sorteados, separados por vírgula.
 * @param {string} numerosEscolhidos - Números escolhidos na aposta, separados por vírgula.
 * @returns {number} - Número de acertos.
 */
function calcularAcertos(numerosSorteados, numerosEscolhidos) {
  const sorteadosSet = new Set(numerosSorteados.split(',').map(num => num.trim()));
  const apostados = numerosEscolhidos.split(',').map(num => num.trim());
  let acertos = 0;
  for (const num of apostados) {
    if (sorteadosSet.has(num)) {
      acertos += 1;
    }
  }
  return acertos;
}
