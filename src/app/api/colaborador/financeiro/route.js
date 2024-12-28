// Caminho: src/app/api/colaborador/financeiro/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const financeiroTableName = 'Financeiro_Colaborador'; // Verifique o nome da tabela
const pagamentosTableName = 'Pagamentos_Colaborador'; // Verifique o nome da tabela
const jogosTableName = 'Jogos'; // Verifique o nome da tabela

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo');
    const startDate = getStartDateFromPeriodo(periodo);

    // Buscar dados financeiros
    const financialData = await getFinancialData(decodedToken.col_id, startDate);
    const pagamentos = await getPagamentos(decodedToken.col_id);
    const historicoJogos = await getHistoricoJogos(decodedToken.col_id, startDate);

    // Calcular resumo
    const resumo = calculateResumo(financialData, pagamentos);

    return NextResponse.json(
      {
        resumo,
        comissoes: financialData,
        pagamentos,
        historicoJogos,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in financial data fetch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getFinancialData(colaboradorId, startDate) {
  const params = {
    TableName: financeiroTableName,
    IndexName: 'colaborador-data-index', // Verifique se este índice existe
    KeyConditionExpression: 'fic_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
    },
    ScanIndexForward: false,
  };

  if (startDate) {
    params.FilterExpression = 'fic_datacriacao >= :startDate';
    params.ExpressionAttributeValues[':startDate'] = { S: startDate.toISOString() };
  }

  const command = new QueryCommand(params);
  const response = await dynamoDbClient.send(command);
  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}

async function getPagamentos(colaboradorId) {
  const params = {
    TableName: pagamentosTableName,
    FilterExpression: 'pag_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
    },
  };

  const command = new ScanCommand(params);
  const response = await dynamoDbClient.send(command);
  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}

async function getHistoricoJogos(colaboradorId, startDate) {
  const params = {
    TableName: jogosTableName,
    IndexName: 'colaborador-data-index', // Verifique se este índice existe
    KeyConditionExpression: 'col_id = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
    },
    ScanIndexForward: false,
  };

  if (startDate) {
    params.FilterExpression = 'jog_datacriacao >= :startDate';
    params.ExpressionAttributeValues[':startDate'] = { S: startDate.toISOString() };
  }

  const command = new QueryCommand(params);
  const response = await dynamoDbClient.send(command);
  let jogos = response.Items ? response.Items.map(item => unmarshall(item)) : [];

  if (startDate) {
    jogos = jogos.filter(jogo => new Date(jogo.jog_datacriacao) >= startDate);
  }

  return jogos;
}

function calculateResumo(financialData, pagamentos) {
  const totalComissao = financialData.reduce((sum, item) => sum + (parseFloat(item.fic_comissao) || 0), 0);
  const totalPago = pagamentos.reduce(
    (sum, item) => (item.pag_status === 'CONFIRMADO' ? sum + (parseFloat(item.pag_valor) || 0) : sum),
    0
  );
  const totalRecebido = financialData.reduce((sum, item) => sum + (parseFloat(item.fic_deposito_cliente) || 0), 0);
  const comissaoColaborador = financialData.reduce((sum, item) => {
    if (item.fic_status === 'PENDENTE') {
      return sum + (parseFloat(item.fic_comissao) || 0);
    }
    return sum;
  }, 0);

  return {
    totalComissao,
    totalPago,
    totalRecebido,
    comissaoColaborador,
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
