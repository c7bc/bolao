// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obter os parâmetros da query string
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'open'; // Valor padrão 'open'

    // Parâmetros do QueryCommand usando o índice secundário 'StatusIndex'
    const command = new QueryCommand({
      TableName: 'Jogos', // Nome correto da tabela
      IndexName: 'StatusIndex', // Índice secundário para 'status'
      KeyConditionExpression: '#st = :status',
      ExpressionAttributeNames: {
        '#st': 'status', // Alias para evitar palavra reservada
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
      },
      ProjectionExpression: 'jogId, nome, descricao, #st',
      Limit: 100, // Limite para evitar queries muito grandes
    });

    // Execução do Query
    const result = await dynamoDbClient.send(command);

    // Conversão dos itens
    const jogos = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // Retorno da resposta
    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jogos list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
