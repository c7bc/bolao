// /api/cliente/apostas/ativas/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

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

    const params = {
      TableName: 'Apostas',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      FilterExpression: 'aposta_status = :status',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId,
        ':status': 'ativo'
      }, { removeUndefinedValues: true })
    };

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);
    const apostas = result.Items.map(item => unmarshall(item));

    // Buscar informações dos jogos relacionados
    const jogosIds = new Set(apostas.map(a => a.jog_id));
    const jogosDetalhes = {};

    for (const jogId of jogosIds) {
      const jogoParams = {
        TableName: 'Jogos',
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: marshall({
          ':jogId': jogId
        }, { removeUndefinedValues: true })
      };

      const jogoCommand = new QueryCommand(jogoParams);
      const jogoResult = await dynamoDbClient.send(jogoCommand);
      if (jogoResult.Items && jogoResult.Items.length > 0) {
        const jogo = unmarshall(jogoResult.Items[0]);
        jogosDetalhes[jogId] = jogo;
      }
    }

    // Enriquecer as apostas com informações dos jogos
    const apostasProcessadas = apostas.map(aposta => ({
      ...aposta,
      jogo_nome: jogosDetalhes[aposta.jog_id]?.jog_nome || 'Jogo não encontrado',
      jogo_status: jogosDetalhes[aposta.jog_id]?.jog_status || 'indefinido',
      palpite_numbers: Array.isArray(aposta.palpite_numbers) 
        ? aposta.palpite_numbers 
        : (typeof aposta.palpite_numbers === 'string'
            ? aposta.palpite_numbers.split(',').map(n => n.trim())
            : [])
    }));

    return NextResponse.json({ 
      apostas: apostasProcessadas 
    });
  } catch (error) {
    console.error('Erro ao buscar apostas ativas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}