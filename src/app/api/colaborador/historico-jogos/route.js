// Caminho: src/app/api/colaborador/historico-jogos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const jogosTableName = 'Jogos'; // Verifique o nome da tabela
const jogosIndexName = 'colaborador-jogos-index'; // Verifique o nome do índice secundário global

/**
 * Rota GET para buscar histórico de jogos de um colaborador.
 */
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { periodo } = request.nextUrl.searchParams; // Exemplo de parâmetro de período

    // Lógica para filtrar por período
    let startDate = null;
    const now = new Date();

    switch (periodo) {
      case 'hoje':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'mes':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'trimestre':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    const queryParams = {
      TableName: jogosTableName,
      IndexName: jogosIndexName, // Adicione o nome do índice
      KeyConditionExpression: 'col_id = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: decodedToken.col_id },
      },
      ScanIndexForward: false, // Ordem decrescente
    };

    if (startDate) {
      queryParams.FilterExpression = 'jog_datacriacao >= :startDate';
      queryParams.ExpressionAttributeValues[':startDate'] = { S: startDate.toISOString() };
    }

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);
    let jogos = response.Items ? response.Items.map(item => unmarshall(item)) : [];

    if (startDate) {
      jogos = jogos.filter(jogo => new Date(jogo.jog_datacriacao) >= startDate);
    }

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching histórico de jogos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
