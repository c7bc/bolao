// src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
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
const isSlugUnique = async (slug) => {
  const params = {
    TableName: 'Jogos',
    IndexName: 'SlugIndex', // Ensure this GSI exists
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

// Function to generate a unique slug
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
    // Authorization
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || 
        (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin' && decodedToken.role !== 'colaborador')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parsing request body
    const {
      jog_status,
      jog_tipodojogo,
      jog_valorjogo, // Now optional
      jog_valorpremio, // Valor do Prêmio
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
      jog_pontos_necessarios,
      slug, // New field
      visibleInConcursos, // New field
    } = await request.json();

    // Validate required fields based on jog_tipodojogo
    if (
      !jog_status ||
      !jog_tipodojogo ||
      !jog_quantidade_minima ||
      !jog_quantidade_maxima ||
      !jog_nome ||
      !jog_data_inicio ||
      !jog_data_fim
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Additional validation for jog_numeros based on jog_tipodojogo
    if (jog_tipodojogo !== 'JOGO_DO_BICHO') { // Assuming JOGO_DO_BICHO has different number handling
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
      // For JOGO_DO_BICHO, assume 'jog_numeros' should represent animal identifiers or specific format
      if (jog_numeros) {
        // Assuming 'jog_numeros' for JOGO_DO_BICHO should be one of 25 animals
        const validAnimals = [
          'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
          'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
          'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
          'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
          'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
        ];
        const animals = jog_numeros.split(',').map(a => a.trim());

        if (animals.length < jog_quantidade_minima || animals.length > jog_quantidade_maxima) {
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

    // Handle slug
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(jog_nome);
    } else {
      finalSlug = slugify(finalSlug, { lower: true, strict: true });
      if (!(await isSlugUnique(finalSlug))) {
        return NextResponse.json({ error: 'Slug já está em uso. Por favor, escolha outro.' }, { status: 400 });
      }
    }

    // Generate unique ID
    const jog_id = uuidv4();

    // Prepare data for DynamoDB
    const newJogo = {
      jog_id,
      slug: finalSlug,
      visibleInConcursos: visibleInConcursos !== undefined ? visibleInConcursos : true, // Default true
      jog_status,
      jog_tipodojogo,
      jog_valorjogo: jog_valorjogo || null, // Optional
      jog_valorpremio: jog_valorpremio || null, // Valor do Prêmio
      jog_quantidade_minima,
      jog_quantidade_maxima,
      jog_numeros: jog_numeros || null,
      jog_nome,
      jog_data_inicio,
      jog_data_fim,
      jog_pontos_necessarios: jog_pontos_necessarios || null,
      jog_datacriacao: new Date().toISOString(),
    };

    // Insert into DynamoDB
    const params = {
      TableName: 'Jogos',
      Item: marshall(newJogo),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ jogo: newJogo }, { status: 201 });
  } catch (error) {
    console.error('Error creating jogo:', error);

    if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      return NextResponse.json({ error: 'Credenciais inválidas ou não configuradas.' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
