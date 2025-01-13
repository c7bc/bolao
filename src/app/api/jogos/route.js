// Caminho: src\app\api\jogos\route.js (Linhas: 214, 215)
// src/app/api/jogos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../utils/auth';
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

  const command = new QueryCommand(queryParams);
  const result = await dynamoDbClient.send(command);
  return result.Count === 0;
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

export async function GET(request, { params }) {
  try {
    // Parâmetros para consultar o jogo pelo slug
    const { slug } = params;

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

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    // Verificar se tem token na requisição
    const authorizationHeader = request.headers.get('authorization');
    let isAuthenticated = false;

    if (authorizationHeader) {
      const token = authorizationHeader.split(' ')[1];
      try {
        const decodedToken = verifyToken(token);
        if (decodedToken) {
          isAuthenticated = true;
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
      }
    }

    // Adicionar informação de autenticação ao jogo
    const jogoComAuth = {
      ...jogo,
      isAuthenticated,
    };

    return NextResponse.json({ jogo: jogoComAuth }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler POST - Cria um novo jogo.
 */
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
    const {
      name,
      slug,
      visibleInConcursos,
      game_type_id,
      data_inicio,
      data_fim,
      valorBilhete,
      ativo,
      descricao,
      numeroInicial,
      numeroFinal,
      quantidadeNumeros,
      pontosPorAcerto,
      numeroPalpites,
      status,
    } = await request.json();

    // Validação de campos obrigatórios
    const requiredFields = [
      'name',
      'game_type_id',
      'data_inicio',
      'data_fim',
      'valorBilhete',
      'descricao',
      'numeroInicial',
      'numeroFinal',
      'quantidadeNumeros',
      'pontosPorAcerto',
      'numeroPalpites',
    ];

    for (const field of requiredFields) {
      if (!request.body[field]) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
      }
    }

    // Gerar slug único se não fornecido ou duplicado
    let finalSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true });
    if (!(await isSlugUnique(finalSlug))) {
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
      jog_status: status || 'aberto', // Status inicial
      jog_tipodojogo: game_type_id,
      jog_valorBilhete: parseFloat(valorBilhete),
      ativo: ativo !== undefined ? ativo : true,
      descricao: descricao,
      numeroInicial: numeroInicial,
      numeroFinal: numeroFinal,
      quantidadeNumeros: quantidadeNumeros,
      pontosPorAcerto: parseInt(pontosPorAcerto, 10),
      numeroPalpites: parseInt(numeroPalpites, 10),
      data_inicio: data_inicio,
      data_fim: data_fim,
      jog_datacriacao: new Date().toISOString(),
      jog_datamodificacao: new Date().toISOString(),
      // Adicionar campos adicionais do tipo de jogo
      ...gameType,
      creator_id: decodedToken.adm_id, // Removido col_id
      creator_role: decodedToken.role,
    };

    const params = {
      TableName: 'Jogos',
      Item: marshall(novoJogo, { removeUndefinedValues: true }), // Adicionado removeUndefinedValues
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

/**
 * Handler DELETE - Deleta um jogo pelo jog_id.
 */
export async function DELETE(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      !['admin', 'superadmin'].includes(decodedToken.role)
    ) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const { jog_id } = await request.json();

    if (!jog_id) {
      return NextResponse.json({ error: 'jog_id é obrigatório.' }, { status: 400 });
    }

    // Buscar jogo existente
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
      ProjectionExpression: 'creator_id, creator_role, jog_nome',
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const existingJog = unmarshall(getResult.Item);

    // Deletar o jogo
    const deleteParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    // Registrar atividade de deleção
    const atividade = {
      atividadeId: uuidv4(),
      text: `Jogo deletado: ${existingJog.jog_nome}`,
      tipo: 'jogo_deleted',
      descricao: `O jogo "${existingJog.jog_nome}" foi deletado.`,
      status: 'warning',
      timestamp: new Date().toISOString(),
      usuario: ['admin', 'superadmin'].includes(decodedToken.role)
        ? decodedToken.adm_email
        : null, // Removido referência a colaborador
    };

    const putActivityCommand = new PutItemCommand({
      TableName: 'Atividades',
      Item: marshall(atividade),
    });

    await dynamoDbClient.send(putActivityCommand);

    return NextResponse.json({ message: 'Jogo deletado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza um jogo pelo jog_id.
 */
export async function PUT(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Authorization header ausente.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar jogo pelo slug
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

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);
    const updateData = await request.json();

    // Criar expressão de atualização dinâmica
    let updateExpression = 'SET';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    const updateAttributes = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'jog_id' && key !== 'slug') {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        updateAttributes.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    });

    // Adicionar data de modificação
    updateAttributes.push('#datamod = :datamod');
    expressionAttributeNames['#datamod'] = 'jog_datamodificacao';
    expressionAttributeValues[':datamod'] = new Date().toISOString();

    if (updateAttributes.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    updateExpression += ' ' + updateAttributes.join(', ');

    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
