// src/app/api/cliente/resultados/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // 1. Verificar autorização
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não encontrado' },
        { status: 401 }
      );
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização inválido' },
        { status: 401 }
      );
    }

    // 2. Verificar e decodificar token
    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // 3. Verificar se é um cliente
    if (decodedToken.role !== 'cliente') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const cli_id = decodedToken.cli_id;

    // 4. Buscar apostas do cliente
    const apostasParams = {
      TableName: 'Apostas',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      FilterExpression: 'jog_status = :finalizado',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
        ':finalizado': { S: 'finalizado' },
      },
    };

    const apostasCommand = new QueryCommand(apostasParams);
    const apostasResult = await dynamoDbClient.send(apostasCommand);
    const apostas = apostasResult.Items ? apostasResult.Items.map(item => unmarshall(item)) : [];

    if (apostas.length === 0) {
      return NextResponse.json({ resultados: [] }, { status: 200 });
    }

    // 5. Buscar IDs únicos dos jogos
    const jogosIds = [...new Set(apostas.map(aposta => aposta.jog_id))];

    // 6. Buscar detalhes dos jogos
    const batchJogosParams = {
      RequestItems: {
        'Jogos': {
          Keys: jogosIds.map(id => ({
            jog_id: { S: id }
          }))
        }
      }
    };

    const batchJogosCommand = new BatchGetItemCommand(batchJogosParams);
    const batchJogosResult = await dynamoDbClient.send(batchJogosCommand);
    
    const jogosMap = {};
    if (batchJogosResult.Responses && batchJogosResult.Responses.Jogos) {
      batchJogosResult.Responses.Jogos.forEach(item => {
        const jogo = unmarshall(item);
        jogosMap[jogo.jog_id] = jogo;
      });
    }

    // 7. Buscar resultados dos jogos
    const resultadosParams = {
      TableName: 'Resultados',
      FilterExpression: 'jog_id IN (' + jogosIds.map((_, i) => `:id${i}`).join(',') + ')',
      ExpressionAttributeValues: jogosIds.reduce((acc, id, i) => ({
        ...acc,
        [`:id${i}`]: { S: id }
      }), {}),
    };

    const resultadosCommand = new QueryCommand(resultadosParams);
    const resultadosResponse = await dynamoDbClient.send(resultadosCommand);
    const resultados = resultadosResponse.Items ? resultadosResponse.Items.map(item => unmarshall(item)) : [];

    // 8. Combinar informações e formatar resultado
    const resultadosFormatados = apostas.map(aposta => {
      const jogo = jogosMap[aposta.jog_id];
      const resultado = resultados.find(r => r.jog_id === aposta.jog_id);

      if (!jogo || !resultado) return null;

      // Calcular acertos
      const numerosApostados = aposta.htc_cotas || [];
      const numerosSorteados = resultado.numeros_sorteados || [];
      const acertos = numerosApostados.filter(num => numerosSorteados.includes(num)).length;

      return {
        jog_id: jogo.jog_id,
        jog_nome: jogo.jog_nome,
        data_sorteio: resultado.data_sorteio || jogo.jog_data_fim,
        numeros_sorteados: numerosSorteados,
        seus_numeros: numerosApostados,
        acertos,
        premio: aposta.htc_premio || 0,
        tipo_jogo: jogo.jog_tipodojogo,
        valor_aposta: aposta.htc_deposito || 0,
      };
    }).filter(Boolean);

    // 9. Ordenar por data mais recente
    resultadosFormatados.sort((a, b) => {
      return new Date(b.data_sorteio) - new Date(a.data_sorteio);
    });

    // 10. Retornar resposta
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
    console.error('Error fetching resultados:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'Tabela ou índice não encontrado' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}