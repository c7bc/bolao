// src/app/api/admin/commission/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Configuracoes';

export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      (decodedToken.role !== 'admin' &&
        decodedToken.role !== 'superadmin')
    ) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const {
      conf_nome, // Nome da configuração, por exemplo: 'comissao_colaborador'
      conf_descricao, // Descrição da configuração
      conf_valor, // Valor da comissão, por exemplo: 10 para 10%
    } = await request.json();

    // Validação de campos obrigatórios
    if (!conf_nome || !conf_valor) {
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    // Verificar se a configuração já existe
    const getConfigParams = {
      TableName: tableName,
      Key: marshall({ conf_nome }),
    };

    const { GetItemCommand } = require('@aws-sdk/client-dynamodb');
    const getConfigCommand = new GetItemCommand(getConfigParams);
    const configData = await dynamoDbClient.send(getConfigCommand);

    if (configData.Item) {
      return NextResponse.json({ error: 'Configuração já existe.' }, { status: 400 });
    }

    // Preparar dados para o DynamoDB
    const config_id = uuidv4();

    const novaConfiguracao = {
      conf_id: config_id,
      conf_nome,
      conf_descricao: conf_descricao || null,
      conf_valor: parseFloat(conf_valor),
      conf_datacriacao: new Date().toISOString(),
    };

    const putParams = {
      TableName: tableName,
      Item: marshall(novaConfiguracao),
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    console.log('Nova configuração de comissão inserida:', novaConfiguracao);

    return NextResponse.json({ configuracao: novaConfiguracao }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar configuração de comissão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
