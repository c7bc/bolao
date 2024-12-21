// Arquivos combinados - Grupo 1
// Data de geração: 2024-12-20T20:59:27.513Z

// Caminho: src\app\api\jogos\list\route.js
// src/app/api/jogos/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';
import { updateGameStatuses } from '../../../../app/utils/updateGameStatuses';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // Atualizar status dos jogos antes de qualquer operação
    await updateGameStatuses();

    // Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Token not provided' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obter os parâmetros da query string
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'open'; // Valor padrão 'open'
    const slug = url.searchParams.get('slug'); // Para verificar unicidade do slug

    if (slug) {
      // Verificar unicidade do slug usando Scan
      const scanParams = {
        TableName: 'Jogos',
        FilterExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': { S: slug },
        },
        ProjectionExpression: 'jog_id',
        Limit: 1,
      };

      const scanCommand = new ScanCommand(scanParams);
      const scanResult = await dynamoDbClient.send(scanCommand);
      const jogos = scanResult.Items ? scanResult.Items.map(item => unmarshall(item)) : [];
      return NextResponse.json({ jogos }, { status: 200 });
    }

    // Parâmetros do QueryCommand usando o índice secundário 'StatusIndex'
    const command = new QueryCommand({
      TableName: 'Jogos', // Nome correto da tabela
      IndexName: 'StatusIndex', // Índice secundário para 'status'
      KeyConditionExpression: '#st = :status',
      ExpressionAttributeNames: {
        '#st': 'status', // Alias para evitar palavra reservada
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
      },
      ProjectionExpression: 'jog_id, jog_nome, jog_tipodojogo, jog_valorjogo, jog_quantidade_minima, jog_quantidade_maxima, jog_numeros, jog_pontos_necessarios, jog_data_inicio, jog_data_fim, jog_status, visibleInConcursos, premiacoes',
      Limit: 100, // Limite para evitar queries muito grandes
    });

    // Execução do Query
    const result = await dynamoDbClient.send(command);

    // Conversão dos itens
    const jogos = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // Retorno da resposta
    return NextResponse.json({ jogos }, { status: 200 });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error:', error.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.error('Error fetching jogos list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// Caminho: src\app\api\jogos\create\route.js
// src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';
import dynamoDbClient from '../../../lib/dynamoDbClient';
import { updateGameStatuses } from '../../../utils/updateGameStatuses';

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
    // Atualizar status dos jogos antes de qualquer operação
    await updateGameStatuses();

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

    // Validar que as chaves são "10", "9", "menos", "comissao_colaborador", "administracao" e que os valores são percentuais válidos
    const expectedKeys = ['10', '9', 'menos', 'comissao_colaborador', 'administracao'];
    const keys = Object.keys(premiacoes);
    if (!expectedKeys.every(key => keys.includes(key))) {
      return NextResponse.json({ error: 'Premiações devem conter as chaves "10", "9", "menos", "comissao_colaborador" e "administracao".' }, { status: 400 });
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


// Caminho: src\app\api\config\jogos\valores\route.js
// src/app/api/config/jogos/valores/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'ValoresDepositoJogos';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoDbClient.send(command);
    const valores = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ valores }, { status: 200 });
  } catch (error) {
    console.error('Error fetching valores de depósito:', error);
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { valor } = await request.json();

    if (valor === undefined || valor === null || isNaN(valor)) {
      console.error('Validation error: Invalid valor.', { valor });
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });
    }

    const newValor = {
      id: uuidv4(),
      valor: parseFloat(valor),
      dataCriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newValor),
    };
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ valor: newValor }, { status: 201 });
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// Caminho: src\app\api\config\recebimentos\route.js
// src/app/api/config/recebimentos/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Recebimentos';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoDbClient.send(command);
    const recebimentos = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ recebimentos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recebimentos:', error);
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      tipo,
      nome_titular,
      chave_pix,
      tipo_chave,
      status,
      agencia,
      conta,
      banco,
    } = await request.json();

    if (!tipo || !nome_titular || !chave_pix || !tipo_chave) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const newRecebimento = {
      id: uuidv4(),
      tipo,
      nome_titular,
      chave_pix,
      tipo_chave,
      status,
      agencia: agencia || '',
      conta: conta || '',
      banco: banco || '',
      dataCriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newRecebimento),
    };
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ recebimento: newRecebimento }, { status: 201 });
  } catch (error) {
    console.error('Error adding recebimento:', error);
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ error: 'Tabela ou índice não encontrado.' }, { status: 500 });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// Caminho: src\app\api\config\porcentagens\route.js
// src/app/api/config/porcentagens/route.js
// src\app\api\config\porcentagens\route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Porcentagens';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      console.error('Forbidden: Insufficient role.', { decodedToken });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamoDbClient.send(command);
    const porcentagens = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ porcentagens }, { status: 200 });
  } catch (error) {
    console.error('Error fetching porcentagens:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { perfil, colaboradorId, porcentagem, descricao } = await request.json();

    if (!perfil || (!colaboradorId && perfil === 'colaborador') || porcentagem === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const newPorcentagem = {
      id: uuidv4(),
      perfil,
      colaboradorId: perfil === 'colaborador' ? colaboradorId : null,
      porcentagem: parseFloat(porcentagem),
      descricao: descricao || '',
      dataCriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newPorcentagem),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ porcentagem: newPorcentagem }, { status: 201 });
  } catch (error) {
    console.error('Error creating porcentagem:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// Caminho: src\app\api\resultados\create\route.js
// src/app/api/resultados/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';
import { updateGameStatuses } from '../../../utils/updateGameStatuses';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // Atualizar status dos jogos antes de qualquer operação
    await updateGameStatuses();

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
      jogo_slug,
      tipo_jogo,
      numeros,
      dezena,
      horario,
      data_sorteio,
      premio,
    } = await request.json();

    // Validação de campos obrigatórios
    if (
      !jogo_slug ||
      !tipo_jogo ||
      !data_sorteio ||
      !premio ||
      (tipo_jogo !== 'JOGO_DO_BICHO' && !numeros) ||
      (tipo_jogo === 'JOGO_DO_BICHO' && (!dezena || !horario))
    ) {
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    // Validação dos números com base no tipo de jogo
    if (tipo_jogo !== 'JOGO_DO_BICHO') {
      const numerosArray = numeros.split(',').map(num => num.trim());

      const jogoTipoLimits = {
        MEGA: { min: 6, max: 60 },
        LOTOFACIL: { min: 15, max: 25 },
      };

      const { min, max } = jogoTipoLimits[tipo_jogo] || { min: 1, max: 60 };

      if (
        numerosArray.length < min ||
        numerosArray.length > max
      ) {
        return NextResponse.json(
          { error: `A quantidade de números deve estar entre ${min} e ${max}.` },
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
    } else {
      // Para JOGO_DO_BICHO
      const validAnimals = [
        'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
        'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
        'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
        'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
        'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
      ];
      const animals = numeros.split(',').map(a => a.trim());

      const jogoTipoLimits = {
        JOGO_DO_BICHO: { min: 6, max: 25 },
      };

      const { min, max } = jogoTipoLimits[tipo_jogo] || { min: 1, max: 25 };

      if (
        animals.length < min ||
        animals.length > max
      ) {
        return NextResponse.json(
          { error: `A quantidade de animais deve estar entre ${min} e ${max}.` },
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

    // Geração de ID único
    const resultado_id = uuidv4();

    // Preparar dados para o DynamoDB
    const novoResultado = {
      resultado_id,
      jogo_slug,
      tipo_jogo,
      numeros: tipo_jogo !== 'JOGO_DO_BICHO' ? numeros : null,
      dezena: tipo_jogo === 'JOGO_DO_BICHO' ? dezena : null,
      horario: tipo_jogo === 'JOGO_DO_BICHO' ? horario : null,
      data_sorteio,
      premio,
    };

    const params = {
      TableName: 'Resultados',
      Item: marshall(novoResultado),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    console.log('Novo resultado inserido:', novoResultado);

    // Processar resultados e determinar vencedores
    await processarResultados(novoResultado);

    return NextResponse.json({ resultado: novoResultado }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar resultado:', error);

    if (
      error.name === 'CredentialsError' ||
      error.message.includes('credentials')
    ) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

async function processarResultados(resultado) {
  const { jogo_slug, tipo_jogo, numeros, dezena, horario, data_sorteio, premio } = resultado;

  const apostasParams = {
    TableName: 'HistoricoCliente',
    IndexName: 'jogo-slug-index',
    KeyConditionExpression: 'htc_idjogo = :jogo_slug',
    ExpressionAttributeValues: marshall({
      ':jogo_slug': jogo_slug,
    }),
  };

  const apostasCommand = new QueryCommand(apostasParams);
  const apostasResult = await dynamoDbClient.send(apostasCommand);

  const apostas = apostasResult.Items.map(item => unmarshall(item));

  console.log(`Total de apostas encontradas para o jogo ${jogo_slug}:`, apostas.length);

  for (const aposta of apostas) {
    let isWinner = false;

    if (tipo_jogo === 'MEGA' || tipo_jogo === 'LOTOFACIL') {
      const numerosSorteados = numeros.split(',').map(num => num.trim());
      const apostaNumeros = aposta.htc_cotas ? 
        Object.entries(aposta)
          .filter(([key]) => key.startsWith('htc_cota'))
          .map(([_, value]) => value.toString()) : [];
      
      const acertos = apostaNumeros.filter(num => numerosSorteados.includes(num)).length;
      const acertosParaVencer = tipo_jogo === 'MEGA' ? 6 : 15;

      if (acertos >= acertosParaVencer) {
        isWinner = true;
      }
    } else if (tipo_jogo === 'JOGO_DO_BICHO') {
      if (aposta.htc_dezena === dezena && aposta.htc_horario === horario) {
        isWinner = true;
      }
    }

    const updateApostaParams = {
      TableName: 'HistoricoCliente',
      Key: marshall({ htc_id: aposta.htc_id }),
      UpdateExpression: 'SET htc_status = :status, htc_resultado = :resultado, htc_dataupdate = :dataupdate',
      ExpressionAttributeValues: marshall({
        ':status': isWinner ? 'vencedora' : 'não vencedora',
        ':resultado': isWinner ? 'Parabéns! Você ganhou!' : 'Infelizmente, você não ganhou desta vez.',
        ':dataupdate': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateApostaCommand = new UpdateItemCommand(updateApostaParams);
    await dynamoDbClient.send(updateApostaCommand);

    console.log(`Aposta ${aposta.htc_id} foi marcada como ${isWinner ? 'vencedora' : 'não vencedora'}.`);

    if (isWinner) {
      await atualizarFinanceiroApósVitoria(aposta, premio);
    }
  }
}

async function atualizarFinanceiroApósVitoria(aposta, premio) {
  const { htc_idcliente, htc_idcolaborador, htc_transactionid } = aposta;

  // Buscar dados do colaborador
  const getColaboradorParams = {
    TableName: 'Cliente',
    IndexName: 'cli_id-index',
    KeyConditionExpression: 'cli_id = :id',
    ExpressionAttributeValues: marshall({
      ':id': htc_idcliente,
    }),
  };

  const apostasCommand = new QueryCommand(getColaboradorParams);
  const colaboradorData = await dynamoDbClient.send(apostasCommand);

  if (!colaboradorData.Items || colaboradorData.Items.length === 0) {
    console.warn(`Colaborador com ID ${htc_idcolaborador} não encontrado.`);
    return;
  }

  const colaborador = unmarshall(colaboradorData.Items[0]);

  // Buscar configuração de comissão do colaborador
  const getConfigParams = {
    TableName: 'Configuracoes',
    Key: marshall({ conf_nome: 'comissao_colaborador' }),
  };

  const getConfigCommand = new QueryCommand(getConfigParams);
  const configData = await dynamoDbClient.send(getConfigCommand);

  let porcentagemComissao = 10; // Valor padrão

  if (configData.Items && configData.Items.length > 0) {
    const config = unmarshall(configData.Items[0]);
    porcentagemComissao = parseFloat(config.conf_valor);
  }

  const comissaoColaborador = (premio * porcentagemComissao) / 100;
  const comissaoAdmin = premio - comissaoColaborador;

  // Registrar comissão do colaborador
  const newFinanceiroColaborador = {
    fic_id: uuidv4(),
    fic_idcolaborador: htc_idcolaborador,
    fic_idcliente: htc_idcliente,
    fic_deposito_cliente: premio.toFixed(2),
    fic_porcentagem: porcentagemComissao,
    fic_comissao: comissaoColaborador.toFixed(2),
    fic_tipocomissao: 'prêmio',
    fic_descricao: `Comissão pela vitória da aposta ${aposta.htc_id}`,
    fic_datacriacao: new Date().toISOString(),
  };

  const putFinanceiroColaboradorParams = {
    TableName: 'Financeiro_Colaborador',
    Item: marshall(newFinanceiroColaborador),
  };

  const putFinanceiroColaboradorCommand = new PutItemCommand(putFinanceiroColaboradorParams);
  await dynamoDbClient.send(putFinanceiroColaboradorCommand);

  // Registrar comissão para o administrador
  const newFinanceiroAdministrador = {
    fid_id: uuidv4(),
    fid_id_historico_cliente: htc_transactionid,
    fid_status: 'pendente',
    fid_valor_admin: comissaoAdmin.toFixed(2),
    fid_valor_colaborador: comissaoColaborador.toFixed(2),
    fid_valor_rede: (premio - comissaoAdmin - comissaoColaborador).toFixed(2),
    fid_datacriacao: new Date().toISOString(),
  };

  const putFinanceiroAdministradorParams = {
    TableName: 'Financeiro_Administrador',
    Item: marshall(newFinanceiroAdministrador),
  };

  const putFinanceiroAdministradorCommand = new PutItemCommand(putFinanceiroAdministradorParams);
  await dynamoDbClient.send(putFinanceiroAdministradorCommand);

  console.log(`Financeiro atualizado para colaborador ${htc_idcolaborador} e administrador.`);
}


// Caminho: src\app\components\dashboard\Admin\Configuracoes.jsx
// src/app/components/dashboard/Admin/Configuracoes.jsx
'use client';

import React from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import JogosConfig from './JogosConfig';
import RecebimentoConfig from './RecebimentoConfig';
import PorcentagensConfig from './PorcentagensConfig';

const Configuracoes = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Configurações
      </Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Jogos</Tab>
          <Tab>Recebimento</Tab>
          <Tab>Porcentagens</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <JogosConfig />
          </TabPanel>
          <TabPanel>
            <RecebimentoConfig />
          </TabPanel>
          <TabPanel>
            <PorcentagensConfig />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Configuracoes;


