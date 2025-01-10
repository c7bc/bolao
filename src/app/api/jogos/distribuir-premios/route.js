// src/app/api/jogos/distribuir-premios/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dynamoDbClient from '../../../lib/dynamoDbClient';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar ganhadores pendentes de distribuição usando ScanCommand
    const ganhadoresParams = {
      TableName: 'Ganhadores',
      FilterExpression: 'attribute_not_exists(ganha_distribuida)',
    };

    const ganhadoresCommand = new ScanCommand(ganhadoresParams);
    const ganhadoresResult = await dynamoDbClient.send(ganhadoresCommand);
    const ganhadoresPendentes = ganhadoresResult.Items.map(item => unmarshall(item));

    if (ganhadoresPendentes.length === 0) {
      return NextResponse.json({ message: 'Nenhum prêmio pendente para distribuir.' }, { status: 200 });
    }

    const premiosDistribuidos = [];

    for (const ganhador of ganhadoresPendentes) {
      // Simular distribuição de prêmio (pode ser via API de pagamento real)
      const distribuido = await distribuirPremio(ganhador);

      // Atualizar status da distribuição
      const updateParams = {
        TableName: 'Ganhadores',
        Key: marshall({ gan_id: ganhador.gan_id }),
        UpdateExpression: 'SET ganha_distribuida = :distribuida',
        ExpressionAttributeValues: marshall({
          ':distribuida': distribuido,
        }),
      };

      const updateCommand = new UpdateItemCommand(updateParams);
      await dynamoDbClient.send(updateCommand);

      // Registrar a distribuição no histórico de pagamentos
      if (distribuido) {
        const historicoDistribuicao = {
          hd_id: uuidv4(),
          gan_id: ganhador.gan_id,
          col_id: ganhador.ganhador_id,
          hd_valor: ganhador.premio,
          hd_status: 'DISTRIBUIDO',
          hd_datacriacao: new Date().toISOString(),
        };

        const putHistoricoParams = {
          TableName: 'Pagamentos',
          Item: marshall(historicoDistribuicao),
        };

        const putHistoricoCommand = new PutItemCommand(putHistoricoParams);
        await dynamoDbClient.send(putHistoricoCommand);

        premiosDistribuidos.push(historicoDistribuicao);
      }
    }

    return NextResponse.json(
      { message: 'Prêmios distribuídos com sucesso.', distribuicoes: premiosDistribuidos },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao distribuir prêmios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Simula a distribuição de um prêmio.
 * @param {object} ganhador - Objeto de ganhador.
 * @returns {boolean} - True se distribuído com sucesso, false caso contrário.
 */
async function distribuirPremio(ganhador) {
  // Aqui você integraria com um serviço de pagamento real
  // Para simulação, vamos assumir que a distribuição é sempre bem-sucedida
  return true;
}
