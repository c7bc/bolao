// Caminho: src/app/api/colaborador/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Colaborador'; // Verifique o nome da tabela

/**
 * Rota GET para obter detalhes de um colaborador específico.
 */
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const dbParams = {
      TableName: tableName,
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

/**
 * Rota PUT para atualizar um colaborador específico.
 */
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

    Object.keys(updatedData).forEach((key) => {
      if (allowedFields.includes(key)) {
        ExpressionAttributeNames[`#${key}`] = key;
        ExpressionAttributeValues[`:${key}`] = { S: updatedData[key].toString() };
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
    console.error('Error updating colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
