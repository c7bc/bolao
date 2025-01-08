// src/app/api/jogos/[slug]/visibility/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler PUT - Atualiza a visibilidade de um jogo.
 */
export async function PUT(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar jogo pelo slug
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

    // Atualizar a visibilidade
    const { visibleInConcursos } = await request.json();

    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
      UpdateExpression: 'SET visibleInConcursos = :visibilidade, jog_datamodificacao = :datamodificacao',
      ExpressionAttributeValues: marshall({
        ':visibilidade': visibleInConcursos,
        ':datamodificacao': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar visibilidade do jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
