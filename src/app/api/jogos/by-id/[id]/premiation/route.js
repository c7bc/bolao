// Caminho: src/app/api/jogos/[slug]/premiation/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Busca detalhes de premiação de um jogo.
 */
export async function GET(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Retornar detalhes de premiação
    const premiation = jogo.premiation || {};

    return NextResponse.json({ premiation }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar premiação:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza detalhes de premiação de um jogo.
 */
export async function PUT(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { active, campeao, vice, ultimoColocado, comissaoColaboradores, custosAdministrativos, pointPrizes } = await request.json();

    // Validar se a soma das porcentagens é 100%
    if (active) {
      const total = (parseFloat(comissaoColaboradores) || 0) +
                    (parseFloat(custosAdministrativos) || 0) +
                    (pointPrizes.reduce((acc, prize) => acc + (prize.porcentagem || 0), 0));
      if (total !== 100) {
        return NextResponse.json({ error: 'A soma das porcentagens deve ser igual a 100%.' }, { status: 400 });
      }
    }

    // Atualizar detalhes de premiação no jogo
    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
      UpdateExpression: `
        SET premiation = :premiation, jog_datamodificacao = :datamodificacao
      `,
      ExpressionAttributeValues: marshall({
        ':premiation': {
          active,
          campeao,
          vice,
          ultimoColocado,
          comissaoColaboradores,
          custosAdministrativos,
          pointPrizes,
        },
        ':datamodificacao': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    // Buscar jogo para obter jog_id
    const getParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(getParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar premiação:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
