// Caminho: src/app/api/game-types/[id]/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';

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
    const {
      name,
      min_numbers,
      max_numbers,
      min_digits,
      max_digits,
      points_for_10,
      points_for_9,
      total_drawn_numbers,
      rounds,
      draw_times,
      ticket_price,
      number_generation,
    } = await request.json();

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

    const existingGameType = unmarshall(getResult.Item);

    // Validação Condicional
    if (rounds > 1 && (!draw_times || !Array.isArray(draw_times) || draw_times.length === 0)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: draw_times.' },
        { status: 400 }
      );
    }

    // Preparar UpdateExpression e ExpressionAttributeValues
    let UpdateExpression = 'SET';
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    const updates = [];

    if (name !== undefined) {
      updates.push('#name = :name');
      ExpressionAttributeValues[':name'] = { S: name };
      ExpressionAttributeNames['#name'] = 'name';
    }

    if (min_numbers !== undefined) {
      updates.push('#min_numbers = :min_numbers');
      ExpressionAttributeValues[':min_numbers'] = { N: min_numbers.toString() };
      ExpressionAttributeNames['#min_numbers'] = 'min_numbers';
    }

    if (max_numbers !== undefined) {
      updates.push('#max_numbers = :max_numbers');
      ExpressionAttributeValues[':max_numbers'] = { N: max_numbers.toString() };
      ExpressionAttributeNames['#max_numbers'] = 'max_numbers';
    }

    if (min_digits !== undefined) {
      updates.push('#min_digits = :min_digits');
      ExpressionAttributeValues[':min_digits'] = { N: min_digits.toString() };
      ExpressionAttributeNames['#min_digits'] = 'min_digits';
    }

    if (max_digits !== undefined) {
      updates.push('#max_digits = :max_digits');
      ExpressionAttributeValues[':max_digits'] = { N: max_digits.toString() };
      ExpressionAttributeNames['#max_digits'] = 'max_digits';
    }

    if (points_for_10 !== undefined) {
      updates.push('#points_for_10 = :points_for_10');
      ExpressionAttributeValues[':points_for_10'] = { N: points_for_10.toString() };
      ExpressionAttributeNames['#points_for_10'] = 'points_for_10';
    }

    if (points_for_9 !== undefined) {
      updates.push('#points_for_9 = :points_for_9');
      ExpressionAttributeValues[':points_for_9'] = { N: points_for_9.toString() };
      ExpressionAttributeNames['#points_for_9'] = 'points_for_9';
    }

    if (total_drawn_numbers !== undefined) {
      updates.push('#total_drawn_numbers = :total_drawn_numbers');
      ExpressionAttributeValues[':total_drawn_numbers'] = {
        N: total_drawn_numbers.toString(),
      };
      ExpressionAttributeNames['#total_drawn_numbers'] = 'total_drawn_numbers';
    }

    if (rounds !== undefined) {
      updates.push('#rounds = :rounds');
      ExpressionAttributeValues[':rounds'] = { N: rounds.toString() };
      ExpressionAttributeNames['#rounds'] = 'rounds';
    }

    if (ticket_price !== undefined) {
      updates.push('#ticket_price = :ticket_price');
      ExpressionAttributeValues[':ticket_price'] = { N: ticket_price.toFixed(2) };
      ExpressionAttributeNames['#ticket_price'] = 'ticket_price';
    }

    if (number_generation !== undefined) {
      updates.push('#number_generation = :number_generation');
      ExpressionAttributeValues[':number_generation'] = { S: number_generation };
      ExpressionAttributeNames['#number_generation'] = 'number_generation';
    }

    if (draw_times !== undefined) {
      updates.push('#draw_times = :draw_times');
      ExpressionAttributeValues[':draw_times'] = {
        L: draw_times.map((time) => ({ S: time })),
      };
      ExpressionAttributeNames['#draw_times'] = 'draw_times';
    }

    // Sempre atualizar a data de modificação
    updates.push('#updated_at = :updated_at');
    ExpressionAttributeValues[':updated_at'] = { S: new Date().toISOString() };
    ExpressionAttributeNames['#updated_at'] = 'updated_at';

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar.' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Token de autorização não encontrado.' },
        { status: 401 }
      );
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
