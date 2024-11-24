// src/app/api/config/porcentagens/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';
const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});
const tableName = 'Porcentagens';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    console.log('Authorization Header (GET Porcentagens):', authorizationHeader);
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    console.log('Decoded Token (GET Porcentagens):', decodedToken);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`Scanning table: ${tableName}`);
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoDbClient.send(command);
    const porcentagens = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ porcentagens }, { status: 200 });
  } catch (error) {
    console.error('Error fetching porcentagens:', error);
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
    console.log('Authorization Header (POST Porcentagens):', authorizationHeader);
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    console.log('Decoded Token (POST Porcentagens):', decodedToken);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { perfil, colaboradorId, porcentagem, descricao } = await request.json();

    if (!perfil || (!colaboradorId && perfil === 'colaborador') || !porcentagem) {
      console.error('Validation error: Missing required fields.', { body: request.body });
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

    console.log('Inserting new porcentagem into DynamoDB with params:', params);
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    console.log('New porcentagem successfully inserted into DynamoDB.');

    return NextResponse.json({ porcentagem: newPorcentagem }, { status: 201 });
  } catch (error) {
    console.error('Error adding porcentagem:', error);
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
