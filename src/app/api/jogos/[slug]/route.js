// src/app/api/jogos/[slug]/route.js

'use strict';

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  DeleteItemCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Busca um jogo pelo slug.
 */
export async function GET(request, { params }) {
  const { slug } = params;

  try {
    // Parâmetros para consultar o jogo pelo slug
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    // Verificar se tem token na requisição
    const authorizationHeader = request.headers.get('authorization');
    let isAuthenticated = false;

    if (authorizationHeader) {
      const token = authorizationHeader.split(' ')[1];
      try {
        const decodedToken = verifyToken(token);
        if (decodedToken) {
          isAuthenticated = true;
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
      }
    }

    // Adicionar informação de autenticação ao jogo
    const jogoComAuth = {
      ...jogo,
      isAuthenticated,
    };

    return NextResponse.json({ jogo: jogoComAuth }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler DELETE - Deleta um jogo pelo slug.
 */
export async function DELETE(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Authorization header ausente.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Buscar jogo pelo slug
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    // Deletar o jogo usando o jog_id
    const deleteParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    return NextResponse.json({ message: 'Jogo deletado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza um jogo pelo slug.
 */
export async function PUT(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Authorization header ausente.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Buscar jogo pelo slug
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);
    const updateData = await request.json();

    // Criar expressão de atualização dinâmica
    let updateExpression = 'SET';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    const updateAttributes = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'jog_id' && key !== 'slug') {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        updateAttributes.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    });

    // Adicionar data de modificação
    updateAttributes.push('#datamod = :datamod');
    expressionAttributeNames['#datamod'] = 'jog_datamodificacao';
    expressionAttributeValues[':datamod'] = new Date().toISOString();

    if (updateAttributes.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    updateExpression += ' ' + updateAttributes.join(', ');

    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
