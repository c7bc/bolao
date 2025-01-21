// src/app/api/superadmin/clients/search/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 403 });
    }

    // Obter parâmetro de busca
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';

    // Criar expressão de filtro para a busca
    const scanParams = {
      TableName: 'Cliente',
      FilterExpression: 'contains(cli_nome, :query) OR contains(cli_email, :query)',
      ExpressionAttributeValues: {
        ':query': { S: searchQuery.toLowerCase() }
      }
    };

    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);

    const clients = result.Items.map(item => {
      const client = unmarshall(item);
      return {
        cli_id: client.cli_id,
        cli_nome: client.cli_nome,
        cli_email: client.cli_email,
        cli_status: client.cli_status,
      };
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error searching clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}