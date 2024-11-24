// src/app/api/config/recebimentos/route.js

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

const tableName = 'Recebimentos';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    console.log('Authorization Header (GET Recebimentos):', authorizationHeader);
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    console.log('Decoded Token (GET Recebimentos):', decodedToken);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`Scanning table: ${tableName}`);
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
    console.log('Authorization Header (POST Recebimentos):', authorizationHeader);
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    console.log('Decoded Token (POST Recebimentos):', decodedToken);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
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
      console.error('Validation error: Missing required fields.', { body: request.body });
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

    console.log('Inserting new recebimento into DynamoDB with params:', params);
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    console.log('New recebimento successfully inserted into DynamoDB.');

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
