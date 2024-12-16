import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../utils/auth';
import slugify from 'slugify';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const isSlugUnique = async (slug) => {
  const params = {
    TableName: 'Jogos',
    IndexName: 'SlugIndex',
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

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const command = new ScanCommand({
      TableName: 'Jogos',
      FilterExpression: 'attribute_exists(jog_id)',
    });

    const result = await dynamoDbClient.send(command);
    const jogos = result.Items.map(item => unmarshall(item));

    // Ordenar por data de criação, mais recentes primeiro
    jogos.sort((a, b) => new Date(b.jog_datacriacao) - new Date(a.jog_datacriacao));

    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || 
        (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin' && decodedToken.role !== 'colaborador')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

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
    } = await request.json();

    if (
      !jog_status ||
      !jog_tipodojogo ||
      !jog_quantidade_minima ||
      !jog_quantidade_maxima ||
      !jog_nome ||
      !jog_data_inicio ||
      !jog_data_fim
    ) {
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(jog_nome);
    } else {
      finalSlug = slugify(finalSlug, { lower: true, strict: true });
      if (!(await isSlugUnique(finalSlug))) {
        return NextResponse.json({ error: 'Slug já está em uso.' }, { status: 400 });
      }
    }

    const jog_id = uuidv4();

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
      col_id: decodedToken.col_id || null,
    };

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