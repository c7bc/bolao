// src/app/api/jogos/verificar-ganhadores/route.js

import { NextResponse } from 'next/server';
import { ScanCommand, QueryCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dynamoDbClient from '../../../lib/dynamoDbClient';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar resultados finalizados e não verificados
    const resultadosParams = {
      TableName: 'Resultados',
      FilterExpression: 'attribute_exists(res_numeros_sorteados) AND attribute_not_exists(ganhadores_verificados)',
    };

    const resultadosCommand = new ScanCommand(resultadosParams);
    const resultadosScan = await dynamoDbClient.send(resultadosCommand);
    const resultadosPendentes = resultadosScan.Items.map(item => unmarshall(item));

    if (resultadosPendentes.length === 0) {
      return NextResponse.json({ message: 'Nenhum resultado pendente para verificar ganhadores.' }, { status: 200 });
    }

    const ganhadoresVerificados = [];

    for (const resultado of resultadosPendentes) {
      const { res_id, jog_id, res_numeros_sorteados } = resultado;

      // Buscar jogo correspondente usando QueryCommand com GSI 'jog_id-index'
      const jogoParams = {
        TableName: 'Jogos',
        IndexName: 'jog_id-index',
        KeyConditionExpression: 'jog_id = :jog_id',
        ExpressionAttributeValues: marshall({
          ':jog_id': jog_id,
        }),
      };

      const jogoCommand = new QueryCommand(jogoParams);
      const jogoResult = await dynamoDbClient.send(jogoCommand);

      if (jogoResult.Items.length === 0) {
        console.warn(`Jogo com ID ${jog_id} não encontrado.`);
        continue;
      }

      const jogo = unmarshall(jogoResult.Items[0]);

      // Buscar apostas do jogo
      const apostasParams = {
        TableName: 'Apostas',
        IndexName: 'jog_id-index',
        KeyConditionExpression: 'jog_id = :jog_id',
        ExpressionAttributeValues: marshall({
          ':jog_id': jog_id,
        }),
      };

      const apostasCommand = new QueryCommand(apostasParams);
      const apostasResult = await dynamoDbClient.send(apostasCommand);
      const apostas = apostasResult.Items.map(item => unmarshall(item));

      const ganhadores = [];

      for (const aposta of apostas) {
        const acertos = calcularAcertos(jogo.res_numeros_sorteados, aposta.aposta_numeros);
        if (acertos >= jogo.pontosPorAcerto) {
          ganhadores.push({
            ganhador_id: aposta.aposta_cliente_id,
            jog_id,
            acertos,
            premio: calcularPremio(acertos, jogo.premiation?.pointPrizes || []),
            gan_id: uuidv4(),
            res_id,
            gan_datacriacao: new Date().toISOString(),
          });
        }
      }

      // Inserir ganhadores na tabela 'Ganhadores'
      for (const ganhador of ganhadores) {
        const putGanhadorParams = {
          TableName: 'Ganhadores',
          Item: marshall(ganhador),
        };

        const putGanhadorCommand = new PutItemCommand(putGanhadorParams);
        await dynamoDbClient.send(putGanhadorCommand);
      }

      // Marcar resultado como ganhadores_verificados
      const updateResultadoParams = {
        TableName: 'Resultados',
        Key: marshall({ res_id: res_id }),
        UpdateExpression: 'SET ganhadores_verificados = :verified',
        ExpressionAttributeValues: marshall({
          ':verified': true,
        }),
      };

      const updateResultadoCommand = new UpdateItemCommand(updateResultadoParams);
      await dynamoDbClient.send(updateResultadoCommand);

      ganhadoresVerificados.push({
        res_id,
        ganhadores,
      });
    }

    return NextResponse.json(
      { message: 'Ganhadores verificados com sucesso.', ganhadoresVerificados },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao verificar ganhadores:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Calcula o número de acertos entre os números sorteados e os escolhidos na aposta.
 * @param {string} numerosSorteados - Números sorteados, separados por vírgula.
 * @param {string} numerosApostados - Números apostados, separados por vírgula.
 * @returns {number} - Número de acertos.
 */
function calcularAcertos(numerosSorteados, numerosApostados) {
  const sorteadosSet = new Set(numerosSorteados.split(',').map(num => num.trim()));
  const apostados = numerosApostados.split(',').map(num => num.trim());
  let acertos = 0;
  for (const num of apostados) {
    if (sorteadosSet.has(num)) {
      acertos += 1;
    }
  }
  return acertos;
}

/**
 * Calcula o prêmio baseado nos acertos e nas premiações definidas.
 * @param {number} acertos - Número de acertos.
 * @param {Array} pointPrizes - Array de objetos com pontos e prêmio.
 * @returns {number} - Valor do prêmio para o ganhador.
 */
function calcularPremio(acertos, pointPrizes) {
  const prize = pointPrizes.find(prize => prize.pontos === acertos);
  return prize ? parseFloat(prize.premio) : 0;
}
