// src/app/api/admin/update/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import bcrypt from 'bcryptjs';

// Inicialize o cliente DynamoDB com variáveis de ambiente
const dynamoDbClient = new DynamoDBClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    },
  });

export async function PUT(request) {
  try {
    // 1. Autenticação: Verificar o token JWT
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Authorization header missing.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Token missing.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    const { role } = decodedToken;
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    // 2. Obter dados da solicitação
    const { adm_id, adm_nome, adm_email, adm_status, adm_role, adm_password } = await request.json();

    if (!adm_id) {
      return NextResponse.json({ error: 'adm_id is required to update an admin.' }, { status: 400 });
    }

    // 3. Verificar se o admin a ser atualizado existe
    const getParams = {
      TableName: 'Admin',
      Key: marshall({ adm_id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const adminResult = await dynamoDbClient.send(getCommand);

    if (!adminResult.Item) {
      return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
    }

    const existingAdmin = unmarshall(adminResult.Item);

    // 4. Preparar os atributos para atualização
    const UpdateExpressions = [];
    const ExpressionAttributeValues = {};

    if (adm_nome) {
      UpdateExpressions.push('adm_nome = :adm_nome');
      ExpressionAttributeValues[':adm_nome'] = { S: adm_nome };
    }

    if (adm_email) {
      UpdateExpressions.push('adm_email = :adm_email');
      ExpressionAttributeValues[':adm_email'] = { S: adm_email };
    }

    if (adm_status) {
      UpdateExpressions.push('adm_status = :adm_status');
      ExpressionAttributeValues[':adm_status'] = { S: adm_status };
    }

    if (adm_role) {
      UpdateExpressions.push('adm_role = :adm_role');
      ExpressionAttributeValues[':adm_role'] = { S: adm_role };
    }

    if (adm_password) {
      const hashedPassword = await bcrypt.hash(adm_password, 10);
      UpdateExpressions.push('adm_password = :adm_password');
      ExpressionAttributeValues[':adm_password'] = { S: hashedPassword };
    }

    if (UpdateExpressions.length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    const updateParams = {
      TableName: 'Admin',
      Key: marshall({ adm_id }),
      UpdateExpression: 'SET ' + UpdateExpressions.join(', '),
      ExpressionAttributeValues: ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const updatedAdmin = unmarshall(updateResult.Attributes);

    // Remover senha antes de retornar
    delete updatedAdmin.adm_password;

    return NextResponse.json({ admin: updatedAdmin }, { status: 200 });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
