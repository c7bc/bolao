// Caminho: src\app\api\jogos\list\route.js
// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';
import { updateGameStatuses } from '../../../../app/utils/updateGameStatuses';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // Atualizar status dos jogos antes de qualquer operação
    await updateGameStatuses();

    // Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Token not provided' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obter os parâmetros da query string
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'open'; // Valor padrão 'open'
    const slug = url.searchParams.get('slug'); // Para verificar unicidade do slug

    if (slug) {
      // Verificar unicidade do slug usando Scan
      const scanParams = {
        TableName: 'Jogos',
        FilterExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': { S: slug },
        },
        ProjectionExpression: 'jog_id',
        Limit: 1,
      };

      const scanCommand = new ScanCommand(scanParams);
      const scanResult = await dynamoDbClient.send(scanCommand);
      const jogos = scanResult.Items ? scanResult.Items.map(item => unmarshall(item)) : [];
      return NextResponse.json({ jogos }, { status: 200 });
    }

    // Parâmetros do QueryCommand usando o índice secundário 'StatusIndex'
    const command = new QueryCommand({
      TableName: 'Jogos', // Nome correto da tabela
      IndexName: 'StatusIndex', // Índice secundário para 'status'
      KeyConditionExpression: '#st = :status',
      ExpressionAttributeNames: {
        '#st': 'status', // Alias para evitar palavra reservada
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
      },
      ProjectionExpression: 'jog_id, jog_nome, jog_tipodojogo, jog_valorjogo, jog_quantidade_minima, jog_quantidade_maxima, jog_numeros, jog_pontos_necessarios, jog_data_inicio, jog_data_fim, jog_status, visibleInConcursos',
      Limit: 100, // Limite para evitar queries muito grandes
    });

    // Execução do Query
    const result = await dynamoDbClient.send(command);

    // Conversão dos itens
    const jogos = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // Retorno da resposta
    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error:', error.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.error('Error fetching jogos list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
