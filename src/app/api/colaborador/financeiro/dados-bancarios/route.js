// src/app/api/colaborador/dados-bancarios/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const command = new ScanCommand({
      TableName: 'Dados_Bancarios',
      FilterExpression: 'dba_idcolaborador = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: decodedToken.col_id }
      }
    });

    const response = await dynamoDbClient.send(command);
    const dadosBancarios = response.Items[0] ? unmarshall(response.Items[0]) : {};

    return NextResponse.json({ dadosBancarios });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}