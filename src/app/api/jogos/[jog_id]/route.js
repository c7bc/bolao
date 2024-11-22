// app/api/jogos/[jog_id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});


export async function GET(request, { params }) {
  const { jog_id } = params;

  try {
    const dbParams = {
      TableName: 'Jogos',
      Key: {
        jog_id: { S: jog_id },
      },
    };

    const command = new GetItemCommand(dbParams);
    const result = await dynamoDbClient.send(command);

    if (!result.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(result.Item);

    return NextResponse.json({ jogo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
