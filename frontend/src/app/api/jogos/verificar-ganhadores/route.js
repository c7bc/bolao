// Caminho: src\app\api\jogos\verificar-ganhadores\route.js (Linhas: 208)
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
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
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

      // Buscar sorteios do jogo
      const sorteiosParams = {
        TableName: 'Sorteios',
        IndexName: 'jog_id-index',
        KeyConditionExpression: 'jog_id = :jog_id',
        ExpressionAttributeValues: marshall({
          ':jog_id': jog_id,
        }),
        ScanIndexForward: false, // Ordenar do mais recente para o mais antigo
      };

      const sorteiosCommand = new QueryCommand(sorteiosParams);
      const sorteiosResult = await dynamoDbClient.send(sorteiosCommand);
      const sorteios = sorteiosResult.Items.map(item => unmarshall(item));

      if (sorteios.length === 0) {
        console.warn(`Nenhum sorteio encontrado para o jogo ID ${jog_id}.`);
        continue;
      }

      // Considerar apenas o último sorteio
      const ultimoSorteio = sorteios[0];
      const numerosSorteadosArray = ultimoSorteio.numerosArray;

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
        const acertos = calcularAcertos(numerosSorteadosArray, aposta.palpite_numbers);
        if (acertos >= jogo.pontosPorAcerto) {
          ganhadores.push({
            ganhador_id: aposta.cli_id, // Correção: deve ser cli_id do cliente
            jog_id,
            acertos,
            premio: calcularPremio(acertos, jogo.premiation?.pointPrizes || []),
            gan_id: uuidv4(),
            res_id,
            gan_datacriacao: new Date().toISOString(),
          });

          // Atualizar status do jogo para "Encerrado" se necessário
          if (acertos >= jogo.pontosPorAcerto) {
            const updateStatusParams = {
              TableName: 'Jogos',
              Key: marshall({ jog_id }),
              UpdateExpression: 'SET jog_status = :status, jog_datamodificacao = :modificacao',
              ExpressionAttributeValues: marshall({
                ':status': 'encerrado',
                ':modificacao': new Date().toISOString(),
              }),
              ReturnValues: 'ALL_NEW',
            };

            const updateStatusCommand = new UpdateItemCommand(updateStatusParams);
            await dynamoDbClient.send(updateStatusCommand);
          }
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
        Key: marshall({ res_id }),
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
 * Apenas números únicos são considerados.
 * @param {Array} numerosSorteadosArray - Array de números sorteados.
 * @param {string} numerosApostados - Números apostados, separados por vírgula.
 * @returns {number} - Número de acertos.
 */
function calcularAcertos(numerosSorteadosArray, numerosApostados) {
  const sorteadosSet = new Set(numerosSorteadosArray.map(num => num.toString()));
  const apostados = numerosApostados.split(',').map(num => num.trim());
  const apostadosUnicos = new Set(apostados);
  let acertos = 0;
  for (const num of apostadosUnicos) {
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
