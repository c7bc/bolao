// app/api/admin/register/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});


export async function POST(request) {
  try {
    const { adm_nome, adm_email, adm_password } = await request.json();

    if (!adm_nome || !adm_email || !adm_password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(adm_password, 10);

    const adm_id = uuidv4();
    const newAdmin = {
      adm_id,
      adm_status: 'active',
      adm_nome,
      adm_email,
      adm_password: hashedPassword,
      adm_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: 'Admin',
      Item: marshall(newAdmin),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Não retornar a senha
    delete newAdmin.adm_password;
    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error('Error registering admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
