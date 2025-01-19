// /api/cliente/historico/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // 1. Autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'cliente') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const clienteId = decodedToken.cli_id;

    // 2. Buscar apostas do cliente
    const apostasParams = {
      TableName: 'Apostas',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      }, { removeUndefinedValues: true })
    };

    const apostasCommand = new QueryCommand(apostasParams);
    const apostasResult = await dynamoDbClient.send(apostasCommand);
    const apostas = apostasResult.Items || [];

    // 3. Buscar premiações do cliente
    const premiacoesParams = {
      TableName: 'Premiacoes',
      IndexName: 'cli_id-index',
      KeyConditionExpression: 'cli_id = :clienteId',
      ExpressionAttributeValues: marshall({
        ':clienteId': clienteId
      }, { removeUndefinedValues: true })
    };

    const premiacoesCommand = new QueryCommand(premiacoesParams);
    const premiacoesResult = await dynamoDbClient.send(premiacoesCommand);
    const premiacoes = premiacoesResult.Items || [];

    // 4. Coletar IDs únicos dos jogos
    const jogosIds = new Set([
      ...apostas.map(item => unmarshall(item, { removeUndefinedValues: true }).jog_id).filter(Boolean),
      ...premiacoes.map(item => unmarshall(item, { removeUndefinedValues: true }).jog_id).filter(Boolean)
    ]);

    // 5. Buscar detalhes dos jogos em batch
    const jogosDetalhes = {};
    const batchSize = 100;
    const jogosArray = Array.from(jogosIds).filter(Boolean);

    for (let i = 0; i < jogosArray.length; i += batchSize) {
      const batch = jogosArray.slice(i, i + batchSize);
      if (batch.length === 0) continue;

      const batchGetParams = {
        RequestItems: {
          'Jogos': {
            Keys: batch.map(jogId => marshall({ jog_id: jogId }, { removeUndefinedValues: true }))
          }
        }
      };

      try {
        const batchGetCommand = new BatchGetItemCommand(batchGetParams);
        const batchResult = await dynamoDbClient.send(batchGetCommand);
        
        const jogos = (batchResult.Responses?.Jogos || []).map(item => 
          unmarshall(item, { removeUndefinedValues: true })
        );
        
        jogos.forEach(jogo => {
          if (jogo && jogo.jog_id) {
            jogosDetalhes[jogo.jog_id] = jogo;
          }
        });
      } catch (error) {
        console.error('Erro ao buscar detalhes dos jogos:', error);
      }
    }

    // 6. Processar apostas
    const apostasProcessadas = apostas.map(item => {
      const aposta = unmarshall(item, { removeUndefinedValues: true });
      const jogo = jogosDetalhes[aposta.jog_id] || {};
      
      let numerosEscolhidos = [];
      if (aposta.palpite_numbers) {
        if (Array.isArray(aposta.palpite_numbers)) {
          numerosEscolhidos = aposta.palpite_numbers;
        } else if (typeof aposta.palpite_numbers === 'string') {
          numerosEscolhidos = aposta.palpite_numbers.split(',').map(n => n.trim());
        }
      }

      return {
        aposta_id: aposta.aposta_id || null,
        data_criacao: aposta.data_criacao || new Date().toISOString(),
        jogo_nome: jogo.jog_nome || 'Jogo não encontrado',
        numeros_escolhidos: numerosEscolhidos,
        valor: parseFloat(aposta.valor || 0),
        status: aposta.status || jogo.jog_status || 'pendente',
        data_aposta: aposta.data_criacao || null
      };
    }).filter(Boolean);

    // 7. Processar premiações
    const premiacoesProcessadas = premiacoes.map(item => {
      const premiacao = unmarshall(item, { removeUndefinedValues: true });
      const jogo = jogosDetalhes[premiacao.jog_id] || {};
      
      return {
        premiacao_id: premiacao.premiacao_id || null,
        data_criacao: premiacao.data_criacao || new Date().toISOString(),
        jogo_nome: jogo.jog_nome || 'Jogo não encontrado',
        premio: parseFloat(premiacao.premio || 0),
        pago: Boolean(premiacao.pago),
        data_pagamento: premiacao.data_pagamento || null,
        categoria: premiacao.categoria || 'Não especificada'
      };
    }).filter(Boolean);

    // 8. Processar jogos participados
    const jogosParticipados = Array.from(jogosIds)
      .filter(Boolean)
      .map(jogId => {
        const jogo = jogosDetalhes[jogId] || {};
        return {
          jog_id: jogId,
          jog_nome: jogo.jog_nome || 'Nome não disponível',
          data_inicio: jogo.data_inicio || null,
          data_fim: jogo.data_fim || null,
          status: jogo.jog_status || 'pendente',
          resultado: jogo.resultado || 'Em andamento'
        };
      })
      .filter(Boolean);

    // 9. Ordenar resultados por data (mais recentes primeiro)
    apostasProcessadas.sort((a, b) => 
      new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0)
    );
    
    premiacoesProcessadas.sort((a, b) => 
      new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0)
    );
    
    jogosParticipados.sort((a, b) => {
      const dataA = a.data_inicio ? new Date(a.data_inicio) : new Date(0);
      const dataB = b.data_inicio ? new Date(b.data_inicio) : new Date(0);
      return dataB - dataA;
    });

    return NextResponse.json({
      apostas: apostasProcessadas,
      premiacoes: premiacoesProcessadas,
      jogosParticipados
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}