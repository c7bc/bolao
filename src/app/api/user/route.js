import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});


export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { cli_id, role } = decodedToken;

    console.log('Decoded Token:', decodedToken);

    if (role !== 'cliente') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar informações do cliente
    const userParams = {
      TableName: 'Cliente', // Nome correto da tabela
      Key: {
        cli_id: { S: cli_id }, // Chave formatada corretamente
      },
    };

    const userCommand = new GetItemCommand(userParams);
    const userResult = await dynamoDbClient.send(userCommand);

    console.log('Resultado da consulta DynamoDB:', userResult);

    if (!userResult || !userResult.Item) {
      console.error(`Cliente com ID ${cli_id} não encontrado`);
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const user = unmarshall(userResult.Item);

    // Retornar os dados do cliente
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
