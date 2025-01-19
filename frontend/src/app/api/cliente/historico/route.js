import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
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
    // Authentication
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

    // Fetch all games
    const jogos = await getAllJogos();

    // Fetch all bets for all games
    const allApostas = await getAllApostas();

    // Fetch all prizes for all games
    const allPremiacoes = await getAllPremiacoes();

    // Fetch all participants (clients)
    const allParticipantes = await getAllParticipantes();

    // Filter data for the specific client
    const clienteApostas = allApostas.filter(aposta => aposta.cli_id === clienteId);
    const clientePremiacoes = allPremiacoes.filter(premiacao => premiacao.cli_id === clienteId);

    // Determine games where the client participated based on bets
    const jogosParticipados = jogos.filter(jogo => 
      clienteApostas.some(aposta => aposta.jog_id === jogo.jog_id)
    );

    // Prepare the response data
    const historico = {
      jogosParticipados: jogosParticipados.map(jogo => ({
        jog_id: jogo.jog_id,
        jog_nome: jogo.jog_nome || 'Nome do jogo não encontrado',
        jog_slug: jogo.jog_slug || 'Slug do jogo não encontrado', // Assuming 'jog_slug' exists in the game object
        data_inicio: jogo.data_inicio,
        data_fim: jogo.data_fim,
        status: jogo.jog_status || 'pendente'
      })),
      apostas: clienteApostas.map(aposta => {
        const jogo = jogos.find(j => j.jog_id === aposta.jog_id) || {};
        return {
          aposta_id: aposta.aposta_id,
          data_criacao: aposta.data_criacao || new Date().toISOString(),
          jogo_nome: jogo.jog_nome || 'Nome do jogo não encontrado',
          jog_slug: jogo.jog_slug || 'Slug do jogo não encontrado',
          numeros_escolhidos: aposta.palpite_numbers,
          valor: parseFloat(aposta.valor || 0),
          status: aposta.status || 'pendente'
        };
      }),
      premiacoes: clientePremiacoes.map(premiacao => {
        const jogo = jogos.find(j => j.jog_id === premiacao.jog_id) || {};
        const participante = allParticipantes.find(p => p.cli_id === premiacao.cli_id) || {};
        return {
          premiacao_id: premiacao.premiacao_id,
          data_criacao: premiacao.data_criacao || new Date().toISOString(),
          jogo_nome: jogo.jog_nome || 'Nome do jogo não encontrado',
          jog_slug: jogo.jog_slug || 'Slug do jogo não encontrado',
          premio: parseFloat(premiacao.premio || 0),
          pago: Boolean(premiacao.pago),
          data_pagamento: premiacao.data_pagamento,
          categoria: premiacao.categoria,
          nome: participante.cli_nome || 'Nome não encontrado'
        };
      })
    };

    return NextResponse.json(historico, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Helper functions to fetch data from DynamoDB

async function getAllJogos() {
  const params = {
    TableName: 'Jogos'
  };
  const result = await dynamoDbClient.send(new ScanCommand(params));
  return (result.Items || []).map(item => unmarshall(item));
}

async function getAllApostas() {
  const params = {
    TableName: 'Apostas'
  };
  const result = await dynamoDbClient.send(new ScanCommand(params));
  return (result.Items || []).map(item => unmarshall(item));
}

async function getAllPremiacoes() {
  const params = {
    TableName: 'Premiacoes'
  };
  const result = await dynamoDbClient.send(new ScanCommand(params));
  return (result.Items || []).map(item => unmarshall(item));
}

async function getAllParticipantes() {
  const params = {
    TableName: 'Cliente'
  };
  const result = await dynamoDbClient.send(new ScanCommand(params));
  return (result.Items || []).map(item => unmarshall(item));
}