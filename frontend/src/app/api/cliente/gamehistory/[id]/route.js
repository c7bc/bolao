// Caminho: src/app/api/cliente/gamehistory/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializa o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Buscar detalhes específicos de uma aposta do cliente
 */
export async function GET(request, { params }) {
  const { id } = params; // id é o aposta_id

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['cliente'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const cli_id = decodedToken.cli_id;

    // Parâmetros para obter a aposta específica
    const getParams = {
      TableName: 'Apostas',
      Key: {
        aposta_id: { S: id },
      },
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Aposta não encontrada.' }, { status: 404 });
    }

    const aposta = unmarshall(getResult.Item);

    // Verificar se a aposta pertence ao cliente
    if (aposta.cli_id !== cli_id) {
      return NextResponse.json({ error: 'Aposta não pertence ao cliente.' }, { status: 403 });
    }

    // Obter detalhes do jogo
    const jogParams = {
      TableName: 'Jogos',
      Key: {
        jog_id: { S: aposta.jog_id },
      },
    };

    const jogCommand = new GetItemCommand(jogParams);
    const jogResult = await dynamoDbClient.send(jogCommand);

    if (!jogResult.Item) {
      return NextResponse.json({ error: 'Jogo associado não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(jogResult.Item);

    // Enriquecer a aposta com detalhes do jogo
    const apostaDetalhada = {
      ...aposta,
      jogo: jogo,
    };

    return NextResponse.json({ aposta: apostaDetalhada }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar detalhes da aposta do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
