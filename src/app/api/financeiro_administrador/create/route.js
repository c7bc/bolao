// app/api/financeiro-administrador/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Financeiro_Administrador';

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      fid_id_historico_cliente,
      fid_status,
      fid_valor_admin,
      fid_valor_colaborador,
      fid_valor_rede,
    } = await request.json();

    if (
      !fid_id_historico_cliente ||
      !fid_status ||
      !fid_valor_admin ||
      !fid_valor_colaborador ||
      !fid_valor_rede
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const fid_id = uuidv4();

    const newFinanceiroAdministrador = {
      fid_id,
      fid_id_historico_cliente,
      fid_status,
      fid_valor_admin,
      fid_valor_colaborador,
      fid_valor_rede,
      fid_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newFinanceiroAdministrador),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ financeiroAdministrador: newFinanceiroAdministrador }, { status: 201 });
  } catch (error) {
    console.error('Error creating financeiro_administrador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
