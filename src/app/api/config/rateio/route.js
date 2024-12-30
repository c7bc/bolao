// src/app/api/config/rateio/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// GET - Obter configurações de rateio
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scanParams = {
      TableName: 'Rateio',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    if (scanResult.Items.length === 0) {
      return NextResponse.json({ rateio: {} }, { status: 200 });
    }

    const rateio = unmarshall(scanResult.Items[0]);

    return NextResponse.json({ rateio }, { status: 200 });
  } catch (error) {
    console.error('Error fetching rateio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Atualizar configurações de rateio
export async function PUT(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { rateio } = await request.json();

    // Validar que a soma das porcentagens seja 100
    const total = Object.values(rateio).reduce((acc, val) => acc + val, 0);
    if (total !== 100) {
      return NextResponse.json({ error: 'A soma das porcentagens deve ser 100.' }, { status: 400 });
    }

    // Buscar se já existe um rateio configurado
    const scanParams = {
      TableName: 'Rateio',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    if (scanResult.Items.length > 0) {
      // Atualizar o primeiro rateio encontrado
      const existingRateio = unmarshall(scanResult.Items[0]);
      const updateParams = {
        TableName: 'Rateio',
        Key: marshall({ rateio_id: existingRateio.rateio_id }),
        UpdateExpression: 'SET #pr = :pr, #sr = :sr, #ca = :ca, #cc = :cc',
        ExpressionAttributeNames: {
          '#pr': 'premio_principal',
          '#sr': 'segundo_premio',
          '#ca': 'custos_administrativos',
          '#cc': 'comissao_colaboradores',
        },
        ExpressionAttributeValues: {
          ':pr': { N: rateio.premio_principal.toString() },
          ':sr': { N: rateio.segundo_premio.toString() },
          ':ca': { N: rateio.custos_administrativos.toString() },
          ':cc': { N: rateio.comissao_colaboradores.toString() },
        },
        ReturnValues: 'ALL_NEW',
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      await dynamoDbClient.send(updateCommand);
    } else {
      // Criar um novo rateio
      const newRateio = {
        rateio_id: uuidv4(),
        premio_principal: rateio.premio_principal,
        segundo_premio: rateio.segundo_premio,
        custos_administrativos: rateio.custos_administrativos,
        comissao_colaboradores: rateio.comissao_colaboradores,
      };

      const putParams = {
        TableName: 'Rateio',
        Item: marshall(newRateio),
      };

      const putCommand = new PutItemCommand(putParams);
      await dynamoDbClient.send(putCommand);
    }

    return NextResponse.json({ message: 'Configurações de rateio atualizadas com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating rateio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
