// src/app/api/cliente/historico/route.js

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
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Buscar histórico de jogos
    const jogosParams = {
      TableName: 'HistoricoCliente',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'htc_idcliente = :clienteId',
      ExpressionAttributeValues: {
        ':clienteId': { S: decodedToken.cli_id },
      },
      ScanIndexForward: false,
    };

    const jogosCommand = new QueryCommand(jogosParams);
    const jogosResponse = await dynamoDbClient.send(jogosCommand);
    const historicoJogos = jogosResponse.Items.map(item => unmarshall(item));

    // 2. Buscar informações financeiras
    const financeiroParams = {
      TableName: 'Financeiro_Cliente',
      IndexName: 'cliente-id-index',
      KeyConditionExpression: 'fcl_idcliente = :clienteId',
      ExpressionAttributeValues: {
        ':clienteId': { S: decodedToken.cli_id },
      },
      ScanIndexForward: false,
    };

    const financeiroCommand = new QueryCommand(financeiroParams);
    const financeiroResponse = await dynamoDbClient.send(financeiroCommand);
    const historicoFinanceiro = financeiroResponse.Items.map(item => unmarshall(item));

    // 3. Buscar detalhes dos jogos para resultados
    const jogoIds = [...new Set(historicoJogos.map(h => h.htc_idjogo))];
    
    if (jogoIds.length > 0) {
      const batchGetParams = {
        RequestItems: {
          'Jogos': {
            Keys: jogoIds.map(id => ({
              jog_id: { S: id }
            }))
          }
        }
      };

      const batchGetCommand = new BatchGetItemCommand(batchGetParams);
      const jogosDetalhes = await dynamoDbClient.send(batchGetCommand);
      const jogosInfo = jogosDetalhes.Responses.Jogos.map(item => unmarshall(item));

      // 4. Processar resultados
      const resultados = historicoJogos.map(historico => {
        const jogoInfo = jogosInfo.find(j => j.jog_id === historico.htc_idjogo);
        if (!jogoInfo || jogoInfo.jog_status !== 'finalizado') return null;

        const numerosEscolhidos = Array.from({ length: 10 }, (_, i) => historico[`htc_cota${i + 1}`])
          .filter(Boolean);

        const acertos = numerosEscolhidos.filter(num => 
          jogoInfo.jog_numeros_sorteados?.includes(num)
        ).length;

        const premio = jogoInfo.jog_ganhadores?.find(g => 
          g.cliente_id === decodedToken.cli_id
        )?.valor || 0;

        return {
          id: historico.htc_id,
          jogo_nome: jogoInfo.jog_nome,
          data_sorteio: jogoInfo.jog_data_sorteio,
          numeros_sorteados: jogoInfo.jog_numeros_sorteados || [],
          seus_numeros: numerosEscolhidos,
          acertos,
          premio
        };
      }).filter(Boolean);

      return NextResponse.json({
        historicoJogos,
        historicoFinanceiro,
        resultados
      }, { status: 200 });
    }

    // Caso não tenha jogos, retorna listas vazias
    return NextResponse.json({
      historicoJogos: [],
      historicoFinanceiro: [],
      resultados: []
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching cliente history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// API para baixar comprovante
export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { historico_id } = await request.json();

    // Buscar detalhes do histórico específico
    const params = {
      TableName: 'HistoricoCliente',
      Key: {
        htc_id: { S: historico_id }
      }
    };

    const command = new QueryCommand(params);
    const response = await dynamoDbClient.send(command);
    const historico = unmarshall(response.Items[0]);

    // Verificar se o histórico pertence ao cliente
    if (historico.htc_idcliente !== decodedToken.cli_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Retornar URL do comprovante
    if (historico.htc_comprovante_url) {
      return NextResponse.json({ 
        comprovante_url: historico.htc_comprovante_url 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Comprovante não encontrado' 
    }, { status: 404 });

  } catch (error) {
    console.error('Error downloading receipt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}