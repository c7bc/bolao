// src/utils/calculos.js

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Calcula o prêmio baseado nas configurações de rateio.
 * @param {number} valorEstimado
 * @param {number} valorTicket
 * @param {number} totalCotasVendidas
 * @returns {number}
 */
export async function calcularPremio(valorEstimado, valorTicket, totalCotasVendidas) {
  // Obter configurações de rateio
  const getParams = {
    TableName: 'Configuracoes',
    Key: {
      conf_nome: { S: 'rateio' },
    },
  };

  const getCommand = new GetItemCommand(getParams);
  const getResult = await dynamoDbClient.send(getCommand);

  if (!getResult.Item) {
    throw new Error('Configurações de rateio não encontradas.');
  }

  const rateio = unmarshall(getResult.Item);

  const totalArrecadado = valorTicket * totalCotasVendidas;

  const premioPrincipal = (totalArrecadado * rateio.premio_principal) / 100;
  const segundoPremio = (totalArrecadado * rateio.segundo_premio) / 100;
  const custosAdministrativos = (totalArrecadado * rateio.custos_administrativos) / 100;
  const comissaoColaboradores = (totalArrecadado * rateio.comissao_colaboradores) / 100;

  // Você pode ajustar as regras conforme necessário
  return premioPrincipal;
}
