// app/api/resultados/create/route.js

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

const tableName = 'Resultados';

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { res_numero } = await request.json();

    if (!res_numero) {
      return NextResponse.json({ error: 'Missing required field: res_numero.' }, { status: 400 });
    }

    const res_id = uuidv4();

    const newResultado = {
      res_id,
      res_numero,
      res_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newResultado),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ resultado: newResultado }, { status: 201 });
  } catch (error) {
    console.error('Error creating resultado:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
