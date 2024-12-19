// src/app/api/colaborador/financeiro/export/route.js

import { NextResponse } from 'next/server';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import dynamoDbClient from '../../../../lib/dynamoDbClient';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const financialData = await getFinancialData(decodedToken.col_id);
    const csvContent = convertToCSV(financialData);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=relatorio-financeiro.csv'
      }
    });
  } catch (error) {
    console.error('Error exporting financial data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Converte dados financeiros para formato CSV.
 * @param {Array} data - Dados financeiros.
 * @returns {string} - Conteúdo CSV.
 */
function convertToCSV(data) {
  const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Status'];
  const rows = data.map(item => [
    new Date(item.fic_datacriacao).toLocaleDateString(),
    item.fic_descricao,
    item.fic_comissao,
    item.fic_tipocomissao,
    item.fic_status
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

/**
 * Busca dados financeiros do colaborador.
 * @param {string} colaboradorId - ID do colaborador.
 * @returns {Array} - Dados financeiros.
 */
async function getFinancialData(colaboradorId) {
  const command = new QueryCommand({
    TableName: 'Financeiro_Colaborador',
    IndexName: 'colaborador-commission-index',
    KeyConditionExpression: 'fic_idcolaborador = :id',
    ExpressionAttributeValues: {
      ':id': { S: colaboradorId },
    },
    ScanIndexForward: false,
  });

  const response = await dynamoDbClient.send(command);
  return response.Items.map(item => unmarshall(item));
}
