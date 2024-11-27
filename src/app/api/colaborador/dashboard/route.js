// src/app/api/colaborador/dashboard/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Colaborador';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const col_id = decodedToken.col_id; // Assume que o ID do colaborador está no token

    const dbParams = {
      TableName: tableName,
      Key: {
        col_id: { S: col_id },
      },
    };

    const command = new GetItemCommand(dbParams);
    const result = await dynamoDbClient.send(command);

    if (!result.Item) {
      return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 });
    }

    const colaborador = unmarshall(result.Item);

    // Aqui você pode calcular dados adicionais, como comissão acumulada e total de clientes, se necessário

    return NextResponse.json({
      col_id: colaborador.col_id,
      col_nome: colaborador.col_nome,
      totalClientes: colaborador.totalClientes || 0,
      comissaoAcumulada: colaborador.comissaoAcumulada || 0,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching colaborador dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
