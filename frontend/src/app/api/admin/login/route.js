// src/app/api/admin/login/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/auth'; // Assegure-se de que generateToken está corretamente configurado

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Consultar pelo índice EmailIndex
    const params = {
      TableName: 'Admin',
      IndexName: 'EmailIndex', // Nome do índice (assegure-se que está correto)
      KeyConditionExpression: 'adm_email = :email AND adm_role = :role',
      ExpressionAttributeValues: {
        ':email': { S: email },
        ':role': { S: 'admin' },
      },
    };

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    }

    const admin = AWS.DynamoDB.Converter.unmarshall(result.Items[0]);

    // Validar a senha
    const passwordMatch = await bcrypt.compare(password, admin.adm_password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    }

    // Gerar o token JWT usando generateToken com 'role'
    const token = generateToken({ adm_id: admin.adm_id, role: 'admin' });
    delete admin.adm_password;

    return NextResponse.json({ admin, token }, { status: 200 });
  } catch (error) {
    console.error('Error logging in admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
