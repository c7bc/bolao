// app/api/operacoes/create/route.js

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

const tableName = 'Operacoes';

export async function POST(request) {
  try {
    // Authorization: only allow admin users to create operations
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { opt_nome, opt_grupo, opt_descricao } = await request.json();

    if (!opt_nome || !opt_grupo || !opt_descricao) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const opt_id = uuidv4();

    const newOperacao = {
      opt_id,
      opt_nome,
      opt_grupo,
      opt_descricao,
      opt_datacriacao: new Date().toISOString(),
      opt_dataupdate: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newOperacao),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ operacao: newOperacao }, { status: 201 });
  } catch (error) {
    console.error('Error creating operacao:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
