// Caminho: src/app/api/cliente/register/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Cliente';

export async function POST(request) {
  try {
    // const authorizationHeader = request.headers.get('authorization');
    // const token = authorizationHeader?.split(' ')[1];
    // const decodedToken = verifyToken(token);

    // // Remove 'colaborador' do array de papéis permitidos
    // if (!decodedToken || !['superadmin', 'admin'].includes(decodedToken.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }    

    const {
      cli_nome,
      cli_email,
      cli_telefone,
      cli_password,
    } = await request.json();

    if (!cli_nome || !cli_email || !cli_telefone || !cli_password) {
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
      cli_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newCliente),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    delete newCliente.cli_password;
    return NextResponse.json({ cliente: newCliente }, { status: 201 });
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
