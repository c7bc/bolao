import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Cliente';

export async function GET(request) {
  try {
    // Verificar autenticação e permissões
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obter o telefone dos parâmetros da URL
    const url = new URL(request.url);
    const telefone = url.searchParams.get('telefone'); // Telefone enviado como parâmetro

    const scanParams = {
      TableName: tableName,
    };

    if (telefone) {
      // Adicionar filtro se o telefone estiver presente
      scanParams.FilterExpression = 'cli_telefone = :telefone';
      scanParams.ExpressionAttributeValues = {
        ':telefone': { S: telefone },
      };
    }

    // Fazer a consulta ao DynamoDB
    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);

    // Mapear e deserializar os itens
    const clientes = result.Items.map((item) => unmarshall(item));

    return NextResponse.json({ clientes }, { status: 200 });
  } catch (error) {
    console.error('Error listing clientes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
