// src/app/api/colaborador/jogos/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  DescribeTableCommand,
  CreateTableCommand,
  UpdateTableCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth'; // Ajuste o caminho conforme necessário

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
  console.error('ACCESS_KEY_ID ou SECRET_ACCESS_KEY não estão definidos.');
  throw new Error('Credenciais AWS não definidas.');
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não está definido.');
  throw new Error('JWT_SECRET não definido.');
}

// Configuração do cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Verifica se a tabela existe no DynamoDB.
 * @param {string} tableName - Nome da tabela a ser verificada.
 * @returns {boolean} - true se a tabela existir, false caso contrário.
 */
const checkTableExists = async (tableName) => {
  try {
    const describeTable = new DescribeTableCommand({ TableName: tableName });
    await dynamoDbClient.send(describeTable);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
};

/**
 * Verifica se o GSI existe na tabela.
 * @param {Array} gsis - Lista de GSIs da tabela.
 * @param {string} gsiName - Nome do GSI a ser verificado.
 * @returns {boolean} - true se o GSI existir, false caso contrário.
 */
const checkGSIExists = (gsis, gsiName) => {
  return gsis.some((index) => index.IndexName === gsiName);
};

/**
 * Cria o Índice Secundário Global (GSI).
 * @param {string} tableName - Nome da tabela.
 * @param {string} gsiName - Nome do GSI a ser criado.
 */
const createGSI = async (tableName, gsiName) => {
  const params = {
    TableName: tableName,
    AttributeDefinitions: [{ AttributeName: 'col_id', AttributeType: 'S' }],
    GlobalSecondaryIndexUpdates: [
      {
        Create: {
          IndexName: gsiName,
          KeySchema: [{ AttributeName: 'col_id', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      },
    ],
  };

  try {
    const updateCommand = new UpdateTableCommand(params);
    await dynamoDbClient.send(updateCommand);
    console.log(`GSI "${gsiName}" está sendo criado na tabela "${tableName}".`);
  } catch (error) {
    console.error(`Erro ao criar o GSI "${gsiName}":`, error);
    throw error;
  }
};

/**
 * Cria a tabela 'Jogos' com o GSI 'ColaboradorIndex' se não existir.
 * Configura o modo de faturamento para On-Demand (PAY_PER_REQUEST).
 * @param {string} tableName - Nome da tabela a ser criada.
 * @param {string} gsiName - Nome do GSI a ser criado.
 */
const createJogosTableIfNotExists = async (tableName, gsiName) => {
  const exists = await checkTableExists(tableName);

  if (exists) {
    console.log(`A tabela "${tableName}" já existe.`);
    // Verificar se o GSI existe
    try {
      const describeTable = new DescribeTableCommand({ TableName: tableName });
      const tableInfo = await dynamoDbClient.send(describeTable);
      const gsis = tableInfo.Table.GlobalSecondaryIndexes || [];
      const gsiExists = checkGSIExists(gsis, gsiName);

      if (gsiExists) {
        console.log(`O índice secundário global "${gsiName}" já existe na tabela "${tableName}".`);
      } else {
        console.log(`O índice secundário global "${gsiName}" NÃO existe na tabela "${tableName}".`);
        console.log(`Criando o índice secundário global "${gsiName}" na tabela "${tableName}"...`);
        await createGSI(tableName, gsiName);
      }
    } catch (error) {
      console.error(`Erro ao descrever a tabela "${tableName}":`, error);
      throw error;
    }
    return;
  }

  // Definir os parâmetros para criar a tabela com GSI e modo On-Demand
  const params = {
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'jog_id', AttributeType: 'S' }, // Chave primária
      { AttributeName: 'col_id', AttributeType: 'S' }, // Atributo para o GSI
    ],
    KeySchema: [{ AttributeName: 'jog_id', KeyType: 'HASH' }], // Chave primária
    BillingMode: 'PAY_PER_REQUEST', // Modo On-Demand
    GlobalSecondaryIndexes: [
      {
        IndexName: gsiName,
        KeySchema: [{ AttributeName: 'col_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  };

  try {
    const createTable = new CreateTableCommand(params);
    await dynamoDbClient.send(createTable);
    console.log(`Tabela "${tableName}" criada com sucesso com o GSI "${gsiName}".`);
  } catch (error) {
    console.error(`Erro ao criar a tabela "${tableName}":`, error);
    throw error;
  }
};

/**
 * Insere um novo jogo para um colaborador.
 * @param {string} col_id - ID do colaborador.
 * @param {object} jogoData - Dados do jogo a ser inserido.
 * @returns {object} - Resultado da operação de inserção.
 */
const insertJogo = async (col_id, jogoData) => {
  const tableName = 'Jogos';

  // Gerar um ID único para o jogo, por exemplo, usando timestamp e um número aleatório
  const jog_id = `jogo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const item = {
    jog_id,
    col_id,
    jog_status: jogoData.jog_status || 'upcoming', // 'open', 'upcoming' ou 'closed'
    jog_tipodojogo: jogoData.jog_tipodojogo || 'MEGA',
    jog_valorjogo: jogoData.jog_valorjogo || '10.00',
    jog_valorpremio: jogoData.jog_valorpremio || '1000.00',
    jog_quantidade_minima: jogoData.jog_quantidade_minima || '6',
    jog_quantidade_maxima: jogoData.jog_quantidade_maxima || '15',
    jog_numeros: jogoData.jog_numeros || '1,2,3,4,5,6',
    jog_nome: jogoData.jog_nome || 'Mega Sena',
    jog_data_inicio: jogoData.jog_data_inicio || '2024-01-01',
    jog_data_fim: jogoData.jog_data_fim || '2024-12-31',
    jog_pontos_necessarios: jogoData.jog_pontos_necessarios || '50',
    slug: jogoData.slug || 'mega-sena',
    visibleInConcursos: jogoData.visibleInConcursos !== undefined ? jogoData.visibleInConcursos : true,
    jog_datacriacao: new Date().toISOString(),
  };

  const params = {
    TableName: tableName,
    Item: marshall(item),
  };

  try {
    const command = new PutItemCommand(params);
    const response = await dynamoDbClient.send(command);
    console.log('Item inserido com sucesso:', response);
    return item;
  } catch (error) {
    console.error('Erro ao inserir item:', error);
    throw error;
  }
}

/**
 * Rota GET para buscar jogos do colaborador.
 */
export async function GET(request) {
  const tableName = 'Jogos';
  const gsiName = 'ColaboradorIndex';

  try {
    // Extrair o cabeçalho de autorização
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização não encontrado.' },
        { status: 401 }
      );
    }

    // Verificar e decodificar o token
    const decodedToken = verifyToken(token);
    console.log('Decoded Token:', decodedToken); // Log do token decodificado

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const col_id = decodedToken.col_id;
    console.log('col_id:', col_id); // Log do col_id

    if (!col_id) {
      return NextResponse.json(
        { error: 'ID do colaborador não fornecido.' },
        { status: 400 }
      );
    }

    // Verificar e criar a tabela e GSI se necessário
    await createJogosTableIfNotExists(tableName, gsiName);

    // Verificar se o GSI está ativo antes de consultar
    const describeTable = new DescribeTableCommand({ TableName: tableName });
    const tableInfo = await dynamoDbClient.send(describeTable);
    const gsis = tableInfo.Table.GlobalSecondaryIndexes || [];
    const gsi = gsis.find((index) => index.IndexName === gsiName);

    if (!gsi) {
      console.error(`GSI "${gsiName}" não encontrado após criação.`);
      return NextResponse.json(
        { error: 'Índice ColaboradorIndex não encontrado após criação.' },
        { status: 500 }
      );
    }

    if (gsi.IndexStatus !== 'ACTIVE') {
      console.log(`GSI "${gsiName}" ainda não está ativo.`);
      return NextResponse.json(
        { error: 'Índice ColaboradorIndex ainda não está ativo. Tente novamente mais tarde.' },
        { status: 202 }
      );
    }

    // Parâmetros para consultar jogos associados ao col_id usando o GSI ColaboradorIndex
    const params = {
      TableName: tableName,
      IndexName: gsiName,
      KeyConditionExpression: 'col_id = :col_id',
      ExpressionAttributeValues: {
        ':col_id': { S: col_id },
      },
    };

    console.log('Query Params:', params); // Log dos parâmetros da consulta

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);
    console.log('Query Result:', result); // Log do resultado da consulta

    const jogos = result.Items.map((item) => unmarshall(item));

    // Dividir jogos em ativos e finalizados
    const jogosAtivos = jogos.filter(
      (jogo) => jogo.jog_status === 'open' || jogo.jog_status === 'upcoming'
    );
    const jogosFinalizados = jogos.filter(
      (jogo) => jogo.jog_status === 'closed'
    );

    return NextResponse.json(
      { jogosAtivos, jogosFinalizados },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar jogos do colaborador:', error);

    // Tratamento específico para erros relacionados a índices
    if (error.name === 'ValidationException' && error.message.includes('ColaboradorIndex')) {
      return NextResponse.json(
        { error: 'Índice ColaboradorIndex não encontrado ou não configurado corretamente.' },
        { status: 500 }
      );
    }

    // Tratamento para credenciais inválidas
    if (error.name === 'UnrecognizedClientException') {
      return NextResponse.json(
        { error: 'Credenciais AWS inválidas. Verifique suas configurações.' },
        { status: 401 }
      );
    }

    // Tratamento para credenciais inválidas (resolvido)
    if (error.message && error.message.includes('credential')) {
      return NextResponse.json(
        { error: 'Credenciais AWS inválidas ou não configuradas corretamente.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

/**
 * Rota POST para inserir um novo jogo para o colaborador.
 */
export async function POST(request) {
  const tableName = 'Jogos';
  const gsiName = 'ColaboradorIndex';

  try {
    // Extrair o cabeçalho de autorização
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização não encontrado.' },
        { status: 401 }
      );
    }

    // Verificar e decodificar o token
    const decodedToken = verifyToken(token);
    console.log('Decoded Token:', decodedToken); // Log do token decodificado

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const col_id = decodedToken.col_id;
    console.log('col_id:', col_id); // Log do col_id

    if (!col_id) {
      return NextResponse.json(
        { error: 'ID do colaborador não fornecido.' },
        { status: 400 }
      );
    }

    // Extrair os dados do jogo do corpo da requisição
    const jogoData = await request.json();

    // Verificar se os dados necessários estão presentes
    if (!jogoData.jog_tipodojogo || !jogoData.jog_nome) {
      return NextResponse.json(
        { error: 'Dados do jogo incompletos.' },
        { status: 400 }
      );
    }

    // Verificar e criar a tabela e GSI se necessário
    await createJogosTableIfNotExists(tableName, gsiName);

    // Inserir o novo jogo
    const novoJogo = await insertJogo(col_id, jogoData);

    return NextResponse.json(
      { message: 'Jogo inserido com sucesso.', jogo: novoJogo },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao inserir jogo do colaborador:', error);

    // Tratamento específico para erros relacionados a índices
    if (error.name === 'ValidationException' && error.message.includes('ColaboradorIndex')) {
      return NextResponse.json(
        { error: 'Índice ColaboradorIndex não encontrado ou não configurado corretamente.' },
        { status: 500 }
      );
    }

    // Tratamento para credenciais inválidas
    if (error.name === 'UnrecognizedClientException') {
      return NextResponse.json(
        { error: 'Credenciais AWS inválidas. Verifique suas configurações.' },
        { status: 401 }
      );
    }

    // Tratamento para credenciais inválidas (resolvido)
    if (error.message && error.message.includes('credential')) {
      return NextResponse.json(
        { error: 'Credenciais AWS inválidas ou não configuradas corretamente.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}