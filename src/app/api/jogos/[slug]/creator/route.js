// src/app/api/jogos/[slug]/creator/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth'; // Ajuste o caminho conforme necessário

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Busca informações do criador do jogo pelo slug.
 */
export async function GET(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parâmetros para consultar o jogo pelo slug
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index', // Certifique-se de que este índice existe
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const jogoCommand = new QueryCommand(queryParams);
    const jogoResponse = await dynamoDbClient.send(jogoCommand);

    if (!jogoResponse.Items || jogoResponse.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(jogoResponse.Items[0]);

    // Verificar se o jogo possui creator_id e creator_role
    const { creator_id, creator_role } = jogo;

    if (!creator_id || !creator_role) {
      return NextResponse.json(
        { error: 'Informações do criador não estão completas no jogo.' },
        { status: 400 }
      );
    }

    // Determinar a tabela com base no creator_role
    let creatorTable = '';
    switch (creator_role) {
      case 'cliente':
        creatorTable = 'Cliente';
        break;
      case 'admin':
      case 'superadmin':
        creatorTable = 'Admin';
        break;
      case 'colaborador':
        creatorTable = 'Colaborador';
        break;
      default:
        return NextResponse.json({ error: 'Role do criador desconhecida.' }, { status: 400 });
    }

    // Determinar a chave primária com base na tabela
    let keyName = '';
    switch (creatorTable) {
      case 'Cliente':
        keyName = 'cli_id';
        break;
      case 'Admin':
        keyName = 'adm_id';
        break;
      case 'Colaborador':
        keyName = 'col_id';
        break;
      default:
        keyName = '';
    }

    if (!keyName) {
      return NextResponse.json({ error: 'Chave primária do criador desconhecida.' }, { status: 400 });
    }

    // Buscar informações do criador
    const creatorParams = {
      TableName: creatorTable,
      Key: marshall({ [keyName]: creator_id }),
    };

    const creatorCommand = new GetItemCommand(creatorParams);
    const creatorResponse = await dynamoDbClient.send(creatorCommand);

    if (!creatorResponse.Item) {
      return NextResponse.json({ error: 'Criador não encontrado.' }, { status: 404 });
    }

    const creator = unmarshall(creatorResponse.Item);

    // Remover campos sensíveis
    if (creatorTable === 'Cliente') delete creator.cli_password;
    if (creatorTable === 'Admin') delete creator.adm_password;
    if (creatorTable === 'Colaborador') delete creator.col_password;

    return NextResponse.json({ creator }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar criador do jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
