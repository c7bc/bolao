// src/app/api/cliente/details/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Cliente';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const getParams = {
      TableName: tableName,
      Key: {
        cli_id: { S: id },
      },
    };

    const command = new GetItemCommand(getParams);
    const response = await dynamoDbClient.send(command);

    if (!response.Item) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const cliente = unmarshall(response.Item);

    return NextResponse.json({ cliente }, { status: 200 });
  } catch (error) {
    console.error('Error fetching cliente details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
