// app/api/jogos/list/route.js

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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const params = {
      TableName: 'Jogos',
    };

    if (status) {
      params.FilterExpression = 'jog_status = :status';
      params.ExpressionAttributeValues = {
        ':status': { S: status },
      };
    }

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    const jogos = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error listing jogos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
