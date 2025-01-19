// /api/cliente/historico/completo/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const clienteId = decodedToken.cli_id;

    // 1. Buscar todas as apostas do cliente
    const apostasParams = {
      TableName: 'Apostas',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      }, { removeUndefinedValues: true })
    };

    const apostasCommand = new QueryCommand(apostasParams);
    const apostasResult = await dynamoDbClient.send(apostasCommand);
    const apostas = apostasResult.Items.map(item => unmarshall(item));

    // 2. Buscar todas as premiações do cliente
    const premiacoesParams = {
      TableName: 'Premiacoes',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      }, { removeUndefinedValues: true })
    };

    const premiacoesCommand = new QueryCommand(premiacoesParams);
    const premiacoesResult = await dynamoDbClient.send(premiacoesCommand);
    const premiacoes = premiacoesResult.Items.map(item => unmarshall(item));

    // 3. Buscar detalhes dos jogos relacionados
    const jogosIds = new Set([
      ...apostas.map(a => a.jog_id),
      ...premiacoes.map(p => p.jog_id)
    ]);

    const jogosParticipados = [];
    for (const jog_id of jogosIds) {
      const jogoParams = {
        TableName: 'Jogos',
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: marshall({
          ':jogId': jog_id
        }, { removeUndefinedValues: true })
      };

      const jogoCommand = new QueryCommand(jogoParams);
      const jogoResult = await dynamoDbClient.send(jogoCommand);
      if (jogoResult.Items && jogoResult.Items.length > 0) {
        jogosParticipados.push(unmarshall(jogoResult.Items[0]));
      }
    }

    // 4. Processar e enriquecer os dados
    const apostasProcessadas = await Promise.all(apostas.map(async (aposta) => {
      const jogo = jogosParticipados.find(j => j.jog_id === aposta.jog_id);
      return {
        aposta_id: aposta.aposta_id,
        data_aposta: aposta.data_criacao,
        jogo_nome: jogo?.jog_nome || 'Jogo não encontrado',
        numeros_escolhidos: aposta.palpite_numbers,
        valor: aposta.valor,
        status: aposta.status
      };
    }));

    const premiacoesProcessadas = await Promise.all(premiacoes.map(async (premio) => {
      const jogo = jogosParticipados.find(j => j.jog_id === premio.jog_id);
      return {
        premiacao_id: premio.premiacao_id,
        data_premiacao: premio.data_criacao,
        jogo_nome: jogo?.jog_nome || 'Jogo não encontrado',
        valor: premio.premio,
        pago: premio.pago,
        data_pagamento: premio.data_pagamento
      };
    }));

    const jogosProcessados = jogosParticipados.map(jogo => ({
      jog_id: jogo.jog_id,
      jog_nome: jogo.jog_nome,
      data_inicio: jogo.data_inicio,
      data_fim: jogo.data_fim,
      status: jogo.jog_status,
      resultado: jogo.resultado
    }));

    return NextResponse.json({
      apostas: apostasProcessadas,
      premiacoes: premiacoesProcessadas,
      jogosParticipados: jogosProcessados
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}