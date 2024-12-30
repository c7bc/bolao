// Caminho: src/app/api/cliente/dashboard/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializa o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Buscar dados para o Dashboard do Cliente
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

    // 1. Buscar jogos ativos
    const jogosAtivosParams = {
      TableName: 'Apostas',
      IndexName: 'cliente-id-index', // Nome correto do GSI
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
        ':ativo': { S: 'ativo' }, // Definido corretamente
      },
      FilterExpression: 'jog_status = :ativo',
      ScanIndexForward: false, // Ordenar do mais recente para o mais antigo
    };

    const jogosAtivosCommand = new QueryCommand(jogosAtivosParams);
    const jogosAtivosResult = await dynamoDbClient.send(jogosAtivosCommand);
    const jogosAtivos = jogosAtivosResult.Items.map(item => unmarshall(item));

    // 2. Buscar jogos finalizados
    const jogosFinalizadosParams = {
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

    const jogosFinalizadosCommand = new QueryCommand(jogosFinalizadosParams);
    const jogosFinalizadosResult = await dynamoDbClient.send(jogosFinalizadosCommand);
    const jogosFinalizados = jogosFinalizadosResult.Items.map(item => unmarshall(item));

    // 3. Calcular saldo financeiro e ganhos
    const movimentacoesParams = {
      TableName: 'HistoricoCliente',
      IndexName: 'cliente-id-index', // Assegure-se que este índice existe na tabela 'HistoricoCliente'
      KeyConditionExpression: 'cli_id = :cli_id',
      ExpressionAttributeValues: {
        ':cli_id': { S: cli_id },
      },
      ScanIndexForward: false, // Ordenar do mais recente para o mais antigo
    };

    const movimentacoesCommand = new QueryCommand(movimentacoesParams);
    const movimentacoesResult = await dynamoDbClient.send(movimentacoesCommand);
    const movimentacoes = movimentacoesResult.Items.map(item => unmarshall(item));

    let saldo = 0;
    let ganhos = 0;

    movimentacoes.forEach(mov => {
      if (mov.tipo === 'compra') {
        saldo -= parseFloat(mov.valor);
      } else if (mov.tipo === 'ganho') {
        saldo += parseFloat(mov.valor);
        ganhos += parseFloat(mov.valor);
      }
    });

    // 4. Preparar resposta
    const dashboardData = {
      jogosAtivos: jogosAtivos.length,
      jogosFinalizados: jogosFinalizados.length,
      saldoFinanceiro: saldo, // Número
      ganhos: ganhos, // Número
    };

    return NextResponse.json({ dashboard: dashboardData }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard do cliente:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
