// src/app/api/historico-cliente/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { updateGameStatuses } from '../../../utils/updateGameStatuses';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler para listar o histórico do cliente.
 * Permite ao cliente ver suas próprias apostas.
 */
export async function GET(request) {
  try {
    // Atualizar status dos jogos antes de qualquer operação
    await updateGameStatuses();

    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clienteId = decodedToken.cli_id;

    // Obter os parâmetros da query string (opcional)
    const url = new URL(request.url);
    const jogoSlug = url.searchParams.get('jogo_slug');
    const status = url.searchParams.get('status'); // ex: 'vencedora', 'não vencedora', 'pending'

    // Parâmetros do QueryCommand
    const params = {
      TableName: 'HistoricoCliente',
      IndexName: 'cliente-id-index', // Assegure-se de que este GSI existe para htc_idcliente
      KeyConditionExpression: 'htc_idcliente = :cliente_id',
      ExpressionAttributeValues: {
        ':cliente_id': { S: clienteId },
      },
      ProjectionExpression: 'htc_id, htc_transactionid, htc_status, htc_idjogo, htc_deposito, htc_datacriacao, htc_dataupdate, ' +
                           'htc_cota1, htc_cota2, htc_cota3, htc_cota4, htc_cota5, htc_cota6, htc_cota7, htc_cota8, htc_cota9, htc_cota10, ' +
                           'htc_dezena, htc_horario',
      Limit: 100, // Limite para evitar queries muito grandes
    };

    // Adicionar filtros adicionais se fornecidos
    if (jogoSlug) {
      params.KeyConditionExpression += ' AND htc_idjogo = :jogo_slug';
      params.ExpressionAttributeValues[':jogo_slug'] = { S: jogoSlug };
    }

    if (status) {
      params.FilterExpression = 'htc_status = :status';
      params.ExpressionAttributeValues[':status'] = { S: status };
    }

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);
    const historico = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    return NextResponse.json({ historico }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar historicoCliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
