// app/api/cliente/register/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function POST(request) {
  try {
    const {
      cli_nome,
      cli_email,
      cli_telefone,
      cli_password,
      cli_idcolaborador,
    } = await request.json();

    // Verificar campos obrigatórios
    if (!cli_nome || !cli_email || !cli_telefone || !cli_password) {
      console.log('Missing required fields:', {
        cli_nome,
        cli_email,
        cli_telefone,
        cli_password,
      });
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(cli_password, 10);
    const cli_id = uuidv4();

    const newCliente = {
      cli_id,
      cli_status: 'active',
      cli_nome,
      cli_email,
      cli_telefone,
      cli_password: hashedPassword,
      cli_idcolaborador: cli_idcolaborador || null,
      cli_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: 'Cliente',
      Item: marshall(newCliente),
    };

    console.log('Attempting to save to DynamoDB with params:', params);

    // Tentar salvar o item no DynamoDB
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Logar sucesso
    console.log('Cliente successfully registered:', newCliente);

    // Remover informações sensíveis antes de enviar a resposta
    delete newCliente.cli_password;
    return NextResponse.json({ cliente: newCliente }, { status: 201 });
  } catch (error) {
    // Logar detalhes do erro
    console.error('Error during DynamoDB put operation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
