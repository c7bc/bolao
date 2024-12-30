// src/app/api/jogos/[jog_id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler PUT - Atualiza o status de um jogo.
 */
export async function PUT(request, { params }) {
  const { jog_id } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { novo_status } = await request.json();

    const statusValido = ['aberto', 'fechado', 'encerrado'];
    if (!statusValido.includes(novo_status)) {
      return NextResponse.json(
        { error: `Status inválido. Os status permitidos são: ${statusValido.join(', ')}` },
        { status: 400 }
      );
    }

    // Buscar jogo existente
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(getResult.Item);

    // Atualizar o status
    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
      UpdateExpression: 'SET jog_status = :status, jog_dataupdate = :dataupdate',
      ExpressionAttributeValues: marshall({
        ':status': novo_status,
        ':dataupdate': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Error updating jogo status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
