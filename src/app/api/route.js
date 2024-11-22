// app/api/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Função para validar se todas as variáveis de ambiente necessárias estão presentes
const validateEnv = () => {
  const requiredEnv = ['REGION', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY'];
  const missingEnv = requiredEnv.filter((env) => !process.env[env]);

  if (missingEnv.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missingEnv.join(', ')}`);
  }
};

export async function GET(request) {
  try {
    // Valida as variáveis de ambiente antes de criar o cliente DynamoDB
    validateEnv();

    const dynamoDbClient = new DynamoDBClient({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });

    const params = {
      TableName: 'Jogos',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'jog_status' },
      ExpressionAttributeValues: { ':status': { S: 'ativo' } },
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    // Verifica se há itens retornados
    const jogos = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching games:', error);

    // Prepara uma mensagem de erro mais detalhada
    let errorMessage = 'Erro Interno do Servidor';
    let statusCode = 500;

    if (error.name === 'CredentialsProviderError' || error.message.includes('credential')) {
      errorMessage = 'Problema com as credenciais da AWS: ' + error.message;
      statusCode = 403; // Forbidden
    } else if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'Tabela DynamoDB não encontrada: ' + error.message;
      statusCode = 404;
    } else if (error.name === 'ValidationException') {
      errorMessage = 'Parâmetros de solicitação inválidos: ' + error.message;
      statusCode = 400;
    } else {
      // Outros tipos de erro
      errorMessage = error.message || errorMessage;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
