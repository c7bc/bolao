// app/api/login/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validar entradas
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password.' }, { status: 400 });
    }

    const getParams = {
      TableName: 'Users',
      Key: marshall({ email }),
    };

    const getCommand = new GetItemCommand(getParams);
    const userResult = await dynamoDbClient.send(getCommand);
    const user = unmarshall(userResult.Item);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    // Comparar senhas
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    // Criar token JWT
    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Remover senha antes de enviar
    delete user.password;

    return NextResponse.json({ user, token }, { status: 200 });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
