// src/app/api/config/porcentagens/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Porcentagens';

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
    const porcentagens = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ porcentagens }, { status: 200 });
  } catch (error) {
    console.error('Error fetching porcentagens:', error);
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

    const { perfil, colaboradorId, porcentagem, descricao } = await request.json();

    if (!perfil || (!colaboradorId && perfil === 'colaborador') || !porcentagem) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const newPorcentagem = {
      id: uuidv4(),
      perfil,
      colaboradorId: perfil === 'colaborador' ? colaboradorId : null,
      porcentagem: parseFloat(porcentagem),
      descricao: descricao || '',
      dataCriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newPorcentagem),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ porcentagem: newPorcentagem }, { status: 201 });
  } catch (error) {
    console.error('Error creating porcentagem:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}