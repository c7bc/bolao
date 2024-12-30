// src/app/api/sorteio/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../utils/auth';
import { calcularPremio } from '../../utils/calculos';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler POST - Realiza o sorteio de números para jogos com status "fechado".
 */
export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar jogos com status "fechado"
    const scanParams = {
      TableName: 'Jogos',
      FilterExpression: 'jog_status = :status',
      ExpressionAttributeValues: marshall({
        ':status': 'fechado',
      }),
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    const jogosFechados = scanResult.Items.map(item => unmarshall(item));

    if (jogosFechados.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo com status "fechado" encontrado.' }, { status: 200 });
    }

    for (const jogo of jogosFechados) {
      // Gerar números sorteados
      const numerosSorteados = gerarNumerosAleatorios(jogo.jog_tipodojogo);

      // Atualizar jogo para status "encerrado" e adicionar números sorteados
      const updateParams = {
        TableName: 'Jogos',
        Key: marshall({ jog_id: jogo.jog_id }),
        UpdateExpression: 'SET jog_status = :status, jog_numeros_sorteados = :numeros_sorteados, jog_dataupdate = :dataupdate',
        ExpressionAttributeValues: marshall({
          ':status': 'encerrado',
          ':numeros_sorteados': numerosSorteados.join(','),
          ':dataupdate': new Date().toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      const updateResult = await dynamoDbClient.send(updateCommand);

      const jogoAtualizado = unmarshall(updateResult.Attributes);

      // Calcular prêmio baseado nas configurações
      const premioCalculado = calcularPremio(jogoAtualizado.jog_valorpremio, jogoAtualizado.jog_valorjogo, jogoAtualizado.jog_quantidade_maxima);

      // Atualizar o valor do prêmio no jogo
      const updatePremioParams = {
        TableName: 'Jogos',
        Key: marshall({ jog_id: jogo.jog_id }),
        UpdateExpression: 'SET jog_valorpremio = :premio',
        ExpressionAttributeValues: marshall({
          ':premio': premioCalculado,
        }),
        ReturnValues: 'UPDATED_NEW',
      };

      const updatePremioCommand = new UpdateItemCommand(updatePremioParams);
      await dynamoDbClient.send(updatePremioCommand);

      // Registrar o resultado
      const resultado_id = uuidv4();
      const novoResultado = {
        res_id: resultado_id,
        jog_id: jogo.jog_id,
        res_numeros_sorteados: numerosSorteados.join(','),
        ganhadores_verificados: false,
      };

      const putResultadoParams = {
        TableName: 'Resultados',
        Item: marshall(novoResultado),
      };

      const putResultadoCommand = new PutItemCommand(putResultadoParams);
      await dynamoDbClient.send(putResultadoCommand);
    }

    return NextResponse.json({ message: 'Sorteios realizados com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error performing sorteio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Gera números aleatórios baseados no tipo de jogo.
 * @param {string} tipo_jogo
 * @returns {Array<number|string>}
 */
function gerarNumerosAleatorios(tipo_jogo) {
  if (tipo_jogo === 'JOGO_DO_BICHO') {
    const animais = [
      'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
      'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
      'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
      'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
      'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
    ];
    const sorteados = [];
    while (sorteados.length < 5) { // Número de animais a serem sorteados
      const animal = animais[Math.floor(Math.random() * animais.length)];
      if (!sorteados.includes(animal)) {
        sorteados.push(animal);
      }
    }
    return sorteados;
  } else {
    const totalNumeros = tipo_jogo === 'MEGA' ? 6 : tipo_jogo === 'LOTOFACIL' ? 15 : 6;
    const numeros = new Set();
    while (numeros.size < totalNumeros) {
      numeros.add(Math.floor(Math.random() * 60) + 1);
    }
    return Array.from(numeros);
  }
}
