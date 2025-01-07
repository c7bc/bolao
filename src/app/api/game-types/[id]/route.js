// src/app/api/game-types/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function PUT(request, { params }) {
  try {
    const { id } = params; // game_type_id

    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Obter o tipo de jogo atual para verificar se o status do jogo está "aberto"
    // Presumindo que há uma relação entre GameTypes e Jogos, você pode precisar consultar a tabela Jogos para verificar o status

    // Aqui, simplificamos assumindo que os jogos referenciados estão abertos
    // Se necessário, implemente uma verificação adicional

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

    // Preparar atributos para atualização
    let UpdateExpression = "SET ";
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    if (name !== undefined) {
      UpdateExpression += "#name = :name, ";
      ExpressionAttributeValues[':name'] = { S: name };
      ExpressionAttributeNames['#name'] = 'name';
    }

    if (min_numbers !== undefined) {
      UpdateExpression += "min_numbers = :min_numbers, ";
      ExpressionAttributeValues[':min_numbers'] = { N: min_numbers.toString() };
    }

    if (max_numbers !== undefined) {
      UpdateExpression += "max_numbers = :max_numbers, ";
      ExpressionAttributeValues[':max_numbers'] = { N: max_numbers.toString() };
    }

    if (min_digits !== undefined) {
      UpdateExpression += "min_digits = :min_digits, ";
      ExpressionAttributeValues[':min_digits'] = { N: min_digits.toString() };
    }

    if (max_digits !== undefined) {
      UpdateExpression += "max_digits = :max_digits, ";
      ExpressionAttributeValues[':max_digits'] = { N: max_digits.toString() };
    }

    if (points_for_10 !== undefined) {
      UpdateExpression += "points_for_10 = :points_for_10, ";
      ExpressionAttributeValues[':points_for_10'] = { N: points_for_10.toString() };
    }

    if (points_for_9 !== undefined) {
      UpdateExpression += "points_for_9 = :points_for_9, ";
      ExpressionAttributeValues[':points_for_9'] = { N: points_for_9.toString() };
    }

    if (total_drawn_numbers !== undefined) {
      UpdateExpression += "total_drawn_numbers = :total_drawn_numbers, ";
      ExpressionAttributeValues[':total_drawn_numbers'] = { N: total_drawn_numbers.toString() };
    }

    if (rounds !== undefined) {
      UpdateExpression += "rounds = :rounds, ";
      ExpressionAttributeValues[':rounds'] = { N: rounds.toString() };
    }

    if (draw_times !== undefined) {
      UpdateExpression += "draw_times = :draw_times, ";
      ExpressionAttributeValues[':draw_times'] = { L: draw_times.map(time => ({ S: time })) };
    }

    if (ticket_price !== undefined) {
      UpdateExpression += "ticket_price = :ticket_price, ";
      ExpressionAttributeValues[':ticket_price'] = { N: ticket_price.toString() };
    }

    if (number_generation !== undefined) {
      UpdateExpression += "number_generation = :number_generation, ";
      ExpressionAttributeValues[':number_generation'] = { S: number_generation };
    }

    // Remover a última vírgula e espaço
    UpdateExpression = UpdateExpression.slice(0, -2);

    UpdateExpression += ", updated_at = :updated_at";
    ExpressionAttributeValues[':updated_at'] = { S: new Date().toISOString() };

    const updateParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: id }),
      UpdateExpression,
      ExpressionAttributeValues,
      ExpressionAttributeNames,
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const updatedGameType = unmarshall(updateResult.Attributes);

    return NextResponse.json({ gameType: updatedGameType }, { status: 200 });
  } catch (error) {
    console.error('Erro ao editar tipo de jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params; // game_type_id

    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Verificar se há jogos associados a este tipo de jogo com status "aberto"
    const jogosParams = {
      TableName: 'Jogos',
      IndexName: 'game_type_id-index', // Assegure-se que este GSI existe
      KeyConditionExpression: 'game_type_id = :game_type_id',
      FilterExpression: 'jog_status = :status',
      ExpressionAttributeValues: {
        ':game_type_id': { S: id },
        ':status': { S: 'aberto' },
      },
    };

    const jogosCommand = new QueryCommand(jogosParams);
    const jogosResult = await dynamoDbClient.send(jogosCommand);

    if (jogosResult.Items.length > 0) {
      return NextResponse.json({ error: 'Não é possível deletar o tipo de jogo enquanto houver jogos abertos associados a ele.' }, { status: 400 });
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
