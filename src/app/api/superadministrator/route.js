// app/api/admin/superadmin/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
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
    const { super_nome, super_email, super_password } = await request.json();

    if (!super_nome || !super_email || !super_password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(super_password, 10);

    const super_id = uuidv4();
    const superAdmin = {
      adm_id: super_id,
      adm_status: 'active',
      adm_nome: super_nome,
      adm_email: super_email,
      adm_password: hashedPassword,
      adm_role: 'superadmin', // Define o papel como superadministrador
      adm_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: 'Admin',
      Item: marshall(superAdmin),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Não retornar a senha
    delete superAdmin.adm_password;
    return NextResponse.json({ superadmin: superAdmin }, { status: 201 });
  } catch (error) {
    console.error('Error creating superadmin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
