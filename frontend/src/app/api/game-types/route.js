// Caminho: src/app/api/game-types/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Handler GET - Lista todos os tipos de jogos.
 */
export async function GET(request) {
  try {
    // Autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    // Restringe o acesso a usuários com roles 'admin' e 'superadmin'
    if (!['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Busca todos os tipos de jogos
    const scanParams = {
      TableName: 'GameTypes',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);
    const gameTypes = scanResult.Items.map((item) => unmarshall(item));

    return NextResponse.json({ gameTypes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar tipos de jogos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Handler POST - Cria um novo tipo de jogo.
 * Este método está redirecionado para create/route.js para evitar duplicidade.
 */
export async function POST(request) {
  return NextResponse.json(
    { error: 'Método POST não permitido aqui. Use /create para criar tipos de jogos.' },
    { status: 405 }
  );
}
