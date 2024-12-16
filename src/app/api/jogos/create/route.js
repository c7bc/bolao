// src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';
import dynamoDbClient from '../../../lib/dynamoDbClient';

/**
 * Verifica se o slug é único na tabela Jogos.
 * @param {string} slug - Slug a ser verificado.
 * @returns {boolean} - True se único, false caso contrário.
 */
const isSlugUnique = async (slug) => {
  const params = {
    TableName: 'Jogos',
    IndexName: 'SlugIndex', // Assegure-se que este GSI existe
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: {
      ':slug': { S: slug },
    },
    ProjectionExpression: 'jog_id',
  };

  const command = new QueryCommand(params);
  const result = await dynamoDbClient.send(command);
  return result.Count === 0;
};

/**
 * Gera um slug único baseado no nome do jogo.
 * @param {string} name - Nome do jogo.
 * @returns {string} - Slug único.
 */
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

    if (
      !decodedToken ||
      !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)
    ) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const {
      jog_status,
      jog_tipodojogo,
      jog_valorjogo,
      jog_valorpremio,
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
      jog_pontos_necessarios,
      slug,
      visibleInConcursos,
      premiacoes, // Novo campo
    } = await request.json();

    // Validação de campos obrigatórios
    if (
      !jog_status ||
      !jog_tipodojogo ||
      jog_quantidade_minima === undefined ||
      jog_quantidade_maxima === undefined ||
      !jog_nome ||
      !jog_data_inicio ||
      !jog_data_fim
    ) {
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    // Validação das premiações
    if (!premiacoes || typeof premiacoes !== 'object') {
      return NextResponse.json({ error: 'Premiações inválidas.' }, { status: 400 });
    }

    // Validar que as chaves são "10", "9" e "menos" e que os valores são percentuais válidos
    const expectedKeys = ['10', '9', 'menos'];
    const keys = Object.keys(premiacoes);
    if (!expectedKeys.every(key => keys.includes(key))) {
      return NextResponse.json({ error: 'Premiações devem conter as chaves "10", "9" e "menos".' }, { status: 400 });
    }

    const totalPercentage = expectedKeys.reduce((acc, key) => acc + premiacoes[key], 0);
    if (totalPercentage !== 1) { // 100%
      return NextResponse.json({ error: 'A soma das premiações deve ser 100% (1).' }, { status: 400 });
    }

    // Validação de jog_numeros com base em jog_tipodojogo
    if (jog_tipodojogo !== 'JOGO_DO_BICHO') {
      if (jog_numeros) {
        const numerosArray = jog_numeros.split(',').map(num => num.trim());

        if (
          numerosArray.length < jog_quantidade_minima ||
          numerosArray.length > jog_quantidade_maxima
        ) {
          return NextResponse.json(
            { error: `A quantidade de números deve estar entre ${jog_quantidade_minima} e ${jog_quantidade_maxima}.` },
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
      // Para JOGO_DO_BICHO
      if (jog_numeros) {
        const validAnimals = [
          'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
          'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
          'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
          'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
          'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
        ];
        const animals = jog_numeros.split(',').map(a => a.trim());

        if (
          animals.length < jog_quantidade_minima ||
          animals.length > jog_quantidade_maxima
        ) {
          return NextResponse.json(
            { error: `A quantidade de animais deve estar entre ${jog_quantidade_minima} e ${jog_quantidade_maxima}.` },
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

    // Manipulação do slug
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(jog_nome);
    } else {
      finalSlug = slugify(finalSlug, { lower: true, strict: true });
      if (!(await isSlugUnique(finalSlug))) {
        return NextResponse.json({ error: 'Slug já está em uso. Por favor, escolha outro.' }, { status: 400 });
      }
    }

    // Geração de ID único
    const jog_id = uuidv4();

    // Preparar dados para o DynamoDB
    const newJogo = {
      jog_id,
      slug: finalSlug,
      visibleInConcursos: visibleInConcursos !== undefined ? visibleInConcursos : true,
      jog_status,
      jog_tipodojogo,
      jog_valorjogo: jog_valorjogo || null,
      jog_valorpremio: jog_valorpremio || null,
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros: jog_numeros || null,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
      jog_pontos_necessarios: jog_pontos_necessarios || null,
      jog_datacriacao: new Date().toISOString(),
      col_id: decodedToken.col_id || null, // Associar jogo ao colaborador
      premiacoes,
    };

    // Inserir no DynamoDB
    const params = {
      TableName: 'Jogos',
      Item: marshall(newJogo),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ jogo: newJogo }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar jogo:', error);

    if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      return NextResponse.json({ error: 'Credenciais inválidas ou não configuradas.' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
