// Caminho: src/app/api/colaborador/financeiro/resumo/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto

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

/**
 * Função para obter pagamentos do colaborador.
 * @param {string} col_id - ID do colaborador.
 * @returns {Array} - Lista de pagamentos.
 */
async function getPagamentos(col_id) {
  const scanParams = {
    TableName: pagamentosTableName,
    FilterExpression: 'pag_idcolaborador = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: col_id },
    },
  };

  const command = new ScanCommand(scanParams);
  const response = await dynamoDbClient.send(command);
  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}

/**
 * Função para obter jogos do colaborador.
 * @param {string} col_id - ID do colaborador.
 * @returns {Array} - Lista de jogos.
 */
async function getJogos(col_id) {
  const queryParams = {
    TableName: jogosTableName,
    IndexName: 'colaborador-jogos-index', // Verifique se o índice existe
    KeyConditionExpression: 'col_id = :colId',
    ExpressionAttributeValues: {
      ':colId': { S: col_id },
    },
  };

  const command = new QueryCommand(queryParams);
  const response = await dynamoDbClient.send(command);
  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}

/**
 * Rota GET para obter resumo financeiro do colaborador.
 */
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const col_id = decodedToken.col_id;

    // Obter pagamentos
    const pagamentos = await getPagamentos(col_id);

    // Calcular resumos
    const totalComissao = pagamentos.reduce((sum, pag) => sum + parseFloat(pag.valor || 0), 0);
    const totalPago = pagamentos.reduce(
      (sum, pag) => (pag.status === 'CONFIRMADO' ? sum + parseFloat(pag.valor || 0) : sum),
      0
    );
    const totalRecebido = pagamentos.reduce((sum, pag) => sum + parseFloat(pag.valorRecebido || 0), 0);
    const comissaoColaborador = pagamentos.find(pag => pag.col_id === col_id)?.valor || 0;

    const resumo = {
      totalComissao,
      totalPago,
      totalRecebido,
      comissaoColaborador,
    };

    return NextResponse.json({ resumo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resumo financeiro:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
