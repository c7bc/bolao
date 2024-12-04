// src/app/api/colaborador/financeiro/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
    region: 'sa-east-1',
    credentials: {
      accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
      secretAccessKey: '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',
    },
  });

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');
    const startDate = getStartDateFromPeriodo(periodo);

    // Query financial data
    const financialData = await getFinancialData(decodedToken.col_id, startDate);
    const pagamentos = await getPagamentos(decodedToken.col_id);
    const historicoJogos = await getHistoricoJogos(decodedToken.col_id, startDate);

    // Calculate summary
    const resumo = calculateResumo(financialData, pagamentos);

    return NextResponse.json({
      resumo,
      comissoes: financialData,
      pagamentos,
      historicoJogos
    }, { status: 200 });
  } catch (error) {
    console.error('Error in financial data fetch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getFinancialData(colaboradorId, startDate) {
  const params = {
    TableName: 'Financeiro_Colaborador',
    IndexName: 'colaborador-data-index',
    KeyConditionExpression: 'fic_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
      ...(startDate && { ':startDate': { S: startDate.toISOString() } })
    },
    ...(startDate && {
      FilterExpression: 'fic_datacriacao >= :startDate'
    })
  };

  const command = new QueryCommand(params);
  const response = await dynamoDbClient.send(command);
  return response.Items.map(item => unmarshall(item));
}

async function getPagamentos(colaboradorId) {
  const params = {
    TableName: 'Pagamentos_Colaborador',
    IndexName: 'colaborador-index',
    KeyConditionExpression: 'pag_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId }
    }
  };

  const command = new QueryCommand(params);
  const response = await dynamoDbClient.send(command);
  return response.Items.map(item => unmarshall(item));
}

async function getHistoricoJogos(colaboradorId, startDate) {
  const params = {
    TableName: 'Jogos',
    IndexName: 'colaborador-data-index',
    KeyConditionExpression: 'jog_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
      ...(startDate && { ':startDate': { S: startDate.toISOString() } })
    },
    ...(startDate && {
      FilterExpression: 'jog_datacriacao >= :startDate'
    })
  };

  const command = new QueryCommand(params);
  const response = await dynamoDbClient.send(command);
  return response.Items.map(item => unmarshall(item));
}

function calculateResumo(financialData, pagamentos) {
  return {
    totalComissao: financialData.reduce((sum, item) => sum + (item.fic_comissao || 0), 0),
    totalPago: pagamentos.reduce((sum, item) => sum + (item.pag_valor || 0), 0),
    totalRecebido: financialData.reduce((sum, item) => sum + (item.fic_deposito_cliente || 0), 0),
    comissaoColaborador: financialData.reduce((sum, item) => {
      if (item.fic_status === 'PENDENTE') {
        return sum + (item.fic_comissao || 0);
      }
      return sum;
    }, 0)
  };
}

function getStartDateFromPeriodo(periodo) {
  const now = new Date();
  switch (periodo) {
    case 'hoje':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'semana':
      return new Date(now.setDate(now.getDate() - 7));
    case 'mes':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'trimestre':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'ano':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}