// src/app/api/admin/list/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

// Inicialize o cliente DynamoDB com variáveis de ambiente
const dynamoDbClient = new DynamoDBClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  });

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: 'Authorization header missing.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Token missing.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    const { role } = decodedToken;
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    // Configurar os parâmetros para escanear a tabela Admin
    const params = {
      TableName: 'Admin',
      // Projeção para excluir campos sensíveis, como senhas
      ProjectionExpression: 'adm_id, adm_nome, adm_email, adm_status, adm_role, adm_datacriacao',
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    const admins = result.Items.map(item => unmarshall(item));

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
