// Caminho: src/app/api/cliente/financialhistory/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializa o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Buscar histórico financeiro do cliente
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

    // Parâmetros para consultar o GSI 'cli_financial-index' na tabela 'Financeiro_Cliente'
    const queryParams = {
      TableName: 'Financeiro_Cliente',
      IndexName: 'cli_financial-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      ScanIndexForward: false, // Ordenar do mais recente para o mais antigo
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    const movimentacoes = response.Items.map(item => unmarshall(item));

    return NextResponse.json({ financials: movimentacoes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar histórico financeiro do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
