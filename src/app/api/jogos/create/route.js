// src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../../utils/auth';
import slugify from 'slugify';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const isSlugUnique = async (slug) => {
  const queryParams = {
    TableName: 'Jogos',
    IndexName: 'slug-index',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: marshall({
      ':slug': slug,
    }),
  };

  const queryCommand = new QueryCommand(queryParams);
  const queryResult = await dynamoDbClient.send(queryCommand);
  return queryResult.Count === 0;
};

const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (!(await isSlugUnique(uniqueSlug))) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return uniqueSlug;
};

export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const { name, slug, visibleInConcursos, game_type_id, data_fim } = await request.json();

    // Validação de campos obrigatórios
    if (!name || !game_type_id || !data_fim) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    // Gerar slug único se não fornecido ou duplicado
    let finalSlug = slug;
    if (slug) {
      const slugIsUnique = await isSlugUnique(slug);
      if (!slugIsUnique) {
        // Gerar um slug único baseado no nome
        finalSlug = await generateUniqueSlug(name);
      }
    } else {
      finalSlug = await generateUniqueSlug(name);
    }

    // Verificar se o game_type_id existe
    const checkGameTypeParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: game_type_id }),
    };

    const checkGameTypeCommand = new GetItemCommand(checkGameTypeParams);
    const gameTypeResult = await dynamoDbClient.send(checkGameTypeCommand);

    if (!gameTypeResult.Item) {
      return NextResponse.json({ error: 'Tipo de jogo não encontrado.' }, { status: 404 });
    }

    const gameType = unmarshall(gameTypeResult.Item);

    // Gerar ID único para o jogo
    const jog_id = uuidv4();

    // Preparar dados para o DynamoDB
    const novoJogo = {
      jog_id,
      slug: finalSlug,
      visibleInConcursos: visibleInConcursos !== undefined ? visibleInConcursos : true,
      jog_status: 'aberto', // Status inicial
      jog_tipodojogo: game_type_id,
      jog_valorjogo: gameType.jog_valorjogo || null,
      jog_valorpremio: gameType.jog_valorpremio || null,
      jog_quantidade_minima: gameType.jog_quantidade_minima,
      jog_quantidade_maxima: gameType.jog_quantidade_maxima,
      jog_numeros: gameType.jog_numeros || null,
      jog_nome: name,
      jog_data_inicio: new Date().toISOString(),
      jog_data_fim: data_fim,
      jog_pontos_necessarios: gameType.jog_pontos_necessarios || null,
      jog_datacriacao: new Date().toISOString(),
      jog_datamodificacao: new Date().toISOString(),
      // Adicionar campos adicionais do tipo de jogo
      ...gameType,
      creator_id:
        decodedToken.role === 'admin' || decodedToken.role === 'superadmin'
          ? decodedToken.adm_id
          : decodedToken.col_id, // Supondo que col_id está disponível no token
      creator_role: decodedToken.role,
    };

    const params = {
      TableName: 'Jogos',
      Item: marshall(novoJogo),
      ConditionExpression: 'attribute_not_exists(jog_id)', // Garante que o ID seja único
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ jogo: novoJogo }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar jogo:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'ID do jogo já existe.' }, { status: 400 });
    }

    if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
