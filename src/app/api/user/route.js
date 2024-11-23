// src/app/api/user/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});
export async function GET(request) {
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

    const { cli_id, adm_id, col_id, role } = decodedToken;

    let userParams;
    let userId;

    switch (role) {
      case 'cliente':
        userParams = {
          TableName: 'Cliente',
          Key: { cli_id: { S: cli_id } },
        };
        userId = cli_id;
        break;
      case 'admin':
      case 'superadmin': // Superadmin também está na tabela Admin
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

    const userCommand = new GetItemCommand(userParams);
    const userResult = await dynamoDbClient.send(userCommand);

    if (!userResult || !userResult.Item) {
      console.error(`Usuário com ID ${userId} não encontrado`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawUser = unmarshall(userResult.Item);

    // Remover campos sensíveis, como senhas
    if (role === 'cliente') delete rawUser.cli_password;
    if (role === 'admin' || role === 'superadmin') delete rawUser.adm_password;
    if (role === 'colaborador') delete rawUser.col_password;

    // Mapear campos para nomes consistentes
    let mappedUser = {};

    switch (role) {
      case 'cliente':
        mappedUser = {
          name: rawUser.cli_nome,
          email: rawUser.cli_email,
          phone: rawUser.cli_telefone,
          status: rawUser.cli_status,
          creationDate: rawUser.cli_datacriacao,
          // Adicione outros campos específicos de cliente, se necessário
          additionalInfo: rawUser.additionalInfo, // Mantendo campos adicionais
        };
        break;
      case 'admin':
        mappedUser = {
          name: rawUser.adm_nome,
          email: rawUser.adm_email,
          phone: rawUser.adm_telefone,
          status: rawUser.adm_status,
          creationDate: rawUser.adm_datacriacao,
          // Adicione outros campos específicos de admin, se necessário
        };
        break;
      case 'superadmin':
        mappedUser = {
          name: rawUser.adm_nome, // Assumindo que superadmin usa adm_nome
          email: rawUser.adm_email,
          // Superadmin não possui telefone, status ou data de criação
        };
        break;
      case 'colaborador':
        mappedUser = {
          name: rawUser.col_nome,
          email: rawUser.col_email,
          phone: rawUser.col_telefone,
          status: rawUser.col_status,
          creationDate: rawUser.col_datacriacao,
          // Adicione outros campos específicos de colaborador, se necessário
        };
        break;
      default:
        // Já tratado acima
        break;
    }

    return NextResponse.json({ user: mappedUser, role }, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
