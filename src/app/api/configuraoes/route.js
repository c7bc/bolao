// src/app/api/configuracoes/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Busca as configurações de rateio.
 */
export async function GET(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const getParams = {
      TableName: 'Configuracoes',
      Key: marshall({ conf_nome: 'rateio' }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Configurações não encontradas.' }, { status: 404 });
    }

    const configuracoes = unmarshall(getResult.Item);

    return NextResponse.json({ configuracoes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching configuracoes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza as configurações de rateio.
 */
export async function PUT(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { rateio } = await request.json();

    // Validação das porcentagens
    const total = Object.values(rateio).reduce((acc, val) => acc + parseFloat(val), 0);
    if (total !== 100) {
      return NextResponse.json(
        { error: 'A soma das porcentagens deve ser 100.' },
        { status: 400 }
      );
    }

    const params = {
      TableName: 'Configuracoes',
      Item: marshall({
        conf_nome: 'rateio',
        ...rateio,
        conf_datacriacao: new Date().toISOString(),
      }),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ message: 'Configurações atualizadas com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating configuracoes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
