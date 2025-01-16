// src/app/api/configuracoes/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Configuracoes';
const configId = 'rateio';

/**
 * Handler GET - Obtém as configurações de rateio.
 */
export async function GET(request) {
  try {
    // Autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parâmetros para obter a configuração de rateio
    const getParams = {
      TableName: tableName,
      Key: marshall({ config_id: configId }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      // Retornar configuracoes como null se não encontradas
      return NextResponse.json({ configuracoes: null }, { status: 200 });
    }

    const configuracoes = unmarshall(getResult.Item);

    return NextResponse.json({ configuracoes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza as configurações de rateio.
 */
export async function PUT(request) {
  try {
    // Autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const {
      rateio_10_pontos,
      rateio_9_pontos,
      rateio_menos_pontos,
      custos_administrativos,
    } = await request.json();

    // Validação de campos obrigatórios
    if (
      rateio_10_pontos === undefined ||
      rateio_9_pontos === undefined ||
      rateio_menos_pontos === undefined ||
      custos_administrativos === undefined
    ) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: rateio_10_pontos, rateio_9_pontos, rateio_menos_pontos, custos_administrativos.' },
        { status: 400 }
      );
    }

    // Validação da soma das porcentagens
    const total =
      parseFloat(rateio_10_pontos) +
      parseFloat(rateio_9_pontos) +
      parseFloat(rateio_menos_pontos) +
      parseFloat(custos_administrativos);

    if (total !== 100) {
      return NextResponse.json(
        { error: 'A soma das porcentagens deve ser igual a 100%.' },
        { status: 400 }
      );
    }

    // Preparar UpdateExpression e ExpressionAttributeValues
    const updateParams = {
      TableName: tableName,
      Key: marshall({ config_id: configId }),
      UpdateExpression:
        'SET rateio_10_pontos = :rateio_10_pontos, rateio_9_pontos = :rateio_9_pontos, rateio_menos_pontos = :rateio_menos_pontos, custos_administrativos = :custos_administrativos, updated_at = :updated_at',
      ExpressionAttributeValues: marshall({
        ':rateio_10_pontos': rateio_10_pontos.toString(),
        ':rateio_9_pontos': rateio_9_pontos.toString(),
        ':rateio_menos_pontos': rateio_menos_pontos.toString(),
        ':custos_administrativos': custos_administrativos.toString(),
        ':updated_at': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const configuracoesAtualizadas = unmarshall(updateResult.Attributes);

    return NextResponse.json({ configuracoes: configuracoesAtualizadas }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
