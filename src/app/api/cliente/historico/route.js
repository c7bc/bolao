// Caminho: src/app/api/cliente/historico/route.js (Linhas: 104)
// src/app/api/cliente/historico/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Handler GET - Buscar histórico unificado do cliente
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

    // 1. Buscar todas as apostas do cliente
    const apostasParams = {
      TableName: 'Apostas',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      ScanIndexForward: false,
    };

    const apostasCommand = new QueryCommand(apostasParams);
    const apostasResponse = await dynamoDbClient.send(apostasCommand);
    const apostas = apostasResponse.Items.map(item => unmarshall(item));

    // 2. Extrair jog_id para buscar detalhes dos jogos em lote
    const jogIds = apostas.map(aposta => aposta.jog_id);
    const uniqueJogIds = [...new Set(jogIds)];

    // 3. Buscar detalhes dos jogos
    const batchJogosParams = {
      RequestItems: {
        'Jogos': {
          Keys: uniqueJogIds.map(jog_id => ({ jog_id: { S: jog_id } })),
        },
      },
    };

    const batchJogosCommand = new BatchGetItemCommand(batchJogosParams);
    const batchJogosResponse = await dynamoDbClient.send(batchJogosCommand);

    const jogosMap = {};
    if (batchJogosResponse.Responses && batchJogosResponse.Responses['Jogos']) {
      batchJogosResponse.Responses['Jogos'].forEach(jogoItem => {
        const jogo = unmarshall(jogoItem);
        jogosMap[jogo.jog_id] = jogo;
      });
    }

    // 4. Buscar movimentações financeiras
    const movimentacoesParams = {
      TableName: 'HistoricoCliente',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      ScanIndexForward: false,
    };

    const movimentacoesCommand = new QueryCommand(movimentacoesParams);
    const movimentacoesResponse = await dynamoDbClient.send(movimentacoesCommand);
    const movimentacoes = movimentacoesResponse.Items.map(item => unmarshall(item));

    // 5. Combinar dados
    const historicoUnificado = {
      apostas,
      jogos: Object.values(jogosMap),
      movimentacoes,
    };

    return NextResponse.json({ historico: historicoUnificado }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar histórico unificado do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
