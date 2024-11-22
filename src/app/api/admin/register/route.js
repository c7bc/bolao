// app/api/admin/register/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

export async function POST(request) {
  try {
    const { adm_nome, adm_email, adm_password, requester_id } = await request.json();

    if (!adm_nome || !adm_email || !adm_password || !requester_id) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Verificar se o usuário que está solicitando é um superadministrador
    const getRequesterParams = {
      TableName: 'Admin',
      Key: marshall({ adm_id: requester_id }),
    };

    const requesterCommand = new GetItemCommand(getRequesterParams);
    const requesterData = await dynamoDbClient.send(requesterCommand);

    if (!requesterData.Item) {
      return NextResponse.json({ error: 'Requester not found.' }, { status: 404 });
    }

    const requester = unmarshall(requesterData.Item);

    if (requester.adm_role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Criar o novo administrador
    const hashedPassword = await bcrypt.hash(adm_password, 10);

    const adm_id = uuidv4();
    const newAdmin = {
      adm_id,
      adm_status: 'active',
      adm_nome,
      adm_email,
      adm_password: hashedPassword,
      adm_role: 'admin', // Define o papel como administrador
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
