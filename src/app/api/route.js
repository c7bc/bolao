// app/api/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
