// frontend\src\app\api\superadmin\manual-bet\route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, PutItemCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Centralized validation function with detailed logging
function validateInput(body) {
  const validations = {
    clientIdValido: !!body.clientId,
    clientIdTipo: typeof body.clientId,
    slugValido: !!body.gameId,
    slugTipo: typeof body.gameId,
    numbersEhArray: Array.isArray(body.numbers),
    numbersTemTamanho: body.numbers.length,
    numbersPrimeiroElemento: body.numbers[0],
    numbersPrimeiroElementoTipo: typeof body.numbers[0],
    numbersPrimeiroElementoTamanho: body.numbers[0]?.length
  };

  const errors = [];

  if (!validations.clientIdValido || validations.clientIdTipo !== 'string') {
    errors.push('Client ID is required and must be a string.');
  }
  if (!validations.slugValido || validations.slugTipo !== 'string') {
    errors.push('Game ID (slug) is required and must be a string.');
  }
  if (!validations.numbersEhArray || validations.numbersTemTamanho === 0) {
    errors.push('Numbers must be a non-empty array.');
  }
  if (validations.numbersEhArray && validations.numbersTemTamanho > 0) {
    if (typeof validations.numbersPrimeiroElemento !== 'object' || !Array.isArray(validations.numbersPrimeiroElemento)) {
      errors.push('Each number set in numbers must be an array.');
    }
    if (validations.numbersPrimeiroElementoTamanho === 0) {
      errors.push('Each number set must contain numbers.');
    }
  }

  console.log('Validation Details:', validations);
  
  // Log each error individually for clarity
  errors.forEach(error => console.error('Validation Error:', error));

  return { valid: errors.length === 0, errors };
}

export async function POST(request) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, gameId: slug, numbers } = body;

    // Centralized validation
    const validationResult = validateInput(body);
    if (!validationResult.valid) {
      console.log('Validation failed with errors:', validationResult.errors.join(', '));
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.errors.join(', ')
      }, { status: 400 });
    }

    // Fetch game information using slug
    const gameResult = await dynamoDbClient.send(new QueryCommand({
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({ ':slug': slug }),
    }));

    if (!gameResult.Items || gameResult.Items.length === 0) {
      console.log('Game not found for slug:', slug);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = unmarshall(gameResult.Items[0]);

    // Verify if the game is open
    if (game.jog_status !== 'aberto') {
      console.log('Game status:', game.jog_status, 'is not open for bets');
      return NextResponse.json({ 
        error: 'Game is not open for bets',
        details: 'The game status must be "aberto" to allow bets.'
      }, { status: 400 });
    }

    // Validate numbers
    if (!validateNumbers(game, numbers)) {
      console.log('Numbers validation failed. Game rules:', JSON.stringify(game, null, 2));
      return NextResponse.json({ 
        error: 'Invalid numbers for this game',
        details: 'Numbers must match game rules regarding quantity, range, and uniqueness.'
      }, { status: 400 });
    }

    // Fetch client information
    const clientResult = await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Cliente',
      Key: marshall({ cli_id: clientId })
    }));

    if (!clientResult.Item) {
      console.log('Client not found with ID:', clientId);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = unmarshall(clientResult.Item);

    // Verify if the client is active
    if (client.cli_status !== 'active') {
      console.log('Client status:', client.cli_status, 'is not active');
      return NextResponse.json({ 
        error: 'Client is not active',
        details: 'Only active clients can place bets.'
      }, { status: 400 });
    }

    // Create manual payment
    const pagamentoId = uuidv4();
    const pagamento = {
      pagamentoId,
      cli_id: clientId,
      jog_id: game.jog_id,
      valor_total: numbers.length * game.jog_valorBilhete,
      status: 'confirmado',
      metodo_pagamento: 'manual_superadmin',
      bilhetes: numbers.map(numberSet => ({
        palpite_numbers: numberSet,
        status: 'confirmado',
        data_criacao: new Date().toISOString()
      })),
      data_criacao: new Date().toISOString(),
      ultima_atualizacao: new Date().toISOString(),
      registrado_por: decoded.adm_id
    };

    // Save payment
    await dynamoDbClient.send(new PutItemCommand({
      TableName: 'Pagamentos',
      Item: marshall(pagamento)
    }));

    // Register bets
    const apostasPromises = numbers.map(async (numberSet) => {
      const apostaData = {
        aposta_id: uuidv4(),
        cli_id: clientId,
        jog_id: game.jog_id,
        palpite_numbers: numberSet,
        valor: game.jog_valorBilhete,
        pagamentoId,
        status: 'confirmada',
        metodo_pagamento: 'manual_superadmin',
        registrado_por: decoded.adm_id,
        data_criacao: new Date().toISOString(),
        ultima_atualizacao: new Date().toISOString()
      };

      return dynamoDbClient.send(new PutItemCommand({
        TableName: 'Apostas',
        Item: marshall(apostaData)
      }));
    });

    await Promise.all(apostasPromises);

    // Update game counters
    await dynamoDbClient.send(new UpdateItemCommand({
      TableName: 'Jogos',
      Key: marshall({ jog_id: game.jog_id }),
      UpdateExpression: 'SET total_apostas = if_not_exists(total_apostas, :zero) + :num_apostas, valor_total_apostas = if_not_exists(valor_total_apostas, :zero) + :valor_total',
      ExpressionAttributeValues: marshall({
        ':num_apostas': numbers.length,
        ':valor_total': numbers.length * game.jog_valorBilhete,
        ':zero': 0
      }),
      ReturnValues: 'UPDATED_NEW'
    }));

    return NextResponse.json({ 
      success: true,
      message: 'Bet registered successfully',
      pagamentoId,
      total_bilhetes: numbers.length,
      valor_total: numbers.length * game.jog_valorBilhete
    });

  } catch (error) {
    console.error('Error registering manual bet:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to validate numbers
function validateNumbers(game, numbers) {
  return numbers.every(numberSet => {
    if (numberSet.length !== game.numeroPalpites) {
      console.log('Number set length mismatch. Expected:', game.numeroPalpites, 'Got:', numberSet.length);
      return false;
    }
    const uniqueNumbers = new Set();
    return numberSet.every(num => {
      if (!Number.isInteger(num)) {
        console.log('Non-integer number found:', num);
        return false;
      }
      if (num < game.numeroInicial || num > game.numeroFinal) {
        console.log('Number out of range:', num, 'Range:', game.numeroInicial, 'to', game.numeroFinal);
        return false;
      }
      if (uniqueNumbers.has(num)) {
        console.log('Duplicate number found:', num);
        return false;
      }
      uniqueNumbers.add(num);
      return true;
    });
  });
}