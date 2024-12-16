// src/app/api/config/recebimentos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Recebimentos';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoDbClient.send(command);
    const recebimentos = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ recebimentos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recebimentos:', error);
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

    const {
      tipo,
      nome_titular,
      chave_pix,
      tipo_chave,
      status,
      agencia,
      conta,
      banco,
    } = await request.json();

    if (!tipo || !nome_titular || !chave_pix || !tipo_chave) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const newRecebimento = {
      id: uuidv4(),
      tipo,
      nome_titular,
      chave_pix,
      tipo_chave,
      status,
      agencia: agencia || '',
      conta: conta || '',
      banco: banco || '',
      dataCriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newRecebimento),
    };
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ recebimento: newRecebimento }, { status: 201 });
  } catch (error) {
    console.error('Error adding recebimento:', error);
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
