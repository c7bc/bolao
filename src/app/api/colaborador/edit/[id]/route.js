// src/app/api/colaborador/edit/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Colaborador';

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

    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    let UpdateExpression = 'set';
    let prefix = ' ';

    Object.keys(updateData).forEach((key) => {
      if (key !== 'col_id') {
        ExpressionAttributeNames[`#${key}`] = key;
        ExpressionAttributeValues[`:${key}`] = { S: updateData[key].toString() };
        UpdateExpression += `${prefix}#${key} = :${key}`;
        prefix = ', ';
      }
    });

    const paramsUpdate = {
      TableName: tableName,
      Key: marshall({ col_id: id }),
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const command = new UpdateItemCommand(paramsUpdate);
    const response = await dynamoDbClient.send(command);
    const updatedColaborador = unmarshall(response.Attributes);

    return NextResponse.json({ colaborador: updatedColaborador }, { status: 200 });
  } catch (error) {
    console.error('Error editing colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
