// src/app/api/activities/recent/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parâmetros do Scan com alias para 'timestamp'
    const recentActivitiesCommand = new ScanCommand({
      TableName: 'Atividades', // Nome correto da tabela
      ProjectionExpression: 'atividadeId, descricao, #ts',
      ExpressionAttributeNames: {
        '#ts': 'timestamp', // Alias para evitar palavra reservada
      },
      Limit: 100, // Limite para evitar scans muito grandes
      // Adicione filtros ou ordenação conforme necessário
    });

    // Execução do Scan
    const recentActivitiesResult = await dynamoDbClient.send(recentActivitiesCommand);

    // Conversão dos itens
    const atividadesRecentes = recentActivitiesResult.Items.map(item => unmarshall(item));

    // Retorno da resposta
    return NextResponse.json({ atividades: atividadesRecentes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
