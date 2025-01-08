// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameTypeId = searchParams.get('game_type_id'); // Filtro por game_type_id
    const nome = searchParams.get('nome'); // filtro por nome
    const slug = searchParams.get('slug'); // filtro por slug (jogo's own slug)

    // Se 'slug' está presente, usar QueryCommand com GSI 'SlugIndex'
    if (slug) {
      const queryParams = {
        TableName: 'Jogos',
        IndexName: 'SlugIndex', // GSI correto
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: marshall({
          ':slug': slug,
        }),
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResult = await dynamoDbClient.send(queryCommand);

      const jogos = queryResult.Items.map(item => unmarshall(item));

      return NextResponse.json({ jogos }, { status: 200 });
    }

    // Se 'game_type_id' está presente, usar QueryCommand com GSI 'game_type_id-index'
    if (gameTypeId) {
      const queryParams = {
        TableName: 'Jogos',
        IndexName: 'game_type_id-index', // GSI correto
        KeyConditionExpression: 'game_type_id = :game_type_id',
        ExpressionAttributeValues: marshall({
          ':game_type_id': gameTypeId,
        }),
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResult = await dynamoDbClient.send(queryCommand);

      const jogos = queryResult.Items.map(item => unmarshall(item));

      return NextResponse.json({ jogos }, { status: 200 });
    }

    // Preparar filtros para o scan
    let FilterExpression = '';
    let ExpressionAttributeValues = {};
    let ExpressionAttributeNames = {};

    if (nome) {
      FilterExpression += 'contains(jog_nome, :nome)';
      ExpressionAttributeValues[':nome'] = { S: nome };
    }

    const scanParams = {
      TableName: 'Jogos',
      FilterExpression: FilterExpression || undefined,
      ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? marshall(ExpressionAttributeValues) : undefined,
      ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? marshall(ExpressionAttributeNames) : undefined,
      Limit: 100, // Limite para evitar scans muito grandes
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    const jogos = scanResult.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error listing games:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
