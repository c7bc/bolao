// src/app/api/jogos/processar-resultados/route.js

import { NextResponse } from 'next/server';
import { ScanCommand, UpdateItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
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

    // Buscar jogos finalizados e não processados
    const scanParams = {
      TableName: 'Jogos',
      FilterExpression: 'jog_status = :status AND attribute_not_exists(resultado_processado)',
      ExpressionAttributeValues: {
        ':status': { S: 'finalizado' },
      },
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);
    const jogosFinalizados = scanResult.Items.map(item => unmarshall(item));

    if (jogosFinalizados.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo finalizado para processar.' }, { status: 200 });
    }

    // Processar cada jogo finalizado
    const resultados = [];

    for (const jogo of jogosFinalizados) {
      // Simular obtenção de números sorteados
      const numerosSorteados = jogo.jog_numeros_sorteados
        ? jogo.jog_numeros_sorteados.split(',').map(num => num.trim())
        : generateRandomNumbers(jogo.jog_tipodojogo);

      // Criar registro de resultado
      const resultado = {
        res_id: uuidv4(),
        jog_id: jogo.jog_id,
        res_numeros_sorteados: numerosSorteados.join(','),
        res_datacriacao: new Date().toISOString(),
      };

      const putParams = {
        TableName: 'Resultados',
        Item: marshall(resultado),
      };

      const putCommand = new PutItemCommand(putParams);
      await dynamoDbClient.send(putCommand);

      // Marcar jogo como resultado processado
      const updateParams = {
        TableName: 'Jogos',
        Key: {
          jog_id: { S: jogo.jog_id },
        },
        UpdateExpression: 'SET resultado_processado = :processed',
        ExpressionAttributeValues: {
          ':processed': { BOOL: true },
        },
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      await dynamoDbClient.send(updateCommand);

      resultados.push(resultado);
    }

    return NextResponse.json(
      { message: 'Resultados processados com sucesso.', resultados },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar resultados:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Gera números aleatórios baseados no tipo do jogo.
 * @param {string} tipoJogo - Tipo do jogo (e.g., 'MEGA', 'JOGO_DO_BICHO').
 * @returns {Array<string>} - Array de números sorteados.
 */
function generateRandomNumbers(tipoJogo) {
  if (tipoJogo === 'MEGA') {
    // Mega-Sena: 6 números entre 1 e 60
    return generateUniqueRandomNumbers(6, 1, 60);
  } else if (tipoJogo === 'JOGO_DO_BICHO') {
    // Jogo do Bicho: 5 animais (simples exemplo)
    const animais = [
      'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
      'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
      'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
      'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
      'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
    ];
    return shuffleArray(animais).slice(0, 5);
  }
  // Outros tipos de jogos podem ser adicionados aqui
  return [];
}

/**
 * Gera números aleatórios únicos dentro de um intervalo.
 * @param {number} count - Quantidade de números a gerar.
 * @param {number} min - Valor mínimo (inclusive).
 * @param {number} max - Valor máximo (inclusive).
 * @returns {Array<string>} - Array de números como strings.
 */
function generateUniqueRandomNumbers(count, min, max) {
  const numbers = new Set();
  while (numbers.size < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(num.toString());
  }
  return Array.from(numbers);
}

/**
 * Embaralha um array usando o algoritmo de Fisher-Yates.
 * @param {Array} array - Array a ser embaralhado.
 * @returns {Array} - Array embaralhado.
 */
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
