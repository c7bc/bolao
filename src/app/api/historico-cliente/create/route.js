// src/app/api/historico-cliente/create/route.js

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

export async function POST(request) {
  try {
    // Clientes criam suas próprias entradas de histórico
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      htc_transactionid,
      htc_status,
      htc_idjogo,
      htc_deposito,
      htc_cotas, // Supondo que cotas é um array de números
    } = await request.json();

    if (!htc_transactionid || !htc_idjogo || !htc_deposito || !htc_cotas) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const htc_id = uuidv4();

    // Preparar cotas
    const cotasData = {};
    htc_cotas.forEach((cota, index) => {
      cotasData[`htc_cota${index + 1}`] = cota;
    });

    const newHistoricoCliente = {
      htc_id,
      htc_transactionid,
      htc_status: htc_status || 'pending',
      htc_idcliente: decodedToken.cli_id,
      htc_idjogo,
      htc_deposito,
      ...cotasData,
      htc_datacriacao: new Date().toISOString(),
      htc_dataupdate: new Date().toISOString(),
    };

    const params = {
      TableName: 'HistoricoCliente',
      Item: marshall(newHistoricoCliente),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ historicoCliente: newHistoricoCliente }, { status: 201 });
  } catch (error) {
    console.error('Error creating historicoCliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
