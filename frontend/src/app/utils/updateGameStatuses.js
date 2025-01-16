// src/utils/updateGameStatuses.js

import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Atualiza o status dos jogos com base nas condições especificadas.
 */
export async function updateGameStatuses() {
  try {
    // 1. Atualizar jogos para 'fechado' se a data_fim chegou
    const now = new Date().toISOString();

    const scanParams = {
      TableName: 'Jogos',
      FilterExpression: 'jog_status = :status_aberto AND data_fim <= :now',
      ExpressionAttributeValues: marshall({
        ':status_aberto': 'aberto',
        ':now': now,
      }),
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);
    const jogosParaFechar = scanResult.Items.map(item => unmarshall(item));

    for (const jogo of jogosParaFechar) {
      const updateParams = {
        TableName: 'Jogos',
        Key: marshall({ jog_id: jogo.jog_id }),
        UpdateExpression: 'SET jog_status = :novo_status, updated_at = :atualizado_em',
        ExpressionAttributeValues: marshall({
          ':novo_status': 'fechado',
          ':atualizado_em': new Date().toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      await dynamoDbClient.send(updateCommand);

      console.log(`Jogo ${jogo.jog_id} atualizado para status 'fechado'.`);
    }

    // 2. Atualizar jogos para 'encerrado' se houver ganhadores com 10 pontos
    const scanEncerrarParams = {
      TableName: 'Jogos',
      FilterExpression: 'jog_status = :status_fechado',
      ExpressionAttributeValues: marshall({
        ':status_fechado': 'fechado',
      }),
    };

    const scanEncerrarCommand = new ScanCommand(scanEncerrarParams);
    const scanEncerrarResult = await dynamoDbClient.send(scanEncerrarCommand);
    const jogosParaEncerrar = scanEncerrarResult.Items.map(item => unmarshall(item));

    for (const jogo of jogosParaEncerrar) {
      // Verificar se há ganhadores com 10 pontos
      const ganhadoresParams = {
        TableName: 'Ganhadores',
        IndexName: 'jog_id-index', // Assegure-se que este índice existe
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: {
          ':jogId': { S: jogo.jog_id },
        },
      };

      const ganhadoresCommand = new QueryCommand(ganhadoresParams);
      const ganhadoresResult = await dynamoDbClient.send(ganhadoresCommand);
      const ganhadores = ganhadoresResult.Items.map(item => unmarshall(item));

      const temGanhador10 = ganhadores.some(ganhador => ganhador.acertos >= 10);

      if (temGanhador10) {
        const updateParams = {
          TableName: 'Jogos',
          Key: marshall({ jog_id: jogo.jog_id }),
          UpdateExpression: 'SET jog_status = :novo_status, updated_at = :atualizado_em',
          ExpressionAttributeValues: marshall({
            ':novo_status': 'encerrado',
            ':atualizado_em': new Date().toISOString(),
          }),
          ReturnValues: 'ALL_NEW',
        };

        const updateCommand = new UpdateItemCommand(updateParams);
        await dynamoDbClient.send(updateCommand);

        console.log(`Jogo ${jogo.jog_id} atualizado para status 'encerrado'.`);

        // Registrar ganhadores e finalizar o bolão
        // Implementar lógica adicional conforme necessário
      } else {
        // Se não há ganhador com 10 pontos, gerar números automaticamente até encontrar
        // Implementar a lógica de sorteio automático
        // Pode ser chamada uma função de sorteio aqui
        console.log(`Jogo ${jogo.jog_id} não possui ganhador com 10 pontos. Iniciando sorteio automático.`);
        // Exemplo: await sorteioAutomatico(jogo);
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar status dos jogos:', error);
  }
}
