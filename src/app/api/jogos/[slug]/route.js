// src/app/api/jogos/[slug]/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Function to check slug uniqueness
const isSlugUnique = async (slug, currentJogId = null) => {
  const params = {
    TableName: 'Jogos',
    IndexName: 'SlugIndex',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: {
      ':slug': { S: slug },
    },
    ProjectionExpression: 'jog_id',
  };

  try {
    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);

    // If no items, slug is unique
    if (!result.Items || result.Items.length === 0) return true;

    if (currentJogId) {
      // Return true if all found jogos have the same jog_id
      return result.Items.every(
        (item) => unmarshall(item).jog_id === currentJogId
      );
    }

    return false; // Slug is already in use
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    throw new Error('Internal Server Error');
  }
};

// Handler GET - Fetch jogo by slug
export async function GET(request, { params }) {
  const { slug } = params;

  try {
    const dbParams = {
      TableName: 'Jogos',
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': { S: slug },
      },
      ProjectionExpression:
        'jog_id, slug, visibleInConcursos, jog_status, jog_tipodojogo, jog_valorjogo, jog_valorpremio, jog_quantidade_minima, jog_quantidade_maxima, jog_numeros, jog_nome, jog_data_inicio, jog_data_fim, jog_datacriacao',
    };

    const command = new QueryCommand(dbParams);
    const result = await dynamoDbClient.send(command);

    // If no items, return 404
    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    const jogo = unmarshall(result.Items[0]);
    return NextResponse.json({ jogo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jogo by slug:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handler PUT - Update jogo by slug
export async function PUT(request, { params }) {
  const { slug } = params;

  try {
    // Authentication
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      (decodedToken.role !== 'admin' &&
        decodedToken.role !== 'superadmin' &&
        decodedToken.role !== 'colaborador')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch existing jogo
    const getParams = {
      TableName: 'Jogos',
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': { S: slug },
      },
      ProjectionExpression: 'jog_id, jog_tipodojogo',
    };

    const getCommand = new QueryCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    // If no items, return 404
    if (!getResult.Items || getResult.Items.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    const existingJog = unmarshall(getResult.Items[0]);
    const existingJogId = existingJog.jog_id;
    const existingJogoTipo = existingJog.jog_tipodojogo;

    // Parse update data
    const updatedData = await request.json();

    // Handle slug
    if (updatedData.slug && updatedData.slug !== slug) {
      const newSlug = slugify(updatedData.slug, { lower: true, strict: true });
      if (!(await isSlugUnique(newSlug, existingJogId))) {
        return NextResponse.json(
          { error: 'Slug já está em uso. Por favor, escolha outro.' },
          { status: 400 }
        );
      }
      updatedData.slug = newSlug;
    }

    // Handle jog_numeros based on jog_tipodojogo
    const jogoTipo = updatedData.jog_tipodojogo || existingJogoTipo;

    if (jogoTipo !== 'JOGO_DO_BICHO') {
      if (updatedData.jog_numeros) {
        const numerosArray = updatedData.jog_numeros.split(',').map(num => num.trim());

        if (
          numerosArray.length < (updatedData.jog_quantidade_minima || existingJog.jog_quantidade_minima) ||
          numerosArray.length > (updatedData.jog_quantidade_maxima || existingJog.jog_quantidade_maxima)
        ) {
          return NextResponse.json(
            { error: `A quantidade de números deve estar entre ${updatedData.jog_quantidade_minima || existingJog.jog_quantidade_minima} e ${updatedData.jog_quantidade_maxima || existingJog.jog_quantidade_maxima}.` },
            { status: 400 }
          );
        }

        const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
        if (!numerosValidos) {
          return NextResponse.json(
            { error: 'Os números devem conter apenas dígitos.' },
            { status: 400 }
          );
        }
      }
    } else {
      // For JOGO_DO_BICHO, validate jog_numeros as animals
      if (updatedData.jog_numeros) {
        const validAnimals = [
          'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
          'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
          'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
          'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
          'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
        ];
        const animals = updatedData.jog_numeros.split(',').map(a => a.trim());

        if (
          animals.length < (updatedData.jog_quantidade_minima || existingJog.jog_quantidade_minima) ||
          animals.length > (updatedData.jog_quantidade_maxima || existingJog.jog_quantidade_maxima)
        ) {
          return NextResponse.json(
            { error: `A quantidade de animais deve estar entre ${updatedData.jog_quantidade_minima || existingJog.jog_quantidade_minima} e ${updatedData.jog_quantidade_maxima || existingJog.jog_quantidade_maxima}.` },
            { status: 400 }
          );
        }

        const animaisValidos = animals.every(animal => validAnimals.includes(animal));
        if (!animaisValidos) {
          return NextResponse.json(
            { error: 'Os animais devem ser válidos e separados por vírgula.' },
            { status: 400 }
          );
        }
      }
    }

    // Handle jog_valorpremio (Valor do Prêmio)
    if (updatedData.jog_valorpremio !== undefined) {
      if (isNaN(updatedData.jog_valorpremio) || Number(updatedData.jog_valorpremio) < 0) {
        return NextResponse.json(
          { error: 'Valor do Prêmio inválido.' },
          { status: 400 }
        );
      }
    }

    // Build Update Expressions
    const updateExpressions = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(updatedData).forEach((key) => {
      // Avoid empty fields and primary key fields
      if (
        updatedData[key] !== undefined &&
        updatedData[key] !== null &&
        updatedData[key] !== '' &&
        key !== 'jog_id' // Avoid updating jog_id
      ) {
        updateExpressions.push(`#${key} = :${key}`);
        ExpressionAttributeNames[`#${key}`] = key;

        // Map data types for DynamoDB
        if (typeof updatedData[key] === 'boolean') {
          ExpressionAttributeValues[`:${key}`] = { BOOL: updatedData[key] };
        } else if (typeof updatedData[key] === 'number') {
          ExpressionAttributeValues[`:${key}`] = {
            N: updatedData[key].toString(),
          };
        } else {
          ExpressionAttributeValues[`:${key}`] = { S: updatedData[key] };
        }
      }
    });

    // Check if there are valid update expressions
    if (updateExpressions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado válido para atualizar foi fornecido.' },
        { status: 400 }
      );
    }

    const updateParams = {
      TableName: 'Jogos',
      Key: {
        jog_id: { S: existingJogId },
      },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    await dynamoDbClient.send(updateCommand);

    return NextResponse.json(
      { message: 'Jogo atualizado com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating jogo by slug:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handler DELETE - Delete jogo by slug
export async function DELETE(request, { params }) {
  const { slug } = params;

  try {
    // Authentication
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      (decodedToken.role !== 'admin' &&
        decodedToken.role !== 'superadmin' &&
        decodedToken.role !== 'colaborador')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch existing jogo
    const getParams = {
      TableName: 'Jogos',
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': { S: slug },
      },
      ProjectionExpression: 'jog_id',
    };

    const getCommand = new QueryCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    // If no items, return 404
    if (!getResult.Items || getResult.Items.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    const existingJogId = unmarshall(getResult.Items[0]).jog_id;

    // Delete the jogo
    const deleteParams = {
      TableName: 'Jogos',
      Key: {
        jog_id: { S: existingJogId },
      },
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    return NextResponse.json(
      { message: 'Jogo deletado com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting jogo by slug:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
