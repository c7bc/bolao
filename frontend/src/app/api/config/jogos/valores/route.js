// src/app/api/config/jogos/valores/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'ValoresDepositoJogos';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoDbClient.send(command);
    const valores = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ valores }, { status: 200 });
  } catch (error) {
    console.error('Error fetching valores de depósito:', error);
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { valor } = await request.json();

    if (valor === undefined || valor === null || isNaN(valor)) {
      console.error('Validation error: Invalid valor.', { valor });
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
    }

    const newValor = {
      id: uuidv4(),
      valor: parseFloat(valor),
      dataCriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newValor),
    };
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ valor: newValor }, { status: 201 });
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
