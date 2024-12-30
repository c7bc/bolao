// src/app/api/config/taxasComissao/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// GET - Obter todas as taxas de comissão
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scanParams = {
      TableName: 'TaxasComissao',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    const taxas = scanResult.Items.map(item => unmarshall(item));

    return NextResponse.json({ taxas }, { status: 200 });
  } catch (error) {
    console.error('Error fetching taxas de comissão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Criar uma nova taxa de comissão
export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { perfil, porcentagem, descricao } = await request.json();

    // Validar campos obrigatórios
    if (!perfil || porcentagem === undefined) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Validar porcentagem
    if (isNaN(porcentagem) || porcentagem < 0 || porcentagem > 100) {
      return NextResponse.json({ error: 'Invalid porcentagem. Must be between 0 and 100.' }, { status: 400 });
    }

    // Criar ID único para a taxa
    const rateio_id = uuidv4();

    // Preparar item para inserir no DynamoDB
    const taxaItem = {
      rateio_id,
      perfil,
      porcentagem: Number(porcentagem),
      descricao: descricao || '',
    };

    const params = {
      TableName: 'TaxasComissao',
      Item: marshall(taxaItem),
      ConditionExpression: 'attribute_not_exists(rateio_id)',
    };

    const putCommand = new PutItemCommand(params);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({ message: 'Taxa de comissão criada com sucesso.', taxa: taxaItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating taxa de comissão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
