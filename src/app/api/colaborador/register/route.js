// app/api/colaborador/register/route.js

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


export async function POST(request) {
  try {
    // Apenas administradores podem criar colaboradores
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      col_nome,
      col_documento,
      col_email,
      col_telefone,
      col_rua,
      col_numero,
      col_bairro,
      col_cidade,
      col_estado,
      col_cep,
      col_password,
    } = await request.json();

    if (
      !col_nome ||
      !col_documento ||
      !col_email ||
      !col_telefone ||
      !col_password
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(col_password, 10);
    const col_id = uuidv4();

    const newColaborador = {
      col_id,
      col_status: 'active',
      col_nome,
      col_documento,
      col_email,
      col_telefone,
      col_rua: col_rua || '',
      col_numero: col_numero || '',
      col_bairro: col_bairro || '',
      col_cidade: col_cidade || '',
      col_estado: col_estado || '',
      col_cep: col_cep || '',
      col_password: hashedPassword,
      col_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: 'Colaborador',
      Item: marshall(newColaborador),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    delete newColaborador.col_password;
    return NextResponse.json({ colaborador: newColaborador }, { status: 201 });
  } catch (error) {
    console.error('Error registering colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
