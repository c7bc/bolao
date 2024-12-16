import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';

// Configuração do cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, 
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // 1. Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    // Verifica se o token é válido e se o usuário tem uma das roles permitidas
    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Obter os parâmetros da query string
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active'; 

    // 3. Verificar se a tabela existe antes de configurar o QueryCommand
    const listTablesCommand = new ListTablesCommand({});
    const listTablesResult = await dynamoDbClient.send(listTablesCommand);
    const tableNames = listTablesResult.TableNames;

    if (!tableNames.includes('Cliente')) {
      console.error('Table "Clientes" does not exist');
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // 4. Configurar os parâmetros do QueryCommand
    const command = new QueryCommand({
      TableName: 'Cliente',
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#st = :status',
      ExpressionAttributeNames: {
        '#st': 'status',
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
      },
      ProjectionExpression: 'cli_id, nome, email, #st', 
      Limit: 100,
    });

    // 5. Executar a consulta
    const result = await dynamoDbClient.send(command);

    // 6. Converter os itens retornados para objetos JavaScript
    const clientes = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // 7. Retornar a resposta
    return NextResponse.json({ clientes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}