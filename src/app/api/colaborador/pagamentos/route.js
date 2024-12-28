// Caminho: src/app/api/colaborador/pagamentos/route.js

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

const tableName = 'Pagamentos_Colaborador'; // Verifique o nome da tabela

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryParams = {
      TableName: tableName,
      FilterExpression: 'pag_idcolaborador = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: decodedToken.col_id },
      },
    };

    const command = new ScanCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    if (!response.Items) {
      return NextResponse.json({ pagamentos: [] }, { status: 200 });
    }

    const pagamentos = response.Items.map(item => unmarshall(item));

    return NextResponse.json({ pagamentos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pagamentos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
