// Caminho: src/app/api/colaborador/resultados/ganhadores/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const jogosTableName = 'Jogos'; // Verifique o nome da tabela
const resultadosTableName = 'Resultados'; // Verifique o nome da tabela
const ganhadoresTableName = 'Ganhadores'; // Verifique o nome da tabela
const clienteTableName = 'Cliente'; // Verifique o nome da tabela
const jogosIndexName = 'colaborador-jogos-index'; // Verifique o nome do índice

/**
 * Rota GET para buscar ganhadores dos jogos de um colaborador.
 */
export async function GET(request) {
  try {
    // Verificação de autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const col_id = decodedToken.col_id;

    // Buscar jogos do colaborador
    const jogosParams = {
      TableName: jogosTableName,
      IndexName: jogosIndexName, // Certifique-se de que este índice exista
      KeyConditionExpression: 'col_id = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: col_id },
      },
    };

    const jogosCommand = new QueryCommand(jogosParams);
    const jogosResult = await dynamoDbClient.send(jogosCommand);
    const jogos = jogosResult.Items ? jogosResult.Items.map(item => unmarshall(item)) : [];

    if (jogos.length === 0) {
      return NextResponse.json({
        message: 'Nenhum jogo encontrado.',
        ganhadores: [],
      }, { status: 200 });
    }

    const jogosIds = jogos.map(jogo => jogo.jog_id);

    // Buscar resultados dos jogos
    const resultados = [];
    for (const jog_id of jogosIds) {
      const resultadosParams = {
        TableName: resultadosTableName,
        IndexName: 'jog_id-index', // Verifique se este índice existe
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: {
          ':jogId': { S: jog_id },
        },
      };

      const resultadosCommand = new QueryCommand(resultadosParams);
      const resultadosResponse = await dynamoDbClient.send(resultadosCommand);
      if (resultadosResponse.Items) {
        resultados.push(...resultadosResponse.Items.map(item => unmarshall(item)));
      }
    }

    if (resultados.length === 0) {
      return NextResponse.json({
        message: 'Nenhum resultado encontrado.',
        ganhadores: [],
      }, { status: 200 });
    }

    // Buscar ganhadores
    const ganhadores = [];
    for (const resultado of resultados) {
      const ganhadoresParams = {
        TableName: ganhadoresTableName,
        FilterExpression: 'resultado_id = :resultadoId',
        ExpressionAttributeValues: {
          ':resultadoId': { S: resultado.resultado_id },
        },
      };

      const ganhadoresCommand = new ScanCommand(ganhadoresParams);
      const ganhadoresResponse = await dynamoDbClient.send(ganhadoresCommand);
      if (ganhadoresResponse.Items) {
        ganhadores.push(...ganhadoresResponse.Items.map(item => unmarshall(item)));
      }
    }

    if (ganhadores.length === 0) {
      return NextResponse.json({
        message: 'Nenhum ganhador encontrado.',
        ganhadores: [],
      }, { status: 200 });
    }

    // Buscar informações dos clientes ganhadores
    const clientesIds = [...new Set(ganhadores.map(g => g.cli_id))];
    let clientes = [];

    if (clientesIds.length > 0) {
      const clientesParams = {
        RequestItems: {
          [clienteTableName]: {
            Keys: clientesIds.map(id => ({
              cli_id: { S: id },
            })),
          },
        },
      };

      const batchGetCommand = new BatchGetItemCommand(clientesParams);
      const clientesResult = await dynamoDbClient.send(batchGetCommand);
      clientes = clientesResult.Responses?.[clienteTableName]
        ? clientesResult.Responses[clienteTableName].map(item => unmarshall(item))
        : [];
    }

    // Criar mapa de clientes para facilitar o acesso
    const clientesMap = clientes.reduce((acc, cliente) => {
      acc[cliente.cli_id] = cliente;
      return acc;
    }, {});

    // Combinar todas as informações
    const ganhadoresCompletos = ganhadores.map(ganhador => {
      const resultado = resultados.find(r => r.resultado_id === ganhador.resultado_id);
      const cliente = clientesMap[ganhador.cli_id];

      return {
        ...ganhador,
        jogo_nome: jogos.find(j => j.jog_id === resultado.jog_id)?.jog_nome || 'Jogo não encontrado',
        numeros_sorteados: resultado?.numeros || 'Não disponível',
        cliente_nome: cliente?.cli_nome || 'Cliente não encontrado',
        cliente_email: cliente?.cli_email || 'Email não disponível',
        data_sorteio: resultado?.data_sorteio || 'Data não disponível',
      };
    });

    // Agrupar por jogo
    const ganhadoresPorJogo = ganhadoresCompletos.reduce((acc, ganhador) => {
      if (!acc[ganhador.jog_id]) {
        acc[ganhador.jog_id] = {
          jogo_nome: ganhador.jogo_nome,
          total_ganhadores: 0,
          premio_total: 0,
          ganhadores: [],
        };
      }

      acc[ganhador.jog_id].total_ganhadores++;
      acc[ganhador.jog_id].premio_total += parseFloat(ganhador.premio || 0);
      acc[ganhador.jog_id].ganhadores.push({
        nome: ganhador.cliente_nome,
        email: ganhador.cliente_email,
        acertos: ganhador.acertos,
        premio: parseFloat(ganhador.premio || 0),
        data_sorteio: ganhador.data_sorteio,
      });

      return acc;
    }, {});

    return NextResponse.json({
      ganhadores_por_jogo: ganhadoresPorJogo,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar ganhadores:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
