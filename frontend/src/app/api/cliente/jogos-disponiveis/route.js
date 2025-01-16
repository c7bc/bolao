// Caminho: src/app/api/cliente/jogos-disponiveis/route.js (Linhas: 214)
// src/app/api/cliente/jogos-disponiveis/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

/**
 * Handler GET - Buscar jogos disponíveis para compra
 */
export async function GET(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['cliente'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Buscar jogos ativos
    const scanParams = {
      TableName: 'Jogos',
      FilterExpression: 'jog_status = :ativo',
      ExpressionAttributeValues: {
        ':ativo': { S: 'ativo' },
      },
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResult = await dynamoDbClient.send(scanCommand);

    const jogosAtivos = scanResult.Items.map(item => unmarshall(item));

    return NextResponse.json({ jogos: jogosAtivos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar jogos disponíveis:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Handler POST - Comprar ticket para um jogo
 * Espera-se que o corpo da requisição contenha:
 * - jog_id: ID do jogo
 * - numeros: Array de números escolhidos
 * - metodo_pagamento: 'pix', 'cartao', 'boleto'
 */
export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['cliente'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const cli_id = decodedToken.cli_id;

    // Parsing do corpo da requisição
    const { jog_id, numeros, metodo_pagamento } = await request.json();

    if (!jog_id || !numeros || !metodo_pagamento) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    // Validar método de pagamento
    const metodosValidos = ['pix', 'cartao', 'boleto'];
    if (!metodosValidos.includes(metodo_pagamento)) {
      return NextResponse.json({ error: 'Método de pagamento inválido.' }, { status: 400 });
    }

    // Buscar detalhes do jogo
    const jogoParams = {
      TableName: 'Jogos',
      Key: {
        jog_id: { S: jog_id },
      },
    };

    const jogoCommand = new QueryCommand(jogoParams);
    const jogoResult = await dynamoDbClient.send(jogoCommand);

    if (jogoResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(jogoResult.Items[0]);

    // Verificar se o jogo está ativo
    if (jogo.jog_status !== 'ativo') {
      return NextResponse.json({ error: 'Jogo não está ativo para compra de tickets.' }, { status: 400 });
    }

    // Validar quantidade de números escolhidos
    const quantidadeMinima = jogo.jog_quantidade_minima;
    const quantidadeMaxima = jogo.jog_quantidade_maxima;

    if (numeros.length < quantidadeMinima || numeros.length > quantidadeMaxima) {
      return NextResponse.json({
        error: `Quantidade de números inválida. Deve estar entre ${quantidadeMinima} e ${quantidadeMaxima}.`,
      }, { status: 400 });
    }

    // Validar números (deve ser array de números únicos dentro do intervalo permitido)
    const numerosUnicos = [...new Set(numeros)];
    if (numerosUnicos.length !== numeros.length) {
      return NextResponse.json({ error: 'Números duplicados não são permitidos.' }, { status: 400 });
    }

    for (const num of numerosUnicos) {
      if (typeof num !== 'number' || num < 1 || num > 60) { // Ajuste o intervalo conforme o tipo de jogo
        return NextResponse.json({ error: `Número inválido: ${num}. Deve estar entre 1 e 60.` }, { status: 400 });
      }
    }

    // Calcular valor total
    const valorTotal = jogo.jog_valorjogo * numerosUnicos.length;

    // Integração com o Mercado Pago
    // Supondo que você tenha uma função para criar pagamentos via Mercado Pago
    // Aqui, vamos simular a criação de um pagamento

    const pagamento = await criarPagamentoMercadoPago({
      cliente_id: cli_id,
      jog_id,
      numeros: numerosUnicos,
      metodo_pagamento,
      valor: valorTotal,
    });

    if (!pagamento || !pagamento.status === 'approved') {
      return NextResponse.json({ error: 'Pagamento falhou.' }, { status: 400 });
    }

    // Registrar a aposta no DynamoDB
    const aposta_id = uuidv4();
    const novaAposta = {
      htc_id: aposta_id,
      cli_id,
      jog_id,
      htc_cotas: numerosUnicos,
      htc_status: 'finalizado', // Ou outro status inicial
      htc_deposito: valorTotal,
      htc_premio: 0, // Será atualizado após o sorteio
      htc_datacriacao: new Date().toISOString(),
      htc_dataupdate: new Date().toISOString(),
    };

    const putApostaParams = {
      TableName: 'Apostas',
      Item: marshall(novaAposta),
    };

    const putApostaCommand = new PutItemCommand(putApostaParams);
    await dynamoDbClient.send(putApostaCommand);

    return NextResponse.json({ message: 'Ticket comprado com sucesso.', aposta: novaAposta }, { status: 201 });
  } catch (error) {
    console.error('Erro ao comprar ticket:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Função simulada para criar um pagamento via Mercado Pago
 * Substitua esta função pela integração real com a API do Mercado Pago
 */
async function criarPagamentoMercadoPago({ cliente_id, jog_id, numeros, metodo_pagamento, valor }) {
  try {
    // Simular criação de pagamento e retorno de status aprovado
    // Em produção, use a SDK ou API REST do Mercado Pago
    // Exemplo:
    /*
    const response = await axios.post('https://api.mercadopago.com/v1/payments', {
      // Dados do pagamento
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });
    return response.data;
    */
    // Simulação:
    return { status: 'approved' };
  } catch (error) {
    console.error('Erro na integração com o Mercado Pago:', error);
    return null;
  }
}
