// src/app/api/game-types/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
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

    // Parâmetros para obter a lista de tipos de jogos
    const scanParams = {
      TableName: 'GameTypes',
      ProjectionExpression: 'game_type_id, #name, description, created_at, updated_at',
      ExpressionAttributeNames: {
        '#name': 'name', // Alias para a palavra reservada
      },
      Limit: 100, // Limite para evitar scans muito grandes
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    const gameTypes = scanResult.Items.map(item => unmarshall(item));

    return NextResponse.json({ gameTypes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar tipos de jogos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
