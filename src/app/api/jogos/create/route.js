// Caminho: src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';
import slugify from 'slugify';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Função auxiliar para verificar unicidade do slug
 */
const isSlugUnique = async (slug) => {
  const queryParams = {
    TableName: 'Jogos',
    IndexName: 'slug-index',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: marshall({
      ':slug': slug,
    }),
  };

  const command = new QueryCommand(queryParams);
  const result = await dynamoDbClient.send(command);
  return result.Count === 0;
};

/**
 * Função auxiliar para gerar um slug único baseado no nome
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

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const {
      jog_nome,
      slug,
      visibleInConcursos,
      jog_tipodojogo, // Alinhado
      data_inicio,
      data_fim,
      valorBilhete,
      ativo,
      descricao,
      numeroInicial,
      numeroFinal,
      pontosPorAcerto,
      numeroPalpites,
      status,
      premiation, // Recebe os detalhes da premiação
    } = await request.json();

    // Definir formData para validação
    const formData = {
      jog_nome,
      slug,
      visibleInConcursos,
      jog_tipodojogo,
      data_inicio,
      data_fim,
      valorBilhete,
      ativo,
      descricao,
      numeroInicial,
      numeroFinal,
      pontosPorAcerto,
      numeroPalpites,
      status,
      premiation,
    };

    // Validação de campos obrigatórios
    const requiredFields = [
      'jog_nome',
      'jog_tipodojogo',
      'data_inicio',
      'data_fim',
      'valorBilhete',
      'descricao',
      'pontosPorAcerto',
      'numeroPalpites',
    ];

    const missingFields = requiredFields.filter(field => formData[field] === undefined || formData[field] === '');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Se a premiação fixa estiver ativa, validar a soma das porcentagens
    if (premiation && premiation.fixedPremiation) {
      const { campeao, vice, ultimoColocado, comissaoColaboradores, custosAdministrativos } = premiation.fixedPremiation || {};
      const fixedFields = ['campeao', 'vice', 'ultimoColocado', 'comissaoColaboradores', 'custosAdministrativos'];

      const missingFixedFields = fixedFields.filter(field => premiation.fixedPremiation[field] === undefined || premiation.fixedPremiation[field] === '');

      if (missingFixedFields.length > 0) {
        return NextResponse.json(
          { error: `Campos de premiação fixa faltando: ${missingFixedFields.join(', ')}` },
          { status: 400 }
        );
      }

      const total =
        (parseFloat(campeao) || 0) +
        (parseFloat(vice) || 0) +
        (parseFloat(ultimoColocado) || 0) +
        (parseFloat(comissaoColaboradores) || 0) +
        (parseFloat(custosAdministrativos) || 0);

      if (total !== 100) {
        return NextResponse.json(
          { error: 'A soma das porcentagens da premiação fixa deve ser igual a 100%.' },
          { status: 400 }
        );
      }
    }

    // Gerar slug único se não fornecido ou duplicado
    let finalSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(jog_nome, { lower: true, strict: true });
    if (!(await isSlugUnique(finalSlug))) {
      finalSlug = await generateUniqueSlug(jog_nome);
    }

    // Verificar se o jog_tipodojogo existe
    const checkGameTypeParams = {
      TableName: 'GameTypes',
      Key: marshall({ game_type_id: jog_tipodojogo }),
    };

    const checkGameTypeCommand = new GetItemCommand(checkGameTypeParams);
    const gameTypeResult = await dynamoDbClient.send(checkGameTypeCommand);

    if (!gameTypeResult.Item) {
      return NextResponse.json({ error: 'Tipo de jogo não encontrado.' }, { status: 404 });
    }

    const gameType = unmarshall(gameTypeResult.Item);

    // Gerar ID único para o jogo
    const jog_id = uuidv4();

    // Converter datas para ISO 8601 completo
    const dataInicioISO = data_inicio ? new Date(data_inicio).getTime() : null; // Alterado para Number
    const dataFimISO = data_fim ? new Date(data_fim).getTime() : null; // Alterado para Number

    // Preparar dados para o DynamoDB
    const novoJogo = {
      jog_id,
      slug: finalSlug,
      visibleInConcursos: visibleInConcursos !== undefined ? visibleInConcursos : true,
      jog_status: status || 'aberto', // Status inicial
      jog_tipodojogo,
      jog_nome,
      jog_valorBilhete: parseFloat(valorBilhete),
      ativo: ativo !== undefined ? ativo : true,
      descricao,
      numeroInicial,
      numeroFinal,
      pontosPorAcerto: parseInt(pontosPorAcerto, 10),
      numeroPalpites: parseInt(numeroPalpites, 10),
      data_inicio: dataInicioISO,
      data_fim: dataFimISO,
      jog_datacriacao: Date.now(), // Alterado para Number
      jog_datamodificacao: Date.now(), // Alterado para Number
      // Adicionar campos adicionais do tipo de jogo
      ...gameType,
      creator_id:
        decodedToken.role === 'admin' || decodedToken.role === 'superadmin'
          ? decodedToken.adm_id
          : decodedToken.col_id, // Supondo que col_id está disponível no token
      creator_role: decodedToken.role,
      premiation, // Inclui os detalhes da premiação
    };

    const params = {
      TableName: 'Jogos',
      Item: marshall(novoJogo, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(jog_id)', // Garante que o ID seja único
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ jogo: novoJogo }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar jogo:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'ID do jogo já existe.' }, { status: 400 });
    }

    if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
