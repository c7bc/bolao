// app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});


export async function POST(request) {
  try {
    // Apenas administradores podem criar jogos
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      jog_status,
      jog_tipodojogo,
      jog_valorjogo,
      jog_numeros_totais,
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_expiracao,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
    } = await request.json();

    if (
      !jog_status ||
      !jog_tipodojogo ||
      !jog_valorjogo ||
      !jog_numeros_totais ||
      !jog_quantidade_minima ||
      !jog_quantidade_maxima ||
      !jog_expiracao ||
      !jog_nome ||
      !jog_data_inicio ||
      !jog_data_fim
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const jog_id = uuidv4();

    const newJogo = {
      jog_id,
      jog_status,
      jog_tipodojogo,
      jog_valorjogo,
      jog_numeros_totais,
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_expiracao,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
      jog_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: 'Jogos',
      Item: marshall(newJogo),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ jogo: newJogo }, { status: 201 });
  } catch (error) {
    console.error('Error creating jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
