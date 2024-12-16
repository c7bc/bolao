// app/api/configuracoes/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Configuracoes';

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      conf_nome,
      conf_descricao,
      conf_valor,
      conf_porcentagem,
    } = await request.json();

    if (!conf_nome || !conf_valor || !conf_porcentagem) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const config_id = uuidv4();

    const newConfiguracao = {
      config_id,
      conf_nome,
      conf_descricao: conf_descricao || null,
      conf_valor,
      conf_porcentagem,
      conf_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newConfiguracao),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ configuracao: newConfiguracao }, { status: 201 });
  } catch (error) {
    console.error('Error creating configuracao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
