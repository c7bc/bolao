// src/app/api/cliente/financialhistory/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Financeiro_Cliente';
const indexName = 'cli_financial-index';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queryParams = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: 'cli_id = :id',
      ExpressionAttributeValues: {
        ':id': { S: id },
      },
      ScanIndexForward: false,
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return NextResponse.json({ financials: null }, { status: 200 });
    }

    const financials = response.Items.map((item) => unmarshall(item));

    return NextResponse.json({ financials }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial history:', error);

    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'Table or index not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}