// src/app/api/game-types/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
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

    // Validação de campos obrigatórios
    if (
      !name ||
      min_numbers === undefined ||
      max_numbers === undefined ||
      min_digits === undefined ||
      max_digits === undefined ||
      points_for_10 === undefined ||
      points_for_9 === undefined ||
      total_drawn_numbers === undefined ||
      rounds === undefined ||
      !draw_times ||
      ticket_price === undefined ||
      !number_generation
    ) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    // Validação de somatório de porcentagens se aplicável
    // (Neste caso, não se aplica diretamente, mas mantenha validações necessárias)

    // Gerar ID único
    const game_type_id = uuidv4();

    const newGameType = {
      game_type_id,
      name,
      min_numbers,
      max_numbers,
      min_digits,
      max_digits,
      points_for_10,
      points_for_9,
      total_drawn_numbers,
      rounds,
      draw_times, // Array de horários
      ticket_price,
      number_generation, // "manual" ou "automatic"
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const params = {
      TableName: 'GameTypes',
      Item: marshall(newGameType),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ gameType: newGameType }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tipo de jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
