import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST() {
  try {
    // Buscar todos os jogos
    const scanParams = {
      TableName: 'Jogos',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    if (!scanResult.Items || scanResult.Items.length === 0) {
      return NextResponse.json({ error: 'Nenhum jogo encontrado.' }, { status: 404 });
    }

    const agora = new Date();

    // Iterar sobre os jogos e verificar necessidade de atualização
    for (const item of scanResult.Items) {
      const jogo = unmarshall(item);
      let novoStatus = jogo.jog_status;
      const dataFim = jogo.data_fim ? new Date(jogo.data_fim) : null;

      // Lógica para atualização do status
      if (jogo.jog_status === 'aberto') {
        if (dataFim && agora >= dataFim) {
          novoStatus = 'fechado';
        }
      }

      // Atualizar o status apenas se necessário
      if (novoStatus !== jogo.jog_status) {
        const updateParams = {
          TableName: 'Jogos',
          Key: marshall({ jog_id: jogo.jog_id }),
          UpdateExpression: 'set jog_status = :novoStatus, jog_datamodificacao = :modificacao',
          ExpressionAttributeValues: marshall({
            ':novoStatus': novoStatus,
            ':modificacao': agora.toISOString(),
          }),
        };

        const updateCommand = new UpdateItemCommand(updateParams);
        await dynamoDbClient.send(updateCommand);
      }
    }

    return NextResponse.json({ message: 'Status dos jogos atualizados com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar a requisição.' }, { status: 400 });
  }
}
