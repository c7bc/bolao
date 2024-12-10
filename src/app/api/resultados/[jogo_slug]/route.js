// src/app/api/resultados/[jogo_slug]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Manipulador GET - Buscar resultados por jogo_slug
export async function GET(request, { params }) {
  const { jogo_slug } = params;

  try {
    const dbParams = {
      TableName: 'Resultados',
      IndexName: 'JogoSlugIndex', // Assegure-se que este GSI existe
      KeyConditionExpression: 'jogo_slug = :slug',
      ExpressionAttributeValues: {
        ':slug': { S: jogo_slug },
      },
    };

    const command = new QueryCommand(dbParams);
    const result = await dynamoDbClient.send(command);

    const resultados = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ resultados }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
