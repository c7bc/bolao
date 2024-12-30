// Caminho: src/app/api/cliente/scores/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Handler GET - Buscar pontuações do cliente
 */
export async function GET(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['cliente'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const cli_id = decodedToken.cli_id;

    // Parâmetros para consultar o GSI 'cliente-id-index' na tabela 'Apostas'
    const queryParams = {
      TableName: 'Apostas',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      FilterExpression: 'jog_status = :finalizado',
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    const apostasFinalizadas = response.Items.map(item => unmarshall(item));

    // Extrair jog_id para buscar detalhes dos jogos em lote
    const jogIds = apostasFinalizadas.map(aposta => aposta.jog_id);
    const uniqueJogIds = [...new Set(jogIds)];

    if (uniqueJogIds.length === 0) {
      return NextResponse.json({ scores: [] }, { status: 200 });
    }

    // Preparar BatchGetItem para buscar detalhes dos jogos
    const batchParams = {
      RequestItems: {
        'Jogos': {
          Keys: uniqueJogIds.map(jog_id => ({ jog_id: { S: jog_id } })),
        },
      },
    };

    const batchCommand = new BatchGetItemCommand(batchParams);
    const batchResponse = await dynamoDbClient.send(batchCommand);

    const jogosMap = {};
    if (batchResponse.Responses && batchResponse.Responses['Jogos']) {
      batchResponse.Responses['Jogos'].forEach(jogoItem => {
        const jogo = unmarshall(jogoItem);
        jogosMap[jogo.jog_id] = jogo;
      });
    }

    // Calcular pontuações com base nos acertos
    const scores = apostasFinalizadas.map(aposta => {
      const jogo = jogosMap[aposta.jog_id];
      if (!jogo) return null;

      let acertos = 0;
      if (jogo.jog_tipodojogo === 'MEGA') {
        acertos = aposta.htc_cotas.filter(num => jogo.jog_numeros_sorteados.includes(num)).length;
      } else if (jogo.jog_tipodojogo === 'LOTOFACIL') {
        acertos = aposta.htc_cotas.filter(num => jogo.jog_numeros_sorteados.includes(num)).length;
      } else if (jogo.jog_tipodojogo === 'JOGO_DO_BICHO') {
        acertos = (aposta.htc_dezena === jogo.dezena && aposta.htc_horario === jogo.horario) ? 1 : 0;
      }

      // Definir pontuação com base nos acertos
      let pontuacao = 0;
      if (jogo.jog_tipodojogo === 'MEGA') {
        if (acertos === 6) pontuacao = 100;
        else if (acertos === 5) pontuacao = 50;
        else if (acertos === 4) pontuacao = 20;
        else if (acertos === 3) pontuacao = 10;
      } else if (jogo.jog_tipodojogo === 'LOTOFACIL') {
        if (acertos === 15) pontuacao = 100;
        else if (acertos >= 10) pontuacao = 50;
        else if (acertos >= 5) pontuacao = 20;
      } else if (jogo.jog_tipodojogo === 'JOGO_DO_BICHO') {
        pontuacao = acertos === 1 ? 50 : 0;
      }

      return {
        jog_nome: jogo.jog_nome,
        jog_tipodojogo: jogo.jog_tipodojogo,
        acertos,
        pontuacao,
        data: jogo.jog_data_sorteio,
        premio: aposta.htc_premio || 0,
      };
    }).filter(score => score !== null);

    return NextResponse.json({ scores }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar pontuações do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
