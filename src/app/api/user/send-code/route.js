// src/app/api/user/send-code/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import crypto from 'crypto';
import { verifyToken } from '../../../utils/auth';
import sendEmail from '../../../utils/send-email';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { role, cli_id, adm_id, col_id } = decodedToken;

    let userParams;
    let userId;

    // Definir parâmetros de busca baseado no role
    switch (role) {
      case 'cliente':
        userParams = {
          TableName: 'Cliente',
          Key: { cli_id: { S: cli_id } },
        };
        userId = cli_id;
        break;
      case 'admin':
        userParams = {
          TableName: 'Admin',
          Key: { adm_id: { S: adm_id } },
        };
        userId = adm_id;
        break;
      case 'colaborador':
        userParams = {
          TableName: 'Colaborador',
          Key: { col_id: { S: col_id } },
        };
        userId = col_id;
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    // Buscar usuário no DynamoDB para obter o email
    const userCommand = new GetItemCommand(userParams);
    const userResult = await dynamoDbClient.send(userCommand);

    if (!userResult || !userResult.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = unmarshall(userResult.Item);
    let email;

    // Extrair email baseado no role
    switch (role) {
      case 'cliente':
        email = user.cli_email;
        break;
      case 'admin':
        email = user.adm_email;
        break;
      case 'colaborador':
        email = user.col_email;
        break;
    }

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 400 });
    }

    // Gerar um código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();

    // Definir o tempo de expiração (10 minutos)
    const expirationTime = Math.floor(Date.now() / 1000) + 600;

    // Armazenar o código no DynamoDB
    const params = {
      TableName: 'PasswordChangeCodes',
      Item: {
        userId: { S: userId },
        code: { S: code },
        expirationTime: { N: expirationTime.toString() },
      },
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Enviar o código por e-mail
    await sendEmail({
      to: email,
      subject: 'Código de Confirmação para Alteração de Senha',
      text: `Seu código de confirmação para alterar a senha é: ${code}`,
      html: `<p>Seu código de confirmação para alterar a senha é: <b>${code}</b></p>`,
    });

    return NextResponse.json({ message: 'Código enviado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error sending code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}