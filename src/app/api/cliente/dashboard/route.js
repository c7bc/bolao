// app/api/cliente/dashboard/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cli_id = decodedToken.cli_id;

    // Buscar dados do cliente
    const params = {
      TableName: 'Cliente',
      Key: {
        cli_id: { S: cli_id },
      },
    };

    const command = new GetItemCommand(params);
    const result = await dynamoDbClient.send(command);

    if (!result.Item) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const cliente = unmarshall(result.Item);

    // Para simplicidade, vamos assumir que totalGanho e mensagens são calculados aqui
    const totalGanho = 0; // Calcular com base nos ganhos
    const mensagens = []; // Buscar mensagens se houver

    return NextResponse.json(
      {
        cli_nome: cliente.cli_nome,
        totalGanho,
        mensagens,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching cliente data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
