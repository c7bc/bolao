// src/app/api/colaborador/jogos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const col_id = searchParams.get('col_id');
    if (!col_id) {
      return NextResponse.json({ error: 'Colaborador ID (col_id) is required.' }, { status: 400 });
    }

    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query para pegar os jogos ativos do colaborador
    const params = {
      TableName: 'Jogos',
      IndexName: 'colaborador_id-index', // Supondo que você tenha um índice para filtrar por colaborador
      KeyConditionExpression: 'col_id = :col_id and jog_status = :status',
      ExpressionAttributeValues: {
        ':col_id': { S: col_id },
        ':status': { S: 'ativo' }, // Status "ativo" para jogos ativos
      },
    };

    const activeCommand = new QueryCommand(params);
    const activeResult = await dynamoDbClient.send(activeCommand);
    const jogosAtivos = activeResult.Items.map(item => unmarshall(item));

    // Query para pegar os jogos finalizados do colaborador
    params.KeyConditionExpression = 'col_id = :col_id and jog_status = :status';
    params.ExpressionAttributeValues[':status'] = { S: 'finalizado' }; // Status "finalizado"

    const finishedCommand = new QueryCommand(params);
    const finishedResult = await dynamoDbClient.send(finishedCommand);
    const jogosFinalizados = finishedResult.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogosAtivos, jogosFinalizados }, { status: 200 });

  } catch (error) {
    console.error('Error fetching jogos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
