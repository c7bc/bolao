// src/app/api/sistema/pontuacao/route.js

import { NextResponse } from 'next/server';
import { QueryCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dynamoDbClient from '../../../lib/dynamoDbClient';

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

    // Buscar todos os jogos finalizados
    const jogosParams = {
      TableName: 'Jogos',
      FilterExpression: 'jog_status = :status',
      ExpressionAttributeValues: {
        ':status': { S: 'finalizado' },
      },
    };

    const jogosCommand = new QueryCommand(jogosParams);
    const jogosResult = await dynamoDbClient.send(jogosCommand);
    const jogosFinalizados = jogosResult.Items.map(item => unmarshall(item));

    if (jogosFinalizados.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo finalizado para processar pontuação.' }, { status: 200 });
    }

    const pontuacoesAtualizadas = [];

    for (const jogo of jogosFinalizados) {
      // Buscar apostas relacionadas ao jogo
      const apostasParams = {
        TableName: 'Apostas',
        IndexName: 'jog_id-index',
        KeyConditionExpression: 'jog_id = :jogId',
        ExpressionAttributeValues: {
          ':jogId': { S: jogo.jog_id },
        },
      };

      const apostasCommand = new QueryCommand(apostasParams);
      const apostasResult = await dynamoDbClient.send(apostasCommand);
      const apostas = apostasResult.Items.map(item => unmarshall(item));

      for (const aposta of apostas) {
        // Calcular pontos com base na quantidade de acertos
        const acertos = calcularAcertos(jogo.jog_numeros_sorteados, aposta.aposta_numeros);
        const pontos = calcularPontos(acertos);

        // Atualizar pontuação do cliente
        const updateParams = {
          TableName: 'Cliente',
          Key: {
            cli_id: { S: aposta.aposta_cliente_id },
          },
          UpdateExpression: 'ADD cli_pontos = :pontos',
          ExpressionAttributeValues: {
            ':pontos': { N: pontos.toString() },
          },
          ReturnValues: 'UPDATED_NEW',
        };

        const updateCommand = new UpdateItemCommand(updateParams);
        const updateResult = await dynamoDbClient.send(updateCommand);
        const clienteAtualizado = unmarshall(updateResult.Attributes);

        pontuacoesAtualizadas.push({
          cliente_id: aposta.aposta_cliente_id,
          pontos_adicionados: pontos,
          pontos_totais: clienteAtualizado.cli_pontos,
        });
      }

      // Marcar jogo como pontuado
      const marcarPontuadoParams = {
        TableName: 'Jogos',
        Key: {
          jog_id: { S: jogo.jog_id },
        },
        UpdateExpression: 'SET pontuado = :pontuado',
        ExpressionAttributeValues: {
          ':pontuado': { BOOL: true },
        },
      };

      const marcarPontuadoCommand = new UpdateItemCommand(marcarPontuadoParams);
      await dynamoDbClient.send(marcarPontuadoCommand);
    }

    return NextResponse.json(
      { message: 'Pontuações atualizadas com sucesso.', pontuacoes: pontuacoesAtualizadas },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar pontuações:', error);
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
 * Calcula pontos com base nos acertos.
 * @param {number} acertos - Número de acertos.
 * @returns {number} - Pontos a serem adicionados.
 */
function calcularPontos(acertos) {
  // Exemplo de regra de pontuação
  switch (acertos) {
    case 6:
      return 100;
    case 5:
      return 50;
    case 4:
      return 20;
    case 3:
      return 10;
    default:
      return 0;
  }
}
