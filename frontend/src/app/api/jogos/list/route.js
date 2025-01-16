// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

// Configuração do cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Lista os jogos com filtros opcionais.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameTypeId = searchParams.get('game_type_id'); // Filtro por jog_tipodojogo
    const nome = searchParams.get('nome'); // Filtro por nome
    const slug = searchParams.get('slug'); // Filtro por slug (jogo's own slug)
    const dataFim = searchParams.get('data_fim'); // Novo filtro por data_fim

    // Se 'slug' está presente, usar QueryCommand com GSI 'slug-index'
    if (slug) {
      const queryParams = {
        TableName: 'Jogos',
        IndexName: 'slug-index', // GSI correto
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: marshall({
          ':slug': slug,
        }),
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResult = await dynamoDbClient.send(queryCommand);

      const jogos = (queryResult.Items || []).map(item => unmarshall(item));

      return NextResponse.json({ jogos }, { status: 200 });
    }

    // Se 'game_type_id' está presente, usar QueryCommand com GSI 'jog_tipodojogo-index'
    if (gameTypeId) {
      const queryParams = {
        TableName: 'Jogos',
        IndexName: 'jog_tipodojogo-index', // GSI correto
        KeyConditionExpression: 'jog_tipodojogo = :game_type_id',
        ExpressionAttributeValues: marshall({
          ':game_type_id': gameTypeId,
        }),
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResult = await dynamoDbClient.send(queryCommand);

      const jogos = (queryResult.Items || []).map(item => unmarshall(item));

      return NextResponse.json({ jogos }, { status: 200 });
    }

    // Preparar filtros para o scan
    let FilterExpression = '';
    let ExpressionAttributeValues = {};
    let ExpressionAttributeNames = {};

    if (nome) {
      // Supondo que o atributo é 'jog_nome'
      FilterExpression += 'contains(#jog_nome, :nome)';
      ExpressionAttributeValues[':nome'] = nome;
      ExpressionAttributeNames['#jog_nome'] = 'jog_nome';
    }

    if (dataFim) {
      // Adicionar filtro para jog_data_fim
      FilterExpression += FilterExpression ? ' AND ' : '';
      FilterExpression += 'jog_data_fim <= :data_fim';
      // Converter dataFim para ISO string
      const dataFimISO = new Date(dataFim).toISOString();
      ExpressionAttributeValues[':data_fim'] = dataFimISO;
      ExpressionAttributeNames['#jog_data_fim'] = 'jog_data_fim';
    }

    if (searchParams.get('visibleInConcursos') !== null) {
      const visibleInConcursos = searchParams.get('visibleInConcursos') === 'true';
      FilterExpression += FilterExpression ? ' AND ' : '';
      FilterExpression += '#visibleInConcursos = :visibleInConcursos';
      ExpressionAttributeValues[':visibleInConcursos'] = visibleInConcursos;
      ExpressionAttributeNames['#visibleInConcursos'] = 'visibleInConcursos';
    }

    const scanParams = {
      TableName: 'Jogos',
      FilterExpression: FilterExpression || undefined,
      ExpressionAttributeValues:
        Object.keys(ExpressionAttributeValues).length > 0
          ? marshall(ExpressionAttributeValues)
          : undefined,
      ExpressionAttributeNames:
        Object.keys(ExpressionAttributeNames).length > 0
          ? ExpressionAttributeNames
          : undefined,
      Limit: 100, // Limite para evitar scans muito grandes
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    const jogos = (scanResult.Items || []).map(item => unmarshall(item));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar jogos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
