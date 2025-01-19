// src/app/api/user/change-password/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../utils/auth';

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

    const { role, cli_id, adm_id, col_id } = decodedToken;

    let userParams;
    let userId;
    let tableName;

    switch (role) {
      case 'cliente':
        userParams = {
          TableName: 'Cliente',
          Key: { cli_id: { S: cli_id } },
        };
        userId = cli_id;
        tableName = 'Cliente';
        break;
      case 'admin':
        userParams = {
          TableName: 'Admin',
          Key: { adm_id: { S: adm_id } },
        };
        userId = adm_id;
        tableName = 'Admin';
        break;
      case 'colaborador':
        userParams = {
          TableName: 'Colaborador',
          Key: { col_id: { S: col_id } },
        };
        userId = col_id;
        tableName = 'Colaborador';
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    const userCommand = new GetItemCommand(userParams);
    const userResult = await dynamoDbClient.send(userCommand);

    if (!userResult || !userResult.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = unmarshall(userResult.Item);

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verifica a senha atual com base no papel do usuário
    let passwordField;
    switch (role) {
      case 'cliente':
        passwordField = user.cli_password;
        break;
      case 'admin':
        passwordField = user.adm_password;
        break;
      case 'colaborador':
        passwordField = user.col_password;
        break;
    }

    const passwordMatch = await bcrypt.compare(currentPassword, passwordField);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha com base no papel do usuário
    let updateExpression;
    let expressionAttributeValues;
    switch (role) {
      case 'cliente':
        updateExpression = 'SET cli_password = :newPassword';
        expressionAttributeValues = {
          ':newPassword': { S: hashedNewPassword }
        };
        break;
      case 'admin':
        updateExpression = 'SET adm_password = :newPassword';
        expressionAttributeValues = {
          ':newPassword': { S: hashedNewPassword }
        };
        break;
      case 'colaborador':
        updateExpression = 'SET col_password = :newPassword';
        expressionAttributeValues = {
          ':newPassword': { S: hashedNewPassword }
        };
        break;
    }

    const updateParams = {
      TableName: tableName,
      Key: userParams.Key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    await dynamoDbClient.send(updateCommand);

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}