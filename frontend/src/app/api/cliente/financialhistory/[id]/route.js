// Caminho: src/app/api/cliente/financialhistory/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
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
 * Handler GET - Buscar detalhes específicos de uma transação financeira do cliente
 */
export async function GET(request, { params }) {
  const { id } = params; // id é o fin_id

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

    // Parâmetros para obter a transação financeira específica
    const getParams = {
      TableName: 'Financeiro_Cliente',
      Key: {
        fin_id: { S: id },
      },
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Transação financeira não encontrada.' }, { status: 404 });
    }

    const transacao = unmarshall(getResult.Item);

    // Verificar se a transação pertence ao cliente
    if (transacao.cli_id !== cli_id) {
      return NextResponse.json({ error: 'Transação financeira não pertence ao cliente.' }, { status: 403 });
    }

    return NextResponse.json({ financial: transacao }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar detalhes da transação financeira do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
