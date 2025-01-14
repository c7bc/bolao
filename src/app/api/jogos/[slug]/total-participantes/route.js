import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request, context) {
  try {
    const { slug } = await context.params;

    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const jogoCommand = new QueryCommand(queryParams);
    const jogoResult = await dynamoDbClient.send(jogoCommand);

    if (!jogoResult.Items || jogoResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(jogoResult.Items[0]);

    const apostasParams = {
      TableName: 'Apostas',
      IndexName: 'jog_id-index',
      KeyConditionExpression: 'jog_id = :jog_id',
      ExpressionAttributeValues: marshall({
        ':jog_id': jogo.jog_id,
      }),
    };

    const apostasCommand = new QueryCommand(apostasParams);
    const apostasResult = await dynamoDbClient.send(apostasCommand);

    const totalParticipantes = apostasResult.Items ? apostasResult.Items.length : 0;

    return NextResponse.json({
      jog_id: jogo.jog_id,
      slug: jogo.slug,
      totalParticipantes,
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar total de participantes:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}