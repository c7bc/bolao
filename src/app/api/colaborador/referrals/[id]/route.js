// src/app/api/colaborador/referrals/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Cliente';
const indexName = 'cli_idcolaborador-index';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if index exists
    const describeCommand = new DescribeTableCommand({ TableName: tableName });
    const tableInfo = await dynamoDbClient.send(describeCommand);
    const indexExists = tableInfo.Table.GlobalSecondaryIndexes?.some(
      (index) => index.IndexName === indexName
    );

    if (!indexExists) {
      return NextResponse.json(
        { error: `Index ${indexName} does not exist in table ${tableName}.` },
        { status: 400 }
      );
    }

    const queryParams = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: 'cli_idcolaborador = :id',
      ExpressionAttributeValues: {
        ':id': { S: id },
      },
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    const referrals = response.Items.map((item) => unmarshall(item));

    return NextResponse.json({ referrals }, { status: 200 });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
