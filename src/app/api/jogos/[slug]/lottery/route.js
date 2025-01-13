// Caminho: src\app\api\jogos\[slug]\lottery\route.js (Linhas: 244)
// src/app/api/jogos/[slug]/lottery/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request, context) {
  try {
    const params = await context.params;
    const { slug } = params;

    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Cabeçalho de autorização ausente.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { descricao, numerosSorteados } = await request.json();

    if (!descricao || !numerosSorteados) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const numerosArrayRaw = numerosSorteados.split(',').map(num => num.trim());
    const numerosArray = numerosArrayRaw
      .map(num => {
        const parsed = parseInt(num, 10);
        return !isNaN(parsed) ? String(parsed).padStart(2, '0') : null;
      })
      .filter(num => num !== null);

    if (numerosArray.length === 0) {
      return NextResponse.json({ error: 'Nenhum número válido fornecido.' }, { status: 400 });
    }

    // Verificar números duplicados no mesmo sorteio
    const countMap = {};
    numerosArray.forEach(num => {
      countMap[num] = (countMap[num] || 0) + 1;
    });

    const duplicatedNumbers = Object.keys(countMap).filter(num => countMap[num] > 1);
    if (duplicatedNumbers.length > 0) {
      return NextResponse.json({
        error: `Números duplicados no mesmo sorteio: ${duplicatedNumbers.join(', ')}`,
      }, { status: 400 });
    }

    // Buscar jogo
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    if (jogo.jog_status !== 'fechado') {
      return NextResponse.json({ error: 'O sorteio só pode ser realizado após o jogo estar fechado.' }, { status: 400 });
    }

    const numeroInicial = parseInt(jogo.numeroInicial, 10);
    const numeroFinal = parseInt(jogo.numeroFinal, 10);

    const numerosForaDoIntervalo = numerosArray.filter(num => {
      const numero = parseInt(num, 10);
      return isNaN(numero) || numero < numeroInicial || numero > numeroFinal;
    });

    if (numerosForaDoIntervalo.length > 0) {
      return NextResponse.json({
        error: `Números fora do intervalo permitido (${numeroInicial} a ${numeroFinal}): ${numerosForaDoIntervalo.join(', ')}`,
      }, { status: 400 });
    }

    // Buscar sorteios anteriores e verificar duplicações
    const sorteiosParams = {
      TableName: 'Sorteios',
      IndexName: 'jog_id-index',
      KeyConditionExpression: 'jog_id = :jog_id',
      ExpressionAttributeValues: marshall({
        ':jog_id': jogo.jog_id,
      }),
      ScanIndexForward: true, // Ordem cronológica
    };

    const sorteiosCommand = new QueryCommand(sorteiosParams);
    const sorteiosResult = await dynamoDbClient.send(sorteiosCommand);
    const sorteiosAnteriores = (sorteiosResult.Items || []).map(item => unmarshall(item));

    // Analisar duplicações com sorteios anteriores
    const duplicacoesComAnteriores = [];
    sorteiosAnteriores.forEach((sorteioAnterior, index) => {
      const numerosAnteriores = sorteioAnterior.numerosArray;
      const duplicados = numerosArray.filter(num => numerosAnteriores.includes(num));
      
      if (duplicados.length > 0) {
        duplicacoesComAnteriores.push({
          sorteioId: sorteioAnterior.sorteio_id,
          descricao: sorteioAnterior.descricao,
          numerosDuplicados: duplicados,
          ordemSorteio: index + 1
        });
      }
    });

    // Criar novo sorteio
    const sorteio = {
      sorteio_id: uuidv4(),
      jog_id: jogo.jog_id,
      descricao,
      numerosSorteados: numerosArray.join(','),
      dataSorteio: new Date().toISOString(),
      numerosArray,
      duplicacoesAnteriores: duplicacoesComAnteriores,
      ordem: sorteiosAnteriores.length + 1
    };

    const putParams = {
      TableName: 'Sorteios',
      Item: marshall(sorteio, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(sorteio_id)',
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({ sorteio }, { status: 201 });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { slug } = params;

    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Cabeçalho de autorização ausente.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar jogo
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    // Buscar sorteios
    const sorteiosParams = {
      TableName: 'Sorteios',
      IndexName: 'jog_id-index',
      KeyConditionExpression: 'jog_id = :jog_id',
      ExpressionAttributeValues: marshall({
        ':jog_id': jogo.jog_id,
      }),
      ScanIndexForward: false, // Ordem decrescente
    };

    const sorteiosCommand = new QueryCommand(sorteiosParams);
    const sorteiosResult = await dynamoDbClient.send(sorteiosCommand);

    const sorteiosProcessados = sorteiosResult.Items.map(sorteio => {
      const duplicacoesDetalhadas = sorteio.duplicacoesAnteriores || [];
      const numerosDuplicados = [...new Set(
        duplicacoesDetalhadas.flatMap(dup => dup.numerosDuplicados)
      )];

      return {
        ...sorteio,
        duplicacoesDetalhadas,
        numerosDuplicados
      };
    });

    // Lista completa de números duplicados em todos os sorteios
    const todosDuplicados = [...new Set(
      sorteiosProcessados
        .flatMap(sorteio => sorteio.numerosDuplicados)
    )];

    return NextResponse.json({
      sorteios: sorteiosProcessados,
      duplicatedNumbers: todosDuplicados,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
