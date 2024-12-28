// Caminho: src/app/api/jogos/[slug]/route.js

import { NextResponse } from 'next/server';
import {
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';
import dynamoDbClient from '../../../lib/dynamoDbClient';

/**
 * Handler GET - Busca jogo por slug.
 */
export async function GET(request, { params }) {
  const { slug } = params;

  try {
    const dbParams = {
      TableName: 'Jogos',
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
      ProjectionExpression:
        'jog_id, slug, visibleInConcursos, jog_status, jog_tipodojogo, jog_valorjogo, jog_valorpremio, jog_quantidade_minima, jog_quantidade_maxima, jog_numeros, jog_nome, jog_data_inicio, jog_data_fim, jog_datacriacao, jog_creator_id, jog_creator_role, premiacoes',
    };

    const command = new QueryCommand(dbParams);
    const result = await dynamoDbClient.send(command);

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

/**
 * Handler PUT - Atualiza jogo por slug.
 */
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
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
      ProjectionExpression: 'jog_id, jog_creator_id, jog_creator_role',
    };

    const getCommand = new QueryCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Items || getResult.Items.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado.' },
        { status: 404 }
      );
    }

    const existingJog = unmarshall(getResult.Items[0]);
    const existingJogId = existingJog.jog_id;
    const existingJogCreatorId = existingJog.jog_creator_id;
    const existingJogCreatorRole = existingJog.jog_creator_role;

    // Verificar se o usuário tem permissão para atualizar o jogo
    if (
      decodedToken.role === 'colaborador' &&
      decodedToken.col_id !== existingJogCreatorId
    ) {
      return NextResponse.json({ error: 'Acesso negado. Você não é o criador deste jogo.' }, { status: 403 });
    }

    // Parse dos dados para atualização
    const updatedData = await request.json();

    // Tratamento do slug
    if (updatedData.slug && updatedData.slug !== slug) {
      const newSlug = slugify(updatedData.slug, { lower: true, strict: true });
      const isUnique = await isSlugUnique(newSlug, existingJogId);
      if (!isUnique) {
        return NextResponse.json(
          { error: 'Slug já está em uso. Por favor, escolha outro.' },
          { status: 400 }
        );
      }
      updatedData.slug = newSlug;
    }

    // Validação de jog_numeros com base em jog_tipodojogo
    const jogoTipo = updatedData.jog_tipodojogo || existingJog.jog_tipodojogo;

    if (jogoTipo !== 'JOGO_DO_BICHO') {
      if (updatedData.jog_numeros) {
        const numerosArray = updatedData.jog_numeros.split(',').map(num => num.trim());
        const quantidadeMin = updatedData.jog_quantidade_minima !== undefined ? updatedData.jog_quantidade_minima : existingJog.jog_quantidade_minima;
        const quantidadeMax = updatedData.jog_quantidade_maxima !== undefined ? updatedData.jog_quantidade_maxima : existingJog.jog_quantidade_maxima;

        if (
          numerosArray.length < quantidadeMin ||
          numerosArray.length > quantidadeMax
        ) {
          return NextResponse.json(
            { error: `A quantidade de números deve estar entre ${quantidadeMin} e ${quantidadeMax}.` },
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
          animals.length < quantidadeMin ||
          animals.length > quantidadeMax
        ) {
          return NextResponse.json(
            { error: `A quantidade de animais deve estar entre ${quantidadeMin} e ${quantidadeMax}.` },
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

    // Validação de jog_valorpremio
    if (updatedData.jog_valorpremio !== undefined) {
      if (isNaN(updatedData.jog_valorpremio) || Number(updatedData.jog_valorpremio) < 0) {
        return NextResponse.json(
          { error: 'Valor do Prêmio inválido.' },
          { status: 400 }
        );
      }
    }

    // Validação das premiações
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
      if (totalPercentage !== 1) {
        return NextResponse.json({ error: 'A soma das premiações deve ser 100% (1).' }, { status: 400 });
      }
    }

    // Construção das expressões de atualização
    const updateExpressions = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(updatedData).forEach((key) => {
      if (
        updatedData[key] !== undefined &&
        updatedData[key] !== null &&
        updatedData[key] !== '' &&
        key !== 'jog_id' &&
        key !== 'jog_creator_id' &&
        key !== 'jog_creator_role'
      ) {
        updateExpressions.push(`#${key} = :${key}`);
        ExpressionAttributeNames[`#${key}`] = key;

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

    if (updateExpressions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado válido para atualizar foi fornecido.' },
        { status: 400 }
      );
    }

    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: existingJogId }),
      UpdateExpression: 'SET ' + updateExpressions.join(', ') + ', jog_dataupdate = :dataupdate',
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':dataupdate': { S: new Date().toISOString() },
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);
    const updatedJog = unmarshall(updateResult.Attributes);

    // Criar atividade para atualização da tarefa
    const atividade = {
      atividadeId: uuidv4(),
      text: `Jogo atualizado: ${updatedJog.jog_nome}`,
      tipo: 'jogo_updated',
      descricao: `O jogo "${updatedJog.jog_nome}" foi atualizado.`,
      status: 'info',
      timestamp: new Date().toISOString(),
      usuario: decodedToken.role === 'admin' || decodedToken.role === 'superadmin'
        ? decodedToken.adm_email
        : decodedToken.col_email, // Supondo que o email está disponível no token
      detalhes: {
        // Opcional: incluir detalhes das atualizações
      }
    };

    const putActivityCommand = new PutItemCommand({
      TableName: 'Atividades',
      Item: marshall(atividade)
    });

    await dynamoDbClient.send(putActivityCommand);

    return NextResponse.json({ jogo: updatedJog, atividade }, { status: 200 });

  } catch (error) {
    console.error('Error updating jogo by slug:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if slug is unique
 */
async function isSlugUnique(slug, currentJogId = null) {
  const params = {
    TableName: 'Jogos',
    IndexName: 'SlugIndex',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: marshall({
      ':slug': slug,
    }),
    ProjectionExpression: 'jog_id',
  };

  try {
    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);

    if (!result.Items || result.Items.length === 0) return true;

    if (currentJogId) {
      return result.Items.every(
        (item) => unmarshall(item).jog_id === currentJogId
      );
    }

    return false;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    throw new Error('Internal Server Error');
  }
}
