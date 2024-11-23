// src/app/api/admin/delete/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, DeleteItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
    region: 'sa-east-1',
    credentials: {
      accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
      secretAccessKey: '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',
    },
  });

export async function DELETE(request) {
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
    const { adm_id } = await request.json();

    if (!adm_id) {
      return NextResponse.json({ error: 'adm_id is required to delete an admin.' }, { status: 400 });
    }

    // 3. Verificar se o admin a ser deletado existe
    const getParams = {
      TableName: 'Admin',
      Key: marshall({ adm_id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const adminResult = await dynamoDbClient.send(getCommand);

    if (!adminResult.Item) {
      return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
    }

    const adminToDelete = unmarshall(adminResult.Item);

    // Opcional: Prevenir que o superadmin delete a si mesmo
    if (adminToDelete.adm_id === decodedToken.adm_id) {
      return NextResponse.json({ error: 'You cannot delete yourself.' }, { status: 400 });
    }

    // 4. Deletar o administrador
    const deleteParams = {
      TableName: 'Admin',
      Key: marshall({ adm_id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    return NextResponse.json({ message: 'Admin deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
