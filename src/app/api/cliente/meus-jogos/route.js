// src/app/api/cliente/meus-jogos/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryParams = {
      TableName: 'HistoricoCliente',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'htc_idcliente = :clienteId',
      ExpressionAttributeValues: {
        ':clienteId': { S: decodedToken.cli_id },
      },
      ScanIndexForward: false, // Ordenar por data de criação descendente
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    // Transformar os dados para o formato esperado pelo frontend
    const jogos = response.Items.map(item => {
      const data = unmarshall(item);
      return {
        id: data.htc_id,
        nome: data.htc_nome_jogo,
        numeros_escolhidos: Array.from({length: 10}, (_, i) => data[`htc_cota${i + 1}`]).filter(Boolean),
        valor: data.htc_deposito,
        status: data.htc_status,
        data: data.htc_datacriacao,
        numeros_sorteados: data.htc_numeros_sorteados,
        resultado: data.htc_resultado
      };
    });

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching client games:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
