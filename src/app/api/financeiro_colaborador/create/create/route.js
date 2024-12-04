// src/app/api/financeiro_colaborador/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Financeiro_Colaborador';

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      fic_idcolaborador,
      fic_idcliente,
      fic_deposito_cliente,
      fic_porcentagem,
      fic_comissao,
      fic_tipocomissao,
      fic_descricao,
    } = await request.json();

    if (
      !fic_idcolaborador ||
      !fic_idcliente ||
      !fic_deposito_cliente ||
      !fic_porcentagem ||
      !fic_comissao ||
      !fic_tipocomissao
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const fic_id = uuidv4();

    const newFinanceiroColaborador = {
      fic_id,
      fic_idcolaborador,
      fic_idcliente,
      fic_deposito_cliente,
      fic_porcentagem,
      fic_comissao,
      fic_tipocomissao,
      fic_descricao: fic_descricao || null,
    };

    const params = {
      TableName: tableName,
      Item: marshall(newFinanceiroColaborador),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ financeiroColaborador: newFinanceiroColaborador }, { status: 201 });
  } catch (error) {
    console.error('Error creating financeiro_colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
