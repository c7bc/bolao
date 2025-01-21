import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
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

    // 1. Buscar todas as premiações ganhas pelo cliente
    const premiacoesParams = {
      TableName: 'Premiacoes',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      })
    };

    const premiacoesCommand = new QueryCommand(premiacoesParams);
    const premiacoesResult = await dynamoDbClient.send(premiacoesCommand);

    const totalGanho = premiacoesResult.Items?.reduce((acc, item) => {
      const premiacao = unmarshall(item);
      return acc + (parseFloat(premiacao.premio) || 0);
    }, 0) || 0;

    // 2. Buscar todas as apostas do cliente
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

    // 3. Coletar IDs únicos dos jogos
    const jogosMap = new Map();
    const apostas = apostasResult.Items?.map(item => unmarshall(item)) || [];

    for (const aposta of apostas) {
      const jogId = aposta.jog_id;
      if (!jogosMap.has(jogId)) {
        const jogoParams = {
          TableName: 'Jogos',
          Key: marshall({ jog_id: jogId })
        };

        try {
          const getJogoCommand = new GetItemCommand(jogoParams);
          const jogoResult = await dynamoDbClient.send(getJogoCommand);

          if (jogoResult.Item) {
            const jogo = unmarshall(jogoResult.Item);
            jogosMap.set(jogId, jogo);
          }
        } catch (error) {
          console.error(`Erro ao buscar jogo ${jogId}:`, error);
        }
      }
    }

    const jogosParticipados = jogosMap.size;
    const jogosAtivos = Array.from(jogosMap.values()).filter(
      jogo => ['aberto', 'ativo'].includes(jogo.jog_status)
    ).length;

    return NextResponse.json({
      totalGanho: parseFloat(totalGanho.toFixed(2)),
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