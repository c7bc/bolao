// src/app/api/colaborador/financeiro/resumo/route.js

import { NextResponse } from 'next/server';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import dynamoDbClient from '../../../../lib/dynamoDbClient';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [comissoes, pagamentos] = await Promise.all([
      getComissoes(decodedToken.col_id),
      getPagamentos(decodedToken.col_id)
    ]);

    const resumo = {
      totalRecebido: comissoes.reduce((sum, item) => sum + (item.fic_deposito_cliente || 0), 0),
      comissaoColaborador: comissoes.reduce((sum, item) => item.fic_status === 'PENDENTE' ? sum + (item.fic_comissao || 0) : sum, 0),
      totalComissao: comissoes.reduce((sum, item) => sum + (item.fic_comissao || 0), 0),
      totalPago: pagamentos.reduce((sum, item) => sum + (item.pag_valor || 0), 0),
    };

    return NextResponse.json({ resumo }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Busca comissões do colaborador.
 * @param {string} colaboradorId - ID do colaborador.
 * @returns {Array} - Lista de comissões.
 */
async function getComissoes(colaboradorId) {
  const command = new QueryCommand({
    TableName: 'Financeiro_Colaborador',
    IndexName: 'colaborador-commission-index',
    KeyConditionExpression: 'fic_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
    },
  });

  const response = await dynamoDbClient.send(command);
  return response.Items.map(item => unmarshall(item));
}

/**
 * Busca pagamentos do colaborador.
 * @param {string} colaboradorId - ID do colaborador.
 * @returns {Array} - Lista de pagamentos.
 */
async function getPagamentos(colaboradorId) {
  const command = new QueryCommand({
    TableName: 'Pagamentos_Colaborador',
    IndexName: 'colaborador-index',
    KeyConditionExpression: 'pag_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: colaboradorId },
    }
  });

  const response = await dynamoDbClient.send(command);
  return response.Items.map(item => unmarshall(item));
}
