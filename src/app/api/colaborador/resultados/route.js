// Caminho: src/app/api/colaborador/resultados/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
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

const resultadosTableName = 'Resultados'; // Verifique o nome da tabela
const jogosTableName = 'Jogos'; // Verifique o nome da tabela

// GET - Buscar resultados do colaborador
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queryParams = {
      TableName: resultadosTableName,
      IndexName: 'col_id-index', // Verifique se este índice existe
      KeyConditionExpression: 'col_id = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: decodedToken.col_id },
      },
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);
    const resultados = response.Items ? response.Items.map(item => unmarshall(item)) : [];

    // Buscar informações dos jogos relacionados
    const jogosIds = [...new Set(resultados.map(r => r.jog_id))];
    const jogosInfo = {};

    if (jogosIds.length > 0) {
      const jogosParams = {
        TableName: jogosTableName,
        FilterExpression: 'jog_id IN (' + jogosIds.map((_, i) => `:id${i}`).join(',') + ')',
        ExpressionAttributeValues: jogosIds.reduce((acc, id, i) => ({
          ...acc,
          [`:id${i}`]: { S: id },
        }), {}),
      };

      const jogosCommand = new ScanCommand(jogosParams);
      const jogosResponse = await dynamoDbClient.send(jogosCommand);

      jogosResponse.Items.forEach(item => {
        const jogo = unmarshall(item);
        jogosInfo[jogo.jog_id] = jogo;
      });
    }

    // Combinar informações de resultados com jogos
    const resultadosCompletos = resultados.map(resultado => ({
      ...resultado,
      jogo_nome: jogosInfo[resultado.jog_id]?.jog_nome || 'Jogo não encontrado',
    }));

    return NextResponse.json({ resultados: resultadosCompletos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resultados:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Criar novo resultado
export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { jogo_id, numeros, data_sorteio, premio } = await request.json();

    // Validações
    if (!jogo_id || !numeros || !data_sorteio || !premio) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando.' },
        { status: 400 }
      );
    }

    // Verificar se o jogo existe e pertence ao colaborador
    const jogoParams = {
      TableName: jogosTableName,
      Key: marshall({ jog_id: jogo_id }),
    };

    const jogoCommand = new QueryCommand(jogoParams);
    const jogoResult = await dynamoDbClient.send(jogoCommand);

    if (!jogoResult.Items || jogoResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(jogoResult.Items[0]);

    if (jogo.col_id !== decodedToken.col_id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para registrar resultados para este jogo.' },
        { status: 403 }
      );
    }

    // Validar números com base no tipo de jogo
    if (jogo.jog_tipodojogo !== 'JOGO_DO_BICHO') {
      const numerosArray = numeros.split(',').map(num => num.trim());
      const min = parseInt(jogo.jog_quantidade_minima, 10);
      const max = parseInt(jogo.jog_quantidade_maxima, 10);

      if (numerosArray.length < min || numerosArray.length > max) {
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
    }

    // Criar novo resultado
    const resultado_id = uuidv4();
    const newResultado = {
      resultado_id,
      jog_id,
      col_id: decodedToken.col_id,
      numeros,
      data_sorteio,
      premio: premio.toString(),
      status: 'PENDENTE',
      data_criacao: new Date().toISOString(),
    };

    const putParams = {
      TableName: resultadosTableName,
      Item: marshall(newResultado),
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({
      message: 'Resultado registrado com sucesso.',
      resultado: newResultado,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating resultado:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
