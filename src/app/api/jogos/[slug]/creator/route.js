// src/app/api/jogos/[slug]/creator/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Buscar o jogo usando QueryCommand com GSI 'slug-index'
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);
    const creatorId = jogo.creator_id;

    // Buscar informações do colaborador
    const colaboradorParams = {
      TableName: 'Colaboradores',
      Key: marshall({ col_id: creatorId }),
    };

    const getColaboradorCommand = new GetItemCommand(colaboradorParams);
    const getColaboradorResult = await dynamoDbClient.send(getColaboradorCommand);

    if (!getColaboradorResult.Item) {
      return NextResponse.json({ error: 'Criador não encontrado.' }, { status: 404 });
    }

    const colaborador = unmarshall(getColaboradorResult.Item);

    // Excluir campos sensíveis
    delete colaborador.col_password;

    return NextResponse.json({ colaborador }, { status: 200 });
  } catch (error) {
    console.error('Error fetching creator:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
