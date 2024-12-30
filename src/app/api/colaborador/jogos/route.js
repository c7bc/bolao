// Caminho: src/app/api/colaborador/jogos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const jogosTableName = 'Jogos'; // Verifique o nome da tabela

/**
 * Rota POST para criar um novo jogo.
 */
export async function POST(request) {
  try {
    // Verificar o token do colaborador
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      jog_status,
      jog_tipodojogo,
      jog_valorjogo,
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
    } = await request.json();

    if (
      !jog_status ||
      !jog_tipodojogo ||
      !jog_valorjogo ||
      !jog_quantidade_minima ||
      !jog_quantidade_maxima ||
      !jog_numeros ||
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
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
      createdAt: new Date().toISOString(),
      col_id: decodedToken.col_id, // Associar o jogo ao colaborador
    };

    const params = {
      TableName: jogosTableName,
      Item: marshall(newJogo),
    };

    await dynamoDbClient.send(new PutItemCommand(params));

    return NextResponse.json({ message: 'Jogo criado com sucesso!', jogo: newJogo }, { status: 201 });
  } catch (error) {
    console.error('Error creating jogo:', error);
    return NextResponse.json({ error: 'Erro ao criar jogo.' }, { status: 500 });
  }
}
