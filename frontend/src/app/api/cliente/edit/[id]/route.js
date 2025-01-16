// Caminho: src/app/api/cliente/edit/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Cliente';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = await request.json();

    // Define apenas os campos permitidos para atualização
    const allowedFields = ['cli_status', 'cli_nome', 'cli_email', 'cli_telefone'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 });
    }

    // Construir a expressão de atualização
    let UpdateExpression = 'SET';
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(filteredData).forEach((key, index) => {
      UpdateExpression += ` #${key} = :${key}`;
      if (index < Object.keys(filteredData).length - 1) {
        UpdateExpression += ',';
      }
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = { S: filteredData[key].toString() };
    });

    const paramsUpdate = {
      TableName: tableName,
      Key: {
        cli_id: { S: id },
      },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const command = new UpdateItemCommand(paramsUpdate);
    const response = await dynamoDbClient.send(command);
    const updatedCliente = unmarshall(response.Attributes);

    return NextResponse.json({ cliente: updatedCliente }, { status: 200 });
  } catch (error) {
    console.error('Error editing cliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
