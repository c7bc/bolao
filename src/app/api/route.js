// app/api/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});


export async function GET(request) {
  try {
    const params = {
      TableName: 'Jogos',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'jog_status' },
      ExpressionAttributeValues: { ':status': { S: 'ativo' } },
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    const jogos = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
