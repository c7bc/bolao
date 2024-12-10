// src/app/api/pagamentos/webhook/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

export async function POST(request) {
  try {
    const evento = await request.json();

    console.log('Recebido evento do Mercado Pago:', evento);

    const { id: payment_id, status, transaction_amount, payer } = evento;

    // Atualizar a transação no DynamoDB
    const updateTransacaoParams = {
      TableName: 'Transacoes',
      Key: marshall({ tra_id: payment_id }),
      UpdateExpression: 'SET tra_status = :status',
      ExpressionAttributeValues: marshall({
        ':status': status,
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateTransacaoCommand = new UpdateItemCommand(updateTransacaoParams);
    await dynamoDbClient.send(updateTransacaoCommand);

    console.log(`Transação ${payment_id} atualizada para status ${status}.`);

    // Opcional: Processar ações adicionais conforme o status
    // Por exemplo, se status === 'approved', chamar a rota de confirmação de pagamento internamente

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
