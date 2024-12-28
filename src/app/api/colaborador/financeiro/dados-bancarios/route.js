// Caminho: src/app/api/colaborador/financeiro/dados-bancarios/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const dadosBancariosTableName = 'DadosBancarios'; // Verifique o nome da tabela

/**
 * Rota GET para buscar dados bancários do colaborador.
 */
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queryParams = {
      TableName: dadosBancariosTableName,
      FilterExpression: 'dba_idcolaborador = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: decodedToken.col_id },
      },
    };

    const command = new ScanCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    if (!response.Items) {
      return NextResponse.json({ dadosBancarios: [] }, { status: 200 });
    }

    const dadosBancarios = response.Items.map(item => unmarshall(item));

    return NextResponse.json({ dadosBancarios }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dados bancarios:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
