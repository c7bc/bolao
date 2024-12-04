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

const tableName = 'Cliente';

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 400 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scanParams = {
      TableName: tableName,
      FilterExpression: 'cli_idcolaborador = :colaboradorId',
      ExpressionAttributeValues: {
        ':colaboradorId': { S: decodedToken.col_id },
      },
    };

    const command = new ScanCommand(scanParams);
    const response = await dynamoDbClient.send(command);

    if (response.Items && Array.isArray(response.Items) && response.Items.length > 0) {
      const clientes = response.Items.map((item) => unmarshall(item));
      return NextResponse.json({ clientes }, { status: 200 });
    } else {
      return NextResponse.json({ clientes: [] }, { status: 200 });
    }
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}