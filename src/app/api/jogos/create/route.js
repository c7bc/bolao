// src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      jog_nome,
      slug,
      visibleInConcursos,
      jog_status,
      jog_tipodojogo,
      jog_valorjogo,
      jog_valorpremio_est,
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros,
      jog_pontos_necessarios,
      jog_data_inicio,
      jog_data_fim,
      jog_creator_id,
      jog_creator_role,
    } = await request.json();

    // Validar campos obrigatórios
    if (
      !jog_nome ||
      !jog_tipodojogo ||
      !jog_valorjogo ||
      !jog_quantidade_minima ||
      !jog_quantidade_maxima ||
      !jog_data_inicio ||
      !jog_data_fim
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Criar ID único para o jogo
    const jog_id = uuidv4();

    // Preparar item para inserir no DynamoDB
    const jogoItem = {
      jog_id,
      jog_nome,
      slug,
      visibleInConcursos,
      jog_status,
      jog_tipodojogo,
      jog_valorjogo: Number(jog_valorjogo),
      jog_valorpremio_est: jog_valorpremio_est ? Number(jog_valorpremio_est) : null,
      jog_quantidade_minima: Number(jog_quantidade_minima),
      jog_quantidade_maxima: Number(jog_quantidade_maxima),
      jog_numeros,
      jog_pontos_necessarios: jog_pontos_necessarios ? Number(jog_pontos_necessarios) : null,
      jog_data_inicio,
      jog_data_fim,
      jog_datacriacao: new Date().toISOString(),
      jog_creator_id,
      jog_creator_role,
    };

    const params = {
      TableName: 'Jogos',
      Item: marshall(jogoItem),
      ConditionExpression: 'attribute_not_exists(jog_id)',
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ message: 'Jogo criado com sucesso.', jogo: jogoItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
