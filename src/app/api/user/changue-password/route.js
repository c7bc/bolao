// src/app/api/user/change-password/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function PUT(request) {
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

    const { role, cli_id, adm_id, col_id, email } = decodedToken;

    let userParams;
    let userKey;
    let passwordField;
    switch (role) {
      case 'cliente':
        userParams = {
          TableName: 'Cliente',
          Key: { cli_id: { S: cli_id } },
        };
        userKey = cli_id;
        passwordField = 'cli_password';
        break;
      case 'admin':
        userParams = {
          TableName: 'Admin',
          Key: { adm_id: { S: adm_id } },
        };
        userKey = adm_id;
        passwordField = 'adm_password';
        break;
      case 'colaborador':
        userParams = {
          TableName: 'Colaborador',
          Key: { col_id: { S: col_id } },
        };
        userKey = col_id;
        passwordField = 'col_password';
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    const userCommand = new GetItemCommand(userParams);
    const userResult = await dynamoDbClient.send(userCommand);

    if (!userResult || !userResult.Item) {
      console.error(`Usuário com ID ${userKey} não encontrado`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = unmarshall(userResult.Item);

    const { currentPassword, newPassword, code } = await request.json();

    if (!currentPassword || !newPassword || !code) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Verificar se a senha atual está correta
    const passwordMatch = await bcrypt.compare(currentPassword, user[passwordField]);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    // Verificar o código de confirmação
    const codeParams = {
      TableName: 'PasswordChangeCodes',
      Key: {
        userId: { S: userKey },
      },
    };

    const codeCommand = new GetItemCommand(codeParams);
    const codeResult = await dynamoDbClient.send(codeCommand);

    if (!codeResult || !codeResult.Item) {
      return NextResponse.json({ error: 'No confirmation code found. Please request a new code.' }, { status: 400 });
    }

    const codeData = unmarshall(codeResult.Item);
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > parseInt(codeData.expirationTime, 10)) {
      // Código expirado, deletar do banco
      const deleteParams = {
        TableName: 'PasswordChangeCodes',
        Key: {
          userId: { S: userKey },
        },
      };
      const deleteCommand = new DeleteItemCommand(deleteParams);
      await dynamoDbClient.send(deleteCommand);
      return NextResponse.json({ error: 'The confirmation code has expired. Please request a new code.' }, { status: 400 });
    }

    if (code !== codeData.code) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha no DynamoDB
    const updateParams = {
      TableName: userParams.TableName,
      Key: userParams.Key,
      UpdateExpression: `set ${passwordField} = :newPassword`,
      ExpressionAttributeValues: {
        ':newPassword': { S: hashedNewPassword },
      },
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    await dynamoDbClient.send(updateCommand);

    // Deletar o código após uso
    const deleteParams = {
      TableName: 'PasswordChangeCodes',
      Key: {
        userId: { S: userKey },
      },
    };
    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}