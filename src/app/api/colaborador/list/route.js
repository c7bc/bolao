// src/app/api/colaborador/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = {
      TableName: 'Colaborador',
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    const colaboradores = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ colaboradores }, { status: 200 });
  } catch (error) {
    console.error('Error listing colaboradores:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
