// src/app/api/jogos/update-status/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const { jog_id } = await request.json();

    if (!jog_id) {
      return NextResponse.json({ error: 'Campo jog_id é obrigatório.' }, { status: 400 });
    }

    // Buscar o jogo atual
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const gameResult = await dynamoDbClient.send(getCommand);

    if (!gameResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(gameResult.Item);

    // Lógica para atualizar o status
    let novoStatus = jogo.jog_status;

    const agora = new Date();
    const dataFim = jogo.data_fim ? new Date(jogo.data_fim) : null;

    if (jogo.jog_status === 'aberto') {
      if (dataFim && agora >= dataFim) {
        novoStatus = 'fechado';
      }
    } else if (jogo.jog_status === 'fechado') {
      // Verificar se há um ganhador com a pontuação necessária
      const ganhadoresParams = {
        TableName: 'Ganhadores',
        IndexName: 'jog_id-index',
        KeyConditionExpression: 'jog_id = :jog_id AND acertos >= :pontuacao',
        ExpressionAttributeValues: marshall({
          ':jog_id': jog_id,
          ':pontuacao': jogo.pontosPorAcerto,
        }),
      };

      const ganhadoresCommand = new QueryCommand(ganhadoresParams);
      const ganhadoresResult = await dynamoDbClient.send(ganhadoresCommand);

      if (ganhadoresResult.Items.length > 0) {
        novoStatus = 'encerrado';
      }
    }

    // Atualizar o status se necessário
    if (novoStatus !== jogo.jog_status) {
      const updateParams = {
        TableName: 'Jogos',
        Key: marshall({ jog_id }),
        UpdateExpression: 'set jog_status = :novoStatus, jog_datamodificacao = :modificacao',
        ExpressionAttributeValues: marshall({
          ':novoStatus': novoStatus,
          ':modificacao': agora.toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      const updateResult = await dynamoDbClient.send(updateCommand);

      const jogoAtualizado = unmarshall(updateResult.Attributes);

      return NextResponse.json({ status: jogoAtualizado.jog_status }, { status: 200 });
    }

    return NextResponse.json({ status: novoStatus }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar status do jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
