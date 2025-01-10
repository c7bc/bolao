// src/app/api/jogos/by-id/[id]/lottery/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, QueryCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
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

export async function POST(request, { params }) {
  const { id } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { descricao, numerosSorteados } = await request.json();

    if (!descricao || !numerosSorteados) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    // Buscar jogo pelo id
    const getJogoParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: id }),
    };

    const getJogoCommand = new GetItemCommand(getJogoParams);
    const getJogoResult = await dynamoDbClient.send(getJogoCommand);

    if (!getJogoResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(getJogoResult.Item);

    // Verificar se o status é fechado
    if (jogo.jog_status !== 'fechado') {
      return NextResponse.json({ error: 'O sorteio só pode ser realizado após o jogo estar fechado.' }, { status: 400 });
    }

    // Criar registro de sorteio
    const sorteio = {
      sorteio_id: uuidv4(),
      jog_id: jogo.jog_id,
      descricao,
      numerosSorteados,
      dataSorteio: new Date().toISOString(),
    };

    const putParams = {
      TableName: 'Sorteios',
      Item: marshall(sorteio),
      ConditionExpression: 'attribute_not_exists(sorteio_id)',
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({ sorteio }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sorteio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
