import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

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
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    // Modificar esta linha para incluir admin também
    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
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

export async function PUT(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    // Modificar esta linha também para incluir admin
    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { rateio } = await request.json();

    const total = Object.values(rateio).reduce((acc, val) => acc + val, 0);
    if (total !== 100) {
      return NextResponse.json({ error: 'A soma das porcentagens deve ser 100.' }, { status: 400 });
    }

    const params = {
      TableName: 'Rateio',
      Item: marshall({
        rateio_id: 'default',
        ...rateio,
        updated_at: new Date().toISOString(),
      }),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ message: 'Configurações de rateio atualizadas com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating rateio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}