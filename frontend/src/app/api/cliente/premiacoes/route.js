// /api/cliente/premiacoes/route.js
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

    const params = {
      TableName: 'Premiacoes',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      }, { removeUndefinedValues: true })
    };

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);
    const premiacoes = result.Items.map(item => unmarshall(item));

    // Buscar informações dos jogos relacionados
    const jogosIds = new Set(premiacoes.map(p => p.jog_id));
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

    // Enriquecer as premiações com informações dos jogos
    const premiacoesProcessadas = premiacoes.map(premiacao => ({
      ...premiacao,
      jogo_nome: jogosDetalhes[premiacao.jog_id]?.jog_nome || 'Jogo não encontrado',
      jogo_status: jogosDetalhes[premiacao.jog_id]?.jog_status || 'indefinido'
    }));

    return NextResponse.json({ 
      premiacoes: premiacoesProcessadas 
    });
  } catch (error) {
    console.error('Erro ao buscar premiações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}