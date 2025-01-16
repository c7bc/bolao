import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const clienteTable = 'Cliente';
const apostasTable = 'Apostas';
const historicoClienteTable = 'HistoricoCliente';
const jogosTable = 'Jogos';

/**
 * Handler POST - Registra uma nova aposta.
 */
export async function POST(request) {
  try {
    console.log('Recebendo requisição para registrar uma aposta.');

    const authorizationHeader = request.headers.get('authorization');
    let token = authorizationHeader?.split(' ')[1];
    let decodedToken = null;

    if (!token) {
      console.warn('Token de autorização ausente.');
      return NextResponse.json({ error: 'Forbidden: Token ausente.' }, { status: 403 });
    }

    try {
      decodedToken = verifyToken(token);
      if (!decodedToken) {
        console.warn('Token inválido.');
        return NextResponse.json({ error: 'Forbidden: Token inválido.' }, { status: 403 });
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json({ error: 'Forbidden: Erro na verificação do token.' }, { status: 403 });
    }

    const requestData = await request.json();
    console.log('Dados da requisição obtidos:', requestData);

    const {
      jogo_id,
      palpite_numbers,
      valor_total,
      metodo_pagamento,
      name,
      whatsapp,
      email,
    } = requestData;

    const requiredFields = ['jogo_id', 'palpite_numbers', 'valor_total', 'metodo_pagamento', 'name', 'whatsapp', 'email'];
    const missingFields = requiredFields.filter(field => {
      const value = requestData[field];
      return value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      console.warn(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}.` }, { status: 400 });
    }

    if (!Array.isArray(palpite_numbers) || palpite_numbers.length === 0) {
      console.warn('palpite_numbers não é um array não vazio.');
      return NextResponse.json({ error: 'palpite_numbers deve ser um array não vazio.' }, { status: 400 });
    }

    let cliente;

    console.log(`Buscando cliente com email: ${email}`);
    const clienteQueryParams = {
      TableName: clienteTable,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: marshall({
        ':email': email,
      }),
    };

    const clienteQueryCommand = new QueryCommand(clienteQueryParams);
    const clienteQueryResult = await dynamoDbClient.send(clienteQueryCommand);

    if (clienteQueryResult.Items.length > 0) {
      cliente = unmarshall(clienteQueryResult.Items[0]);
      console.log('Cliente encontrado:', cliente);
    } else {
      const cli_id = uuidv4();
      cliente = {
        cli_id,
        nome: name,
        email,
        whatsapp,
        status: 'active',
        data_criacao: new Date().toISOString(),
      };

      console.log('Criando novo cliente:', cliente);
      const clientePutParams = {
        TableName: clienteTable,
        Item: marshall(cliente),
      };

      const clientePutCommand = new PutItemCommand(clientePutParams);
      await dynamoDbClient.send(clientePutCommand);
      console.log('Novo cliente criado com sucesso.');
    }

    const aposta_id = uuidv4();
    const novaAposta = {
      aposta_id,
      cli_id: cliente.cli_id,
      jog_id,
      palpite_numbers: palpite_numbers.join(','),
      valor_total: parseFloat(valor_total),
      metodo_pagamento,
      status: 'pendente',
      data_criacao: new Date().toISOString(),
    };

    console.log('Criando nova aposta:', novaAposta);
    const apostaPutParams = {
      TableName: apostasTable,
      Item: marshall(novaAposta),
    };

    const apostaPutCommand = new PutItemCommand(apostaPutParams);
    await dynamoDbClient.send(apostaPutCommand);
    console.log('Aposta criada com sucesso.');

    console.log('Retornando resposta de sucesso ao cliente.');
    return NextResponse.json({
      message: 'Aposta registrada com sucesso.',
    }, { status: 201 });

  } catch (error) {
    console.error('Erro criando aposta:', error);
    return NextResponse.json({ error: 'Internal Server Error.', details: error.message }, { status: 500 });
  }
}

/**
 * Handler GET - Lista todas as apostas para um jogo específico.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jogo_id = searchParams.get('jogo_id');

    if (!jogo_id) {
      return NextResponse.json({ error: 'jogo_id é obrigatório.' }, { status: 400 });
    }

    // **Removido Requisito de Autenticação para GET Apostas**
    /*
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Cabeçalho de autorização ausente.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

    // Buscar apostas pelo jogo_id
    const queryParams = {
      TableName: apostasTable,
      IndexName: 'jog_id-index',
      KeyConditionExpression: 'jog_id = :jog_id',
      ExpressionAttributeValues: marshall({
        ':jog_id': jogo_id,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    const apostas = (queryResult.Items || []).map(item => unmarshall(item));

    return NextResponse.json({ apostas }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar apostas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
