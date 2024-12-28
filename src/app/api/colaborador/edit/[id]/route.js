// Caminho: src/app/api/colaborador/edit/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Colaborador'; // Verifique o nome da tabela

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

    const allowedFields = [
      'col_nome',
      'col_documento',
      'col_email',
      'col_telefone',
      'col_rua',
      'col_numero',
      'col_bairro',
      'col_cidade',
      'col_estado',
      'col_cep',
      // Adicione outros campos permitidos para atualização
    ];

    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    let UpdateExpression = 'SET';
    let prefix = ' ';

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        ExpressionAttributeNames[`#${key}`] = key;
        ExpressionAttributeValues[`:${key}`] = { S: updateData[key].toString() };
        UpdateExpression += `${prefix}#${key} = :${key}`;
        prefix = ', ';
      }
    });

    if (prefix === ', ') {
      // Nenhum campo válido para atualizar
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 });
    }

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
