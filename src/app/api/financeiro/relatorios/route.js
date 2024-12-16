// src/app/api/financeiro/relatorios/route.js

import { NextResponse } from 'next/server';
import { ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dynamoDbClient from '../../../lib/dynamoDbClient';

export async function GET(request) {
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

    // Parâmetros de consulta (opcional: filtro por período)
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo'); // e.g., 'hoje', 'semana', 'mes', 'ano'

    let startDate = getStartDateFromPeriodo(periodo);

    // Buscar recebidos
    const recebidosParams = {
      TableName: 'Pagamentos',
      FilterExpression: 'hd_status = :status_recebido',
      ExpressionAttributeValues: {
        ':status_recebido': { S: 'RECEBIDO' },
      },
    };

    if (startDate) {
      recebidosParams.FilterExpression += ' AND hd_datacriacao >= :startDate';
      recebidosParams.ExpressionAttributeValues[':startDate'] = { S: startDate.toISOString() };
    }

    const recebidosCommand = new ScanCommand(recebidosParams);
    const recebidosResult = await dynamoDbClient.send(recebidosCommand);
    const recebidos = recebidosResult.Items.map(item => unmarshall(item));

    // Buscar comissões pagas
    const comissoesParams = {
      TableName: 'ComissoesColaboradores',
      FilterExpression: 'com_status = :status_pago',
      ExpressionAttributeValues: {
        ':status_pago': { S: 'CONFIRMADO' },
      },
    };

    if (startDate) {
      comissoesParams.FilterExpression += ' AND com_datacriacao >= :startDate';
      comissoesParams.ExpressionAttributeValues[':startDate'] = { S: startDate.toISOString() };
    }

    const comissoesCommand = new ScanCommand(comissoesParams);
    const comissoesResult = await dynamoDbClient.send(comissoesCommand);
    const comissoesPagas = comissoesResult.Items.map(item => unmarshall(item));

    // Buscar pagamentos de prêmios
    const pagamentosParams = {
      TableName: 'Pagamentos',
      FilterExpression: 'pag_status = :status_pago',
      ExpressionAttributeValues: {
        ':status_pago': { S: 'DISTRIBUIDO' },
      },
    };

    if (startDate) {
      pagamentosParams.FilterExpression += ' AND pag_datacriacao >= :startDate';
      pagamentosParams.ExpressionAttributeValues[':startDate'] = { S: startDate.toISOString() };
    }

    const pagamentosCommand = new ScanCommand(pagamentosParams);
    const pagamentosResult = await dynamoDbClient.send(pagamentosCommand);
    const pagamentosDistribuidos = pagamentosResult.Items.map(item => unmarshall(item));

    // Aggregar dados
    const totalRecebido = recebidos.reduce((sum, item) => sum + parseFloat(item.hd_valor || 0), 0);
    const totalComissaoPagas = comissoesPagas.reduce((sum, item) => sum + parseFloat(item.com_valor || 0), 0);
    const totalPrêmiosDistribuidos = pagamentosDistribuidos.reduce((sum, item) => sum + parseFloat(item.pag_valor || 0), 0);

    const relatorio = {
      totalRecebido,
      totalComissaoPagas,
      totalPrêmiosDistribuidos,
      detalhamento: {
        recebidos,
        comissoesPagas,
        pagamentosDistribuidos,
      },
    };

    return NextResponse.json({ relatorio }, { status: 200 });
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Calcula a data de início com base no período.
 * @param {string|null} periodo - 'hoje', 'semana', 'mes', 'ano'
 * @returns {Date|null} - Data de início ou null se período não especificado.
 */
function getStartDateFromPeriodo(periodo) {
  if (!periodo) return null;
  const now = new Date();
  switch (periodo.toLowerCase()) {
    case 'hoje':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'semana':
      return new Date(now.setDate(now.getDate() - 7));
    case 'mes':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'ano':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return null;
  }
}
