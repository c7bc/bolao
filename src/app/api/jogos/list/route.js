// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
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
    const status = searchParams.get('status'); // open, closed, ended
    const nome = searchParams.get('nome'); // filtro por nome
    const slug = searchParams.get('slug'); // filtro por slug

    // Preparar filtros para o scan
    let FilterExpression = '';
    let ExpressionAttributeValues = {};
    let ExpressionAttributeNames = {};

    if (status) {
      FilterExpression += 'jog_status = :status';
      ExpressionAttributeValues[':status'] = { S: status };
    }

    if (nome) {
      if (FilterExpression !== '') FilterExpression += ' AND ';
      FilterExpression += 'contains(jog_nome, :nome)';
      ExpressionAttributeValues[':nome'] = { S: nome };
    }

    if (slug) {
      if (FilterExpression !== '') FilterExpression += ' AND ';
      FilterExpression += 'slug = :slug';
      ExpressionAttributeValues[':slug'] = { S: slug };
    }

    const params = {
      TableName: 'Jogos',
      FilterExpression: FilterExpression || undefined,
      ExpressionAttributeValues: Object.keys(ExpressionAttributeValues).length > 0 ? ExpressionAttributeValues : undefined,
      ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
      Limit: 100, // Limite para evitar scans muito grandes
    };

    const command = new ScanCommand(params);
    const data = await dynamoDbClient.send(command);

    const jogos = data.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error listing games:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
