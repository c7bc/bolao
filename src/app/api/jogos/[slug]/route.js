// src/app/api/jogos/[slug]/route.js

import { NextResponse } from 'next/server';
import {
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';
import dynamoDbClient from '../../../lib/dynamoDbClient';

<<<<<<< HEAD
/**
 * Verifica se o slug é único, exceto para o jogo atual (para atualização).
 * @param {string} slug - Slug a ser verificado.
 * @param {string|null} currentJogId - ID do jogo atual (para atualização).
 * @returns {boolean} - True se único, false caso contrário.
 */
=======
// Inicializa o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Função para verificar a unicidade do slug
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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

<<<<<<< HEAD
    if (!result.Items || result.Items.length === 0) return true;

    if (currentJogId) {
=======
    // Se não houver itens, o slug é único
    if (!result.Items || result.Items.length === 0) return true;

    if (currentJogId) {
      // Retorna true se todos os jogos encontrados tiverem o mesmo jog_id
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
      return result.Items.every(
        (item) => unmarshall(item).jog_id === currentJogId
      );
    }

<<<<<<< HEAD
    return false;
=======
    return false; // Slug já está em uso
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    throw new Error('Internal Server Error');
  }
};

<<<<<<< HEAD
/**
 * Handler GET - Busca jogo por slug.
 */
=======
// Manipulador GET - Buscar jogo por slug
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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
        'jog_id, slug, visibleInConcursos, jog_status, jog_tipodojogo, jog_valorjogo, jog_valorpremio, jog_quantidade_minima, jog_quantidade_maxima, jog_numeros, jog_nome, jog_data_inicio, jog_data_fim, jog_datacriacao, premiacoes',
    };

    const command = new QueryCommand(dbParams);
    const result = await dynamoDbClient.send(command);

<<<<<<< HEAD
=======
    // Se não houver itens, retorna 404
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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

<<<<<<< HEAD
/**
 * Handler PUT - Atualiza jogo por slug.
 */
=======
// Manipulador PUT - Atualizar jogo por slug
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
export async function PUT(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar jogo existente
    const getParams = {
      TableName: 'Jogos',
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': { S: slug },
      },
      ProjectionExpression: 'jog_id, jog_tipodojogo, jog_quantidade_minima, jog_quantidade_maxima',
    };

    const getCommand = new QueryCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

<<<<<<< HEAD
=======
    // Se não houver itens, retorna 404
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
    if (!getResult.Items || getResult.Items.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    const existingJog = unmarshall(getResult.Items[0]);
    const existingJogId = existingJog.jog_id;
    const existingJogoTipo = existingJog.jog_tipodojogo;
    const existingMin = existingJog.jog_quantidade_minima;
    const existingMax = existingJog.jog_quantidade_maxima;

<<<<<<< HEAD
    // Parse dos dados para atualização
    const updatedData = await request.json();

    // Tratamento do slug
=======
    // Parse dos dados de atualização
    const updatedData = await request.json();

    // Manipulação do slug
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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

<<<<<<< HEAD
    // Validação de jog_numeros com base em jog_tipodojogo
=======
    // Manipulação de jog_numeros com base no tipo de jogo
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
    const jogoTipo = updatedData.jog_tipodojogo || existingJogoTipo;

    if (jogoTipo !== 'JOGO_DO_BICHO') {
      if (updatedData.jog_numeros) {
        const numerosArray = updatedData.jog_numeros.split(',').map(num => num.trim());

        const quantidadeMin = updatedData.jog_quantidade_minima !== undefined ? updatedData.jog_quantidade_minima : existingJog.jog_quantidade_minima;
        const quantidadeMax = updatedData.jog_quantidade_maxima !== undefined ? updatedData.jog_quantidade_maxima : existingJog.jog_quantidade_maxima;

        if (
<<<<<<< HEAD
          numerosArray.length < quantidadeMin ||
          numerosArray.length > quantidadeMax
        ) {
          return NextResponse.json(
            { error: `A quantidade de números deve estar entre ${quantidadeMin} e ${quantidadeMax}.` },
=======
          numerosArray.length < (updatedData.jog_quantidade_minima || existingMin) ||
          numerosArray.length > (updatedData.jog_quantidade_maxima || existingMax)
        ) {
          return NextResponse.json(
            { error: `A quantidade de números deve estar entre ${updatedData.jog_quantidade_minima || existingMin} e ${updatedData.jog_quantidade_maxima || existingMax}.` },
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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
<<<<<<< HEAD
      // Para JOGO_DO_BICHO
=======
      // Para JOGO_DO_BICHO, validar jog_numeros como animais
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
      if (updatedData.jog_numeros) {
        const validAnimals = [
          'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
          'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
          'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
          'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
          'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
        ];
        const animals = updatedData.jog_numeros.split(',').map(a => a.trim());

        const quantidadeMin = updatedData.jog_quantidade_minima !== undefined ? updatedData.jog_quantidade_minima : existingJog.jog_quantidade_minima;
        const quantidadeMax = updatedData.jog_quantidade_maxima !== undefined ? updatedData.jog_quantidade_maxima : existingJog.jog_quantidade_maxima;

        if (
<<<<<<< HEAD
          animals.length < quantidadeMin ||
          animals.length > quantidadeMax
        ) {
          return NextResponse.json(
            { error: `A quantidade de animais deve estar entre ${quantidadeMin} e ${quantidadeMax}.` },
=======
          animals.length < (updatedData.jog_quantidade_minima || existingMin) ||
          animals.length > (updatedData.jog_quantidade_maxima || existingMax)
        ) {
          return NextResponse.json(
            { error: `A quantidade de animais deve estar entre ${updatedData.jog_quantidade_minima || existingMin} e ${updatedData.jog_quantidade_maxima || existingMax}.` },
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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

<<<<<<< HEAD
    // Validação de jog_valorpremio
=======
    // Manipulação de jog_valorpremio (Valor do Prêmio)
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
    if (updatedData.jog_valorpremio !== undefined) {
      if (isNaN(updatedData.jog_valorpremio) || Number(updatedData.jog_valorpremio) < 0) {
        return NextResponse.json(
          { error: 'Valor do Prêmio inválido.' },
          { status: 400 }
        );
      }
    }

<<<<<<< HEAD
    // Construção das expressões de atualização
=======
    // Validação das premiações (se presente)
    if (updatedData.premiacoes) {
      if (typeof updatedData.premiacoes !== 'object') {
        return NextResponse.json({ error: 'Premiações inválidas.' }, { status: 400 });
      }
      const expectedKeys = ['10', '9', 'menos'];
      const keys = Object.keys(updatedData.premiacoes);
      if (!expectedKeys.every(key => keys.includes(key))) {
        return NextResponse.json({ error: 'Premiações devem conter as chaves "10", "9" e "menos".' }, { status: 400 });
      }

      const totalPercentage = expectedKeys.reduce((acc, key) => acc + updatedData.premiacoes[key], 0);
      if (totalPercentage !== 1) { // 100%
        return NextResponse.json({ error: 'A soma das premiações deve ser 100% (1).' }, { status: 400 });
      }
    }

    // Construir as expressões de atualização
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
    const updateExpressions = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(updatedData).forEach((key) => {
<<<<<<< HEAD
=======
      // Evitar campos vazios e campos de chave primária
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
      if (
        updatedData[key] !== undefined &&
        updatedData[key] !== null &&
        updatedData[key] !== '' &&
<<<<<<< HEAD
        key !== 'jog_id'
=======
        key !== 'jog_id' // Evitar atualizar jog_id
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
      ) {
        updateExpressions.push(`#${key} = :${key}`);
        ExpressionAttributeNames[`#${key}`] = key;

<<<<<<< HEAD
=======
        // Mapear tipos de dados para DynamoDB
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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

<<<<<<< HEAD
=======
    // Verificar se há expressões de atualização válidas
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
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

<<<<<<< HEAD
/**
 * Handler DELETE - Deleta jogo por slug.
 */
=======
// Manipulador DELETE - Deletar jogo por slug
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
export async function DELETE(request, { params }) {
  const { slug } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar jogo existente
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

<<<<<<< HEAD
=======
    // Se não houver itens, retorna 404
>>>>>>> 684726e13978d08f09d1e87ee77f58b36940258e
    if (!getResult.Items || getResult.Items.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    const existingJogId = unmarshall(getResult.Items[0]).jog_id;

    // Deletar o jogo
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
