import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

const ganhadoresTableName = 'Ganhadores';

/**
 * Handler GET - Buscar ganhadores de um jogo específico.
 */
export async function GET(request, { params }) {
  const { jogo_id } = params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query para buscar ganhadores do jogo
    const queryParams = {
      TableName: ganhadoresTableName,
      IndexName: 'jog_id-index', // Assegure-se que este índice existe
      KeyConditionExpression: 'jog_id = :jogId',
      ExpressionAttributeValues: {
        ':jogId': { S: jogo_id },
      },
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);

    const ganhadores = response.Items.map(item => unmarshall(item));

    // Agrupar ganhadores por categoria
    const ganhadoresPorCategoria = ganhadores.map(ganhador => ({
      ganhador_id: ganhador.ganhador_id,
      nome: ganhador.nome, // Certifique-se de que o nome está disponível
      categoria: ganhador.acertos >= 10 ? '10 Pontos' :
                 ganhador.acertos === 9 ? '9 Pontos' : 'Menos Pontos',
      acertos: ganhador.acertos,
      premio: ganhador.premio,
    }));

    return NextResponse.json({ ganhadores: ganhadoresPorCategoria }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar ganhadores:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
