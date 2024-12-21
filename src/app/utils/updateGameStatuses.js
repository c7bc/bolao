import { DynamoDBClient, ScanCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Inicialize o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Atualiza os status dos jogos com base nas regras definidas.
 */
export const updateGameStatuses = async () => {
  try {
    // Parâmetros para escanear todos os jogos
    const scanParams = {
      TableName: 'Jogos',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);
    const jogos = scanResult.Items.map(item => unmarshall(item));

    const currentDate = new Date();

    for (const jogo of jogos) {
      let newStatus = jogo.jog_status; // Status atual

      // Converter datas para objetos Date
      const dataInicio = new Date(jogo.jog_data_inicio);
      const dataFim = new Date(jogo.jog_data_fim);

      // Regras para atualizar o status
      if (currentDate < dataInicio) {
        newStatus = 'open';
      } else if (currentDate >= dataInicio && currentDate <= dataFim) {
        newStatus = 'open';
      } else if (currentDate > dataFim && newStatus === 'open') {
        newStatus = 'closed';
      }

      // Verificar se há vencedores que completaram 10 pontos
      if (newStatus === 'closed') {
        const verificaVencedorParams = {
          TableName: 'HistoricoCliente',
          IndexName: 'jogo-slug-index',
          KeyConditionExpression: 'htc_idjogo = :jogo_slug',
          ExpressionAttributeValues: {
            ':jogo_slug': { S: jogo.slug },
          },
        };

        const verificaVencedorCommand = new QueryCommand(verificaVencedorParams);
        const vencedorResult = await dynamoDbClient.send(verificaVencedorCommand);

        if (vencedorResult.Items && vencedorResult.Items.length > 0) {
          const apostas = vencedorResult.Items.map(item => unmarshall(item));
          const temVencedor = apostas.reduce((hasWinner, aposta) => {
            return hasWinner || (aposta.htc_pontos && aposta.htc_pontos >= 10);
          }, false);

          if (temVencedor) {
            newStatus = 'ended';
          }
        }
      }

      // Atualizar o status se houver alteração
      if (newStatus !== jogo.jog_status) {
        const updateParams = {
          TableName: 'Jogos',
          Key: {
            jog_id: { S: jogo.jog_id },
          },
          UpdateExpression: 'SET jog_status = :status',
          ExpressionAttributeValues: {
            ':status': { S: newStatus },
          },
        };

        const updateCommand = new UpdateItemCommand(updateParams);
        await dynamoDbClient.send(updateCommand);

        console.log(`Jogo "${jogo.jog_nome}" atualizado para status: ${newStatus}`);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};