// src/app/api/game-types/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Handler POST - Cria um novo tipo de jogo.
 */
export async function POST(request) {
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

    // Validação de campos obrigatórios
    if (!name || !description) {
      return NextResponse.json({ error: 'Campos "name" e "description" são obrigatórios.' }, { status: 400 });
    }

    // Gerar ID único para o tipo de jogo
    const game_type_id = uuidv4();

    // Preparar dados para o DynamoDB
    const novoGameType = {
      game_type_id,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const params = {
      TableName: 'GameTypes',
      Item: marshall(novoGameType),
      ConditionExpression: 'attribute_not_exists(game_type_id)', // Garante que o ID seja único
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ gameType: novoGameType }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tipo de jogo:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'ID do tipo de jogo já existe.' }, { status: 400 });
    }

    if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
