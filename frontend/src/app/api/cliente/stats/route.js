// /api/cliente/dashboard/stats/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const clienteId = decodedToken.cli_id;

    // 1. Calcular total ganho (premios pagos)
    const premiacoesParams = {
      TableName: 'Premiacoes',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      FilterExpression: 'pago = :pago',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId,
        ':pago': true
      })
    };

    const premiacoesCommand = new QueryCommand(premiacoesParams);
    const premiacoesResult = await dynamoDbClient.send(premiacoesCommand);
    const totalGanho = premiacoesResult.Items.reduce((acc, item) => {
      const premiacao = unmarshall(item);
      return acc + (premiacao.premio || 0);
    }, 0);

    // 2. Buscar total de jogos participados
    const apostasParams = {
      TableName: 'Apostas',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      })
    };

    const apostasCommand = new QueryCommand(apostasParams);
    const apostasResult = await dynamoDbClient.send(apostasCommand);
    
    // Contar jogos únicos
    const jogosUnicos = new Set(
      apostasResult.Items.map(item => unmarshall(item).jog_id)
    );
    const jogosParticipados = jogosUnicos.size;

    // 3. Buscar jogos ativos
    const apostasAtivasParams = {
      TableName: 'Apostas',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      FilterExpression: 'status = :status',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId,
        ':status': 'ativo'
      })
    };

    const apostasAtivasCommand = new QueryCommand(apostasAtivasParams);
    const apostasAtivasResult = await dynamoDbClient.send(apostasAtivasCommand);
    
    // Contar jogos ativos únicos
    const jogosAtivosUnicos = new Set(
      apostasAtivasResult.Items.map(item => unmarshall(item).jog_id)
    );
    const jogosAtivos = jogosAtivosUnicos.size;

    return NextResponse.json({
      totalGanho,
      jogosParticipados,
      jogosAtivos
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}