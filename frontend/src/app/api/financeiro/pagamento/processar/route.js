// src/app/api/financeiro/pagamentos/processar/route.js

import { NextResponse } from 'next/server';
import { QueryCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import dynamoDbClient from '../../../../lib/dynamoDbClient';

export async function POST(request) {
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

    // Buscar comissões pendentes
    const queryParams = {
      TableName: 'ComissoesColaboradores',
      IndexName: 'StatusIndex', // Assegure-se que esse GSI existe
      KeyConditionExpression: 'com_status = :status',
      ExpressionAttributeValues: {
        ':status': { S: 'PENDENTE' },
      },
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);
    const comissoesPendentes = queryResult.Items.map(item => unmarshall(item));

    if (comissoesPendentes.length === 0) {
      return NextResponse.json({ message: 'Nenhuma comissão pendente para processar.' }, { status: 200 });
    }

    const pagamentosProcessados = [];

    for (const comissao of comissoesPendentes) {
      // Simular processamento de pagamento (ex: integração com gateway)
      const pagamentoStatus = await processPayment(comissao);

      // Atualizar status da comissão
      const updateParams = {
        TableName: 'ComissoesColaboradores',
        Key: {
          com_id: { S: comissao.com_id },
        },
        UpdateExpression: 'SET com_status = :status',
        ExpressionAttributeValues: {
          ':status': { S: pagamentoStatus },
        },
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      await dynamoDbClient.send(updateCommand);

      // Registrar no histórico de pagamentos
      const historicoPagamento = {
        hp_id: comissao.com_id, // Usando com_id como histórico ID
        com_id: comissao.com_id,
        col_id: comissao.col_id,
        hp_valor: comissao.com_valor,
        hp_status: pagamentoStatus,
        hp_datacriacao: new Date().toISOString(),
      };

      const putHistoricoParams = {
        TableName: 'Pagamentos',
        Item: marshall(historicoPagamento),
      };

      const putHistoricoCommand = new PutItemCommand(putHistoricoParams);
      await dynamoDbClient.send(putHistoricoCommand);

      pagamentosProcessados.push(historicoPagamento);
    }

    return NextResponse.json(
      { message: 'Pagamentos processados com sucesso.', pagamentos: pagamentosProcessados },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar pagamentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Simula o processamento de pagamento para uma comissão.
 * @param {object} comissao - Objeto de comissão.
 * @returns {string} - Status do pagamento ('CONFIRMADO' ou 'FALHA').
 */
async function processPayment(comissao) {
  // Aqui você integraria com um gateway de pagamento real.
  // Para simulação, vamos assumir que 90% dos pagamentos são bem-sucedidos.

  const sucesso = Math.random() < 0.9;
  return sucesso ? 'CONFIRMADO' : 'FALHA';
}
