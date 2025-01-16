// src/utils/sorteioAutomatico.js

import { DynamoDBClient, UpdateItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Função para realizar sorteio automático até encontrar um ganhador com 10 pontos.
 * @param {object} jogo - Objeto do jogo.
 */
export async function sorteioAutomatico(jogo) {
  try {
    let vencedorEncontrado = false;
    let numerosSorteados;

    while (!vencedorEncontrado) {
      // Gerar números automaticamente
      numerosSorteados = gerarNumeros(jogo.total_drawn_numbers, jogo.min_digits, jogo.max_digits);

      // Atualizar os números sorteados no jogo
      const updateJogoParams = {
        TableName: 'Jogos',
        Key: marshall({ jog_id: jogo.jog_id }),
        UpdateExpression: 'SET numeros_sorteados = :numeros_sorteados, updated_at = :atualizado_em',
        ExpressionAttributeValues: marshall({
          ':numeros_sorteados': numerosSorteados.join(','),
          ':atualizado_em': new Date().toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      const updateJogoCommand = new UpdateItemCommand(updateJogoParams);
      const updateJogoResult = await dynamoDbClient.send(updateJogoCommand);
      const jogoAtualizado = unmarshall(updateJogoResult.Attributes);

      // Verificar ganhadores com 10 pontos
      const ganhadoresParams = {
        TableName: 'Apostas',
        IndexName: 'jog_id-index',
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: {
          ':jogId': { S: jogo.jog_id },
        },
      };

      const ganhadoresCommand = new QueryCommand(ganhadoresParams);
      const ganhadoresResult = await dynamoDbClient.send(ganhadoresCommand);
      const apostas = ganhadoresResult.Items.map(item => unmarshall(item));

      for (const aposta of apostas) {
        const acertos = calcularAcertos(numerosSorteados, aposta.numeros_escolhidos);
        if (acertos >= 10) {
          // Encontrou um ganhador
          vencedorEncontrado = true;

          // Registrar ganhador
          const ganhador = {
            ganhador_id: uuidv4(),
            resultado_id: uuidv4(), // Gerar ID do resultado
            jog_id: jogo.jog_id,
            cli_id: aposta.cli_id,
            acertos,
            premio: calcularPremio(jogo, acertos),
            data_processamento: new Date().toISOString(),
          };

          const putGanhadorParams = {
            TableName: 'Ganhadores',
            Item: marshall(ganhador),
          };

          const putGanhadorCommand = new PutItemCommand(putGanhadorParams);
          await dynamoDbClient.send(putGanhadorCommand);

          // Atualizar status do jogo para 'encerrado'
          const updateStatusParams = {
            TableName: 'Jogos',
            Key: marshall({ jog_id: jogo.jog_id }),
            UpdateExpression: 'SET jog_status = :status, updated_at = :atualizado_em',
            ExpressionAttributeValues: marshall({
              ':status': 'encerrado',
              ':atualizado_em': new Date().toISOString(),
            }),
            ReturnValues: 'ALL_NEW',
          };

          const updateStatusCommand = new UpdateItemCommand(updateStatusParams);
          await dynamoDbClient.send(updateStatusCommand);

          console.log(`Ganhador encontrado: ${ganhador.cli_id} com ${acertos} pontos.`);
          break;
        }
      }

      if (!vencedorEncontrado) {
        console.log(`Nenhum ganhador encontrado no sorteio. Gerando novos números...`);
        // Continue o loop para gerar novos números
      }
    }
  } catch (error) {
    console.error('Erro durante o sorteio automático:', error);
  }
}

/**
 * Gera números aleatórios baseados nas configurações do jogo.
 * @param {number} total - Total de números a serem sorteados.
 * @param {number} minDigit - Dígito mínimo.
 * @param {number} maxDigit - Dígito máximo.
 * @returns {Array} - Array de números sorteados.
 */
function gerarNumeros(total, minDigit, maxDigit) {
  const numeros = new Set();
  while (numeros.size < total) {
    const num = Math.floor(Math.random() * (maxDigit - minDigit + 1)) + minDigit;
    numeros.add(num);
  }
  return Array.from(numeros);
}

/**
 * Calcula o número de acertos entre os números sorteados e os escolhidos na aposta.
 * @param {Array} numerosSorteados - Array de números sorteados.
 * @param {Array} numerosEscolhidos - Array de números escolhidos na aposta.
 * @returns {number} - Número de acertos.
 */
function calcularAcertos(numerosSorteados, numerosEscolhidos) {
  const sorteadosSet = new Set(numerosSorteados);
  const acertos = numerosEscolhidos.filter(num => sorteadosSet.has(num)).length;
  return acertos;
}

/**
 * Calcula o prêmio baseado nos acertos e nas configurações do jogo.
 * @param {object} jogo - Objeto do jogo.
 * @param {number} acertos - Número de acertos.
 * @returns {number} - Valor do prêmio.
 */
function calcularPremio(jogo, acertos) {
  // Implementar lógica de cálculo do prêmio com base nas configurações do tipo de jogo
  // Exemplo simplificado:
  if (acertos >= 10) return jogo.points_for_10 * jogo.ticket_price;
  if (acertos === 9) return jogo.points_for_9 * jogo.ticket_price;
  return 0;
}
