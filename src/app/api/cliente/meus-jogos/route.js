// Caminho: src/app/api/cliente/meus-jogos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
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
 * Handler GET - Buscar jogos do cliente
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

    // Parâmetros para consultar o GSI 'cliente-id-index'
    const queryParams = {
      TableName: 'Apostas',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      ScanIndexForward: false, // Ordenar do mais recente para o mais antigo
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    // Transformar os dados para o formato esperado pelo frontend
    const jogos = response.Items.map(item => unmarshall(item));

    // Extrair jog_id para buscar detalhes dos jogos em lote
    const jogIds = jogos.map(aposta => aposta.jog_id);
    const uniqueJogIds = [...new Set(jogIds)];

    if (uniqueJogIds.length === 0) {
      return NextResponse.json({ jogos: [] }, { status: 200 });
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

    // Enriquecer as apostas com detalhes dos jogos
    const apostasDetalhadas = jogos.map(aposta => ({
      ...aposta,
      jogo: jogosMap[aposta.jog_id] || null,
    }));

    return NextResponse.json({ jogos: apostasDetalhadas }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar jogos do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
