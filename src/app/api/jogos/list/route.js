// src/app/api/jogos/list/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nome = searchParams.get('nome');

    let filterExpression = '';
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (status) {
      filterExpression += '#st = :status';
      expressionAttributeValues[':status'] = { S: status };
      expressionAttributeNames['#st'] = 'jog_status';
    }

    if (nome) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'contains(#nome, :nome)';
      expressionAttributeValues[':nome'] = { S: nome };
      expressionAttributeNames['#nome'] = 'jog_nome';
    }

    const params = {
      TableName: 'Jogos',
      ...(filterExpression && {
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
      }),
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    const jogos = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jogos:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}