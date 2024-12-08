// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nome = searchParams.get('nome');
    const visibleInConcursos = searchParams.get('visibleInConcursos');

    const params = {
      TableName: 'Jogos',
    };

    const FilterExpressions = ['visibleInConcursos = :visible'];
    const ExpressionAttributeValues = {
      ':visible': { BOOL: true },
    };

    if (status && status !== 'all') {
      FilterExpressions.push('jog_status = :status');
      ExpressionAttributeValues[':status'] = { S: status };
    }

    if (nome) {
      FilterExpressions.push('contains(jog_nome, :nome)');
      ExpressionAttributeValues[':nome'] = { S: nome };
    }

    if (FilterExpressions.length > 0) {
      params.FilterExpression = FilterExpressions.join(' AND ');
      params.ExpressionAttributeValues = ExpressionAttributeValues;
    }

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    const jogos = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error listing jogos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
