// app/api/create-account/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});


export async function POST(request) {
  try {
    const {
      name,
      phone,
      city,
      email,
      password,
      referralCode,
      termsAccepted,
      role,
    } = await request.json();

    // Validação básica
    if (
      !name ||
      !phone ||
      !city ||
      !email ||
      !password ||
      !termsAccepted
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se o usuário já existe
    const getParams = {
      TableName: 'Users',
      Key: marshall({ email }),
    };

    const getCommand = new GetItemCommand(getParams);
    const existingUserResult = await dynamoDbClient.send(getCommand);

    if (existingUserResult.Item) {
      return NextResponse.json({ error: 'User already exists with this email.' }, { status: 400 });
    }

    const newUser = {
      email,
      name,
      phone,
      city,
      password: hashedPassword,
      referralCode: referralCode || null,
      termsAccepted,
      role: role || 'cliente', // Papel padrão é 'cliente'
      createdAt: new Date().toISOString(),
    };

    const putParams = {
      TableName: 'Users',
      Item: marshall(newUser),
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    // Remover senha antes de enviar
    delete newUser.password;

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
