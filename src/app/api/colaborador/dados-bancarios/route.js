// src/app/api/colaborador/dados-bancarios/route.js
import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const command = new GetItemCommand({
      TableName: 'Dados_Bancarios',
      Key: {
        dba_idcolaborador: { S: decodedToken.col_id }
      }
    });

    const response = await dynamoDbClient.send(command);
    const dadosBancarios = response.Item ? unmarshall(response.Item) : {};

    return NextResponse.json({ dadosBancarios }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dados bancarios:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dadosBancarios = await request.json();
    const command = new PutItemCommand({
      TableName: 'Dados_Bancarios',
      Item: marshall({
        dba_idcolaborador: decodedToken.col_id,
        ...dadosBancarios,
        dba_dataupdate: new Date().toISOString()
      })
    });

    await dynamoDbClient.send(command);
    return NextResponse.json({ message: 'Dados bancários atualizados com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Error updating dados bancarios:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function getStartDateFromPeriodo(periodo) {
  const now = new Date();
  switch (periodo) {
    case 'hoje': return new Date(now.setHours(0, 0, 0, 0));
    case 'semana': return new Date(now.setDate(now.getDate() - 7));
    case 'mes': return new Date(now.setMonth(now.getMonth() - 1));
    case 'trimestre': return new Date(now.setMonth(now.getMonth() - 3));
    case 'ano': return new Date(now.getFullYear(), 0, 1);
    default: return null;
  }
}