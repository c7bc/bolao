import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { role, id } = await request.json();

    if (!role || !id) {
      return NextResponse.json({ error: 'Role and ID are required' }, { status: 400 });
    }

    let userParams;

    switch (role) {
      case 'cliente':
        userParams = {
          TableName: 'Cliente',
          Key: { cli_id: { S: id } },
        };
        break;
      case 'admin':
      case 'superadmin': // Superadmin também está na tabela Admin
        userParams = {
          TableName: 'Admin',
          Key: { adm_id: { S: id } },
        };
        break;
      case 'colaborador':
        userParams = {
          TableName: 'Colaborador',
          Key: { col_id: { S: id } },
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    const userCommand = new GetItemCommand(userParams);
    const userResult = await dynamoDbClient.send(userCommand);

    if (!userResult || !userResult.Item) {
      console.error(`Usuário com ID ${id} não encontrado`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawUser = unmarshall(userResult.Item);

    // Remover campos sensíveis
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
          additionalInfo: rawUser.additionalInfo,
        };
        break;
      case 'admin':
        mappedUser = {
          name: rawUser.adm_nome,
          email: rawUser.adm_email,
          phone: rawUser.adm_telefone,
          status: rawUser.adm_status,
          creationDate: rawUser.adm_datacriacao,
        };
        break;
      case 'superadmin':
        mappedUser = {
          name: rawUser.adm_nome,
          email: rawUser.adm_email,
        };
        break;
      case 'colaborador':
        mappedUser = {
          name: rawUser.col_nome,
          email: rawUser.col_email,
          phone: rawUser.col_telefone,
          status: rawUser.col_status,
          creationDate: rawUser.col_datacriacao,
          col_id: rawUser.col_id,
        };
        break;
      default:
        break;
    }

    return NextResponse.json({ user: mappedUser, role }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}