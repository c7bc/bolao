// src/app/api/financeiro/resumo/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
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
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalRecebidoCommand = new ScanCommand({
      TableName: 'Pagamentos',
      ProjectionExpression: 'valor',
    });
    const totalComissaoCommand = new ScanCommand({
      TableName: 'ComissoesColaboradores',
      ProjectionExpression: 'valor',
    });
    const totalPagoCommand = new ScanCommand({
      TableName: 'Pagamentos',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': { S: 'pago' } },
      ProjectionExpression: 'valor',
    });

    const [totalRecebidoResult, totalComissaoResult, totalPagoResult] = await Promise.all([
      dynamoDbClient.send(totalRecebidoCommand),
      dynamoDbClient.send(totalComissaoCommand),
      dynamoDbClient.send(totalPagoCommand),
    ]);

    const totalRecebido = totalRecebidoResult.Items.reduce((acc, item) => acc + parseFloat(unmarshall(item).valor), 0);
    const totalComissaoColaborador = totalComissaoResult.Items.reduce((acc, item) => acc + parseFloat(unmarshall(item).valor), 0);
    const totalPago = totalPagoResult.Items.reduce((acc, item) => acc + parseFloat(unmarshall(item).valor), 0);

    return NextResponse.json({ totalRecebido, totalComissaoColaborador, totalPago }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resumo financeiro:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
