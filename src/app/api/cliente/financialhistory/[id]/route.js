// src/app/api/cliente/financialhistory/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Financeiro_Cliente';
const indexName = 'cli_financial-index';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queryParams = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: 'cli_id = :id',
      ExpressionAttributeValues: {
        ':id': { S: id },
      },
      ScanIndexForward: false, // Ordenar por data de criação descendente
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    const financials = response.Items.map(item => unmarshall(item));

    return NextResponse.json({ financials }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial history:', error);
    if (error.name === 'ValidationException') {
      return NextResponse.json({ financials: [] }, { status: 200 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
