// src/app/api/game-types/[id]/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Obtém um tipo de jogo pelo ID.
 */
export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parâmetros para obter o tipo de jogo
    const getParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Tipo de jogo não encontrado.' }, { status: 404 });
    }

    const gameType = unmarshall(getResult.Item);

    return NextResponse.json({ gameType }, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter tipo de jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza um tipo de jogo pelo ID.
 */
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    // Autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const { name, description } = await request.json();

    // Validação de campos
    if (!name && !description) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    // Preparar UpdateExpression e ExpressionAttributeValues
    let UpdateExpression = 'SET';
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    const updates = [];

    if (name) {
      updates.push('#name = :name');
      ExpressionAttributeNames['#name'] = 'name';
      ExpressionAttributeValues[':name'] = { S: name };
    }

    if (description) {
      updates.push('#description = :description');
      ExpressionAttributeNames['#description'] = 'description';
      ExpressionAttributeValues[':description'] = { S: description };
    }

    // Sempre atualizar a data de modificação
    updates.push('#updated_at = :updated_at');
    ExpressionAttributeNames['#updated_at'] = 'updated_at';
    ExpressionAttributeValues[':updated_at'] = { S: new Date().toISOString() };

    UpdateExpression += ' ' + updates.join(', ');

    const updateParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: id }),
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const gameTypeAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ gameType: gameTypeAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar tipo de jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Handler DELETE - Deleta um tipo de jogo pelo ID.
 */
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Verificar se o tipo de jogo existe
    const getParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Tipo de jogo não encontrado.' }, { status: 404 });
    }

    // Deletar o tipo de jogo
    const deleteParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    return NextResponse.json({ message: 'Tipo de jogo deletado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar tipo de jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
