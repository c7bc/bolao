// src/app/api/activities/recent/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// GET - Buscar atividades recentes
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recentActivitiesCommand = new ScanCommand({
      TableName: 'Atividades',
      ProjectionExpression: 'atividadeId, #tx, descricao, #ts, #st, usuario, tipo',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
        '#st': 'status',
        '#tx': 'text'
      },
      Limit: 100
    });

    const recentActivitiesResult = await dynamoDbClient.send(recentActivitiesCommand);
    const atividadesRecentes = recentActivitiesResult.Items.map(item => {
      const atividade = unmarshall(item);
      return {
        id: atividade.atividadeId,
        text: atividade.text,
        description: atividade.descricao,
        status: atividade.status,
        time: new Date(atividade.timestamp).toLocaleString(),
        user: atividade.usuario,
        type: atividade.tipo
      };
    });

    return NextResponse.json({ 
      atividades: atividadesRecentes.sort((a, b) => new Date(b.time) - new Date(a.time))
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}