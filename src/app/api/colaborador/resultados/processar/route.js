// Caminho: src/app/api/colaborador/resultados/processar/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
  QueryCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const resultadosTableName = 'Resultados'; // Verifique o nome da tabela
const jogosTableName = 'Jogos'; // Verifique o nome da tabela
const apostasTableName = 'Apostas'; // Verifique o nome da tabela
const ganhadoresTableName = 'Ganhadores'; // Verifique o nome da tabela

/**
 * Rota POST para processar resultados pendentes do colaborador.
 */
export async function POST(request) {
  try {
    // Verificação de autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar resultados pendentes do colaborador
    const scanParams = {
      TableName: resultadosTableName,
      FilterExpression: 'col_id = :colId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: marshall({
        ':colId': decodedToken.col_id,
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

    const processados = [];

    for (const resultado of resultadosPendentes) {
      // Buscar o jogo correspondente
      const jogoParams = {
        TableName: jogosTableName,
        Key: marshall({ jog_id: resultado.jog_id }),
      };

      const jogoCommand = new QueryCommand(jogoParams);
      const jogoResult = await dynamoDbClient.send(jogoCommand);

      if (!jogoResult.Items || jogoResult.Items.length === 0) {
        console.warn(`Jogo ${resultado.jog_id} não encontrado.`);
        continue;
      }

      const jogo = unmarshall(jogoResult.Items[0]);

      // Verificar se o jogo pertence ao colaborador
      if (jogo.col_id !== decodedToken.col_id) {
        console.warn(`Jogo ${resultado.jog_id} não pertence ao colaborador ${decodedToken.col_id}`);
        continue;
      }

      // Buscar apostas relacionadas ao jogo
      const apostasParams = {
        TableName: apostasTableName,
        IndexName: 'jogo-index', // Verifique se este índice existe
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: {
          ':jogId': { S: resultado.jog_id },
        },
      };

      const apostasCommand = new QueryCommand(apostasParams);
      const apostasResult = await dynamoDbClient.send(apostasCommand);
      const apostas = apostasResult.Items ? apostasResult.Items.map(item => unmarshall(item)) : [];

      // Processar cada aposta
      const ganhadores = [];
      for (const aposta of apostas) {
        const numerosAposta = aposta.numeros.split(',').map(n => n.trim());
        const numerosSorteados = resultado.numeros.split(',').map(n => n.trim());

        let acertos = 0;
        for (const numero of numerosAposta) {
          if (numerosSorteados.includes(numero)) {
            acertos++;
          }
        }

        // Calcular prêmio com base nos acertos
        let premio = 0;
        if (acertos === numerosAposta.length) {
          premio = parseFloat(resultado.premio);
        } else if (acertos === numerosAposta.length - 1) {
          premio = parseFloat(resultado.premio) * 0.2; // 20% do prêmio para quem acerta -1
        }

        if (premio > 0) {
          ganhadores.push({
            apostador_id: aposta.cli_id,
            acertos,
            premio,
          });
        }
      }

      // Registrar ganhadores
      for (const ganhador of ganhadores) {
        const ganhadorParams = {
          TableName: ganhadoresTableName,
          Item: marshall({
            ganhador_id: uuidv4(),
            resultado_id: resultado.resultado_id,
            jog_id: resultado.jog_id,
            cli_id: ganhador.apostador_id,
            acertos: ganhador.acertos.toString(),
            premio: ganhador.premio.toString(),
            data_processamento: new Date().toISOString(),
          }),
        };

        const putGanhadorCommand = new PutItemCommand(ganhadorParams);
        await dynamoDbClient.send(putGanhadorCommand);
      }

      // Atualizar status do resultado
      const updateResultadoParams = {
        TableName: resultadosTableName,
        Key: marshall({
          resultado_id: resultado.resultado_id,
        }),
        UpdateExpression: 'SET #status = :status, processado_em = :processadoEm',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': 'PROCESSADO',
          ':processadoEm': new Date().toISOString(),
        }),
        ReturnValues: 'UPDATED_NEW',
      };

      const updateCommand = new UpdateItemCommand(updateResultadoParams);
      await dynamoDbClient.send(updateCommand);

      processados.push({
        resultado_id: resultado.resultado_id,
        jog_id: resultado.jog_id,
        numeros: resultado.numeros,
        total_ganhadores: ganhadores.length,
        premio_total: ganhadores.reduce((sum, g) => sum + g.premio, 0),
      });

      // Atualizar status do jogo
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
    console.error('Erro ao processar resultados:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor.',
    }, { status: 500 });
  }
}
