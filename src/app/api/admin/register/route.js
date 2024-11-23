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
  console.log('Incoming request to /api/admin/register');

  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { adm_nome, adm_email, adm_password, requester_id } = body;

    if (!adm_nome || !adm_email || !adm_password || !requester_id) {
      console.error('Validation error: Missing required fields.', { body });
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    console.log('Requester ID:', requester_id);

    // Verificar se o usuário que está solicitando é um superadministrador
    const getRequesterParams = {
      TableName: 'Admin',
      Key: marshall({ adm_id: requester_id }),
    };

    console.log('Fetching requester details with params:', getRequesterParams);

    const requesterCommand = new GetItemCommand(getRequesterParams);
    const requesterData = await dynamoDbClient.send(requesterCommand);

    if (!requesterData.Item) {
      console.error('Requester not found in the database.', { requester_id });
      return NextResponse.json({ error: 'Requester not found.' }, { status: 404 });
    }

    const requester = unmarshall(requesterData.Item);
    console.log('Requester data:', requester);

    if (requester.adm_role !== 'superadmin') {
      console.error('Unauthorized: Requester is not a superadmin.', { requester_id });
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Criar o novo administrador
    const hashedPassword = await bcrypt.hash(adm_password, 10);
    console.log('Password hashed successfully.');

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

    console.log('New admin data prepared:', newAdmin);

    const params = {
      TableName: 'Admin',
      Item: marshall(newAdmin),
    };

    console.log('Inserting new admin into DynamoDB with params:', params);

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    console.log('New admin successfully inserted into DynamoDB.');

    // Não retornar a senha
    delete newAdmin.adm_password;

    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error('Error registering admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
