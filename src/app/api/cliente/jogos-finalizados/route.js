// Caminho: src/app/api/cliente/jogos-finalizados/route.js (Linhas: 149)
// src/app/api/cliente/jogos-finalizados/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializa o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Handler GET - Buscar resultados dos jogos finalizados do cliente
 */
export async function GET(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['cliente'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const cli_id = decodedToken.cli_id;

    // Parâmetros para consultar o GSI 'cliente-id-index' na tabela 'Apostas'
    const queryParams = {
      TableName: 'Apostas',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
        ':finalizado': { S: 'finalizado' }, // Definido corretamente
      },
      FilterExpression: 'jog_status = :finalizado',
      ScanIndexForward: false,
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    const apostasFinalizadas = response.Items.map(item => unmarshall(item));

    // Extrair jog_id para buscar detalhes dos jogos em lote
    const jogIds = apostasFinalizadas.map(aposta => aposta.jog_id);
    const uniqueJogIds = [...new Set(jogIds)];

    if (uniqueJogIds.length === 0) {
      return NextResponse.json({ resultados: [] }, { status: 200 });
    }

    // Preparar BatchGetItem para buscar detalhes dos jogos
    const batchJogosParams = {
      RequestItems: {
        'Jogos': {
          Keys: uniqueJogIds.map(jog_id => ({ jog_id: { S: jog_id } })),
        },
      },
    };

    const batchJogosCommand = new BatchGetItemCommand(batchJogosParams);
    const batchJogosResponse = await dynamoDbClient.send(batchJogosCommand);

    const jogosMap = {};
    if (batchJogosResponse.Responses && batchJogosResponse.Responses['Jogos']) {
      batchJogosResponse.Responses['Jogos'].forEach(jogoItem => {
        const jogo = unmarshall(jogoItem);
        jogosMap[jogo.jog_id] = jogo;
      });
    }

    // Buscar resultados dos jogos
    const resultadosParams = {
      TableName: 'Resultados',
      IndexName: 'JogoSlugIndex', // Assegure-se de que este GSI existe na tabela 'Resultados'
      KeyConditionExpression: 'jogo_slug = :jogo_slug',
      ExpressionAttributeValues: {
        ':jogo_slug': { S: '' }, // Placeholder, será atualizado no loop
      },
    };

    // Preparar uma lista de jogo_slug
    const jogoSlugs = apostasFinalizadas.map(aposta => jogosMap[aposta.jog_id]?.slug).filter(Boolean);
    const uniqueSlugs = [...new Set(jogoSlugs)];

    const resultados = [];

    for (const slug of uniqueSlugs) {
      const params = {
        ...resultadosParams,
        ExpressionAttributeValues: {
          ':jogo_slug': { S: slug },
        },
      };

      const resultadosCommand = new QueryCommand(params);
      const resultadosResponse = await dynamoDbClient.send(resultadosCommand);

      const jogoResultados = resultadosResponse.Items.map(item => unmarshall(item));
      resultados.push(...jogoResultados);
    }

    // Enriquecer os resultados com detalhes das apostas e jogos
    const resultadosDetalhados = apostasFinalizadas.map(aposta => {
      const jogo = jogosMap[aposta.jog_id];
      const resultado = resultados.find(r => r.jog_id === aposta.jog_id);

      if (!jogo || !resultado) return null;

      let acertos = 0;
      if (jogo.jog_tipodojogo === 'MEGA') {
        acertos = aposta.htc_cotas.filter(num => resultado.numeros_sorteados.includes(num)).length;
      } else if (jogo.jog_tipodojogo === 'LOTOFACIL') {
        acertos = aposta.htc_cotas.filter(num => resultado.numeros_sorteados.includes(num)).length;
      } else if (jogo.jog_tipodojogo === 'JOGO_DO_BICHO') {
        acertos = (aposta.htc_dezena === resultado.dezena && aposta.htc_horario === resultado.horario) ? 1 : 0;
      }

      return {
        jog_id: jogo.jog_id,
        jog_nome: jogo.jog_nome,
        data_sorteio: resultado.data_sorteio || jogo.jog_data_fim,
        numeros_sorteados: resultado.numeros_sorteados,
        seus_numeros: aposta.htc_cotas,
        acertos,
        premio: aposta.htc_premio || 0,
        tipo_jogo: jogo.jog_tipodojogo,
        valor_aposta: aposta.htc_deposito || 0,
      };
    }).filter(Boolean);

    return NextResponse.json(
      { 
        resultados: resultadosFormatados,
        total: resultadosFormatados.length,
        timestamp: new Date().toISOString()
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Erro ao buscar resultados dos jogos finalizados do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
