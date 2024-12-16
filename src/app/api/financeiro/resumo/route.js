// src/app/api/financeiro/resumo/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION, // Certifique-se de que a região está correta
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // Autenticação e Autorização
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parâmetros do Scan para a tabela Financeiro
    const command = new ScanCommand({
      TableName: 'Financeiro', // Nome correto da tabela
      ProjectionExpression: 'financeiroId, tipo, valor',
      Limit: 100, // Limite para evitar scans muito grandes
      // Adicione filtros ou ordenação conforme necessário
    });

    // Execução do Scan
    const result = await dynamoDbClient.send(command);

    // Conversão dos itens
    const financeiro = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    // Cálculos para resumo financeiro
    const totalRecebido = financeiro
      .filter(item => item.tipo === 'recebido')
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const totalComissaoColaborador = financeiro
      .filter(item => item.tipo === 'comissao_colaborador')
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const totalPago = financeiro
      .filter(item => item.tipo === 'pago')
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const taxaConversao = 0; // Ajuste conforme a lógica desejada

    // Retorno da resposta
    return NextResponse.json({
      totalRecebido,
      totalComissaoColaborador,
      totalPago,
      taxaConversao,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching financeiro resumo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
