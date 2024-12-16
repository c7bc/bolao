// src/app/api/colaborador/[id]/route.js (Ensure no duplicates, complete code)

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const dbParams = {
      TableName: 'Colaborador',
      Key: {
        col_id: { S: id },
      },
    };

    const command = new GetItemCommand(dbParams);
    const result = await dynamoDbClient.send(command);

    if (!result.Item) {
      return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 });
    }

    const colaborador = unmarshall(result.Item);

    return NextResponse.json({ colaborador }, { status: 200 });
  } catch (error) {
    console.error('Error fetching colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedData = await request.json();

    const updateExpressions = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(updatedData).forEach((key) => {
      updateExpressions.push(`#${key} = :${key}`);
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = updatedData[key];
    });

    const updateParams = {
      TableName: 'Colaborador',
      Key: {
        col_id: { S: id },
      },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeNames,
      ExpressionAttributeValues: marshall(ExpressionAttributeValues),
      ReturnValues: 'UPDATED_NEW',
    };

    const command = new UpdateItemCommand(updateParams);
    await dynamoDbClient.send(command);

    return NextResponse.json({ message: 'Colaborador atualizado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
