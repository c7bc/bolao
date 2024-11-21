// app/api/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function POST(request) {
  try {
    // Obter token dos headers
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { jogoId, numerosSelecionados } = await request.json();

    // Validar entradas
    if (!jogoId || !numerosSelecionados || !Array.isArray(numerosSelecionados)) {
      return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
    }

    // Obter o jogo
    const getGameParams = {
      TableName: 'Jogos',
      Key: marshall({ id: jogoId }),
    };

    const getGameCommand = new GetItemCommand(getGameParams);
    const gameResult = await dynamoDbClient.send(getGameCommand);

    const jogo = unmarshall(gameResult.Item);

    if (!jogo || jogo.status !== 'ativo') {
      return NextResponse.json({ error: 'Game not found or not active.' }, { status: 400 });
    }

    // Validar números selecionados
    const quantidadeNumeros = numerosSelecionados.length;

    if (
      quantidadeNumeros < jogo.quantidade_minima ||
      quantidadeNumeros > jogo.quantidade_maxima
    ) {
      return NextResponse.json({ error: 'Invalid number of selections.' }, { status: 400 });
    }

    // Criar o bilhete
    const newBilhete = {
      id: `bilhete_${Date.now()}`,
      jogoId,
      clienteEmail: decodedToken.email,
      numerosSelecionados,
      status: 'pendente', // Pagamento pendente
      createdAt: new Date().toISOString(),
    };

    const putParams = {
      TableName: 'Bilhetes',
      Item: marshall(newBilhete),
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({ bilhete: newBilhete }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
