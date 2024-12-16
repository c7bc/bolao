// src/app/api/financeiro/calcular-comissoes/route.js

import { NextResponse } from 'next/server';
import { ScanCommand, PutItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
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

    // Buscar resultados processados que ainda não tiveram comissão calculada
    const scanParams = {
      TableName: 'Resultados',
      FilterExpression: 'attribute_exists(res_numeros_sorteados) AND attribute_not_exists(comissao_calculada)',
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);
    const resultadosPendentes = scanResult.Items.map(item => unmarshall(item));

    if (resultadosPendentes.length === 0) {
      return NextResponse.json({ message: 'Nenhuma comissão a calcular.' }, { status: 200 });
    }

    const comissoesCalculadas = [];

    for (const resultado of resultadosPendentes) {
      const { res_id, jog_id, res_numeros_sorteados } = resultado;

      // Buscar jogo correspondente
      const jogoParams = {
        TableName: 'Jogos',
        KeyConditionExpression: 'jog_id = :jog_id',
        ExpressionAttributeValues: {
          ':jog_id': { S: jog_id },
        },
      };

      const jogoCommand = new QueryCommand(jogoParams);
      const jogoResult = await dynamoDbClient.send(jogoCommand);
      if (jogoResult.Items.length === 0) {
        console.warn(`Jogo com ID ${jog_id} não encontrado.`);
        continue;
      }

      const jogo = unmarshall(jogoResult.Items[0]);

      // Definir a regra de comissão (exemplo: 10% do valor do jogo)
      const comissaoPercentual = 0.10;
      const valorComissao = parseFloat(jogo.jog_valorjogo) * comissaoPercentual;

      // Buscar colaborador associado ao jogo
      const col_id = jogo.col_id;

      if (!col_id) {
        console.warn(`Jogo com ID ${jog_id} não tem um colaborador associado.`);
        continue;
      }

      // Criar comissão
      const comissao = {
        com_id: uuidv4(),
        res_id,
        jog_id,
        col_id,
        com_valor: valorComissao.toFixed(2),
        com_datacriacao: new Date().toISOString(),
        com_status: 'PENDENTE', // Status inicial
      };

      // Inserir comissão na tabela
      const putComissaoParams = {
        TableName: 'ComissoesColaboradores',
        Item: marshall(comissao),
      };

      const putComissaoCommand = new PutItemCommand(putComissaoParams);
      await dynamoDbClient.send(putComissaoCommand);

      // Marcar resultado como comissao_calculada
      const updateResultadoParams = {
        TableName: 'Resultados',
        Key: {
          res_id: { S: res_id },
        },
        UpdateExpression: 'SET comissao_calculada = :calculated',
        ExpressionAttributeValues: {
          ':calculated': { BOOL: true },
        },
      };

      const updateResultadoCommand = new UpdateItemCommand(updateResultadoParams);
      await dynamoDbClient.send(updateResultadoCommand);

      comissoesCalculadas.push(comissao);
    }

    return NextResponse.json(
      { message: 'Comissões calculadas com sucesso.', comissoes: comissoesCalculadas },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao calcular comissões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
