import fetch from 'node-fetch'; // Para fazer requisições HTTP
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

// Configurações da aposta
const jogoId = 'df2bcc53-8d05-498f-bf85-890a33137bc6'; // ID do jogo existente
const apiApostaEndpoint = 'http://localhost:3000/api/jogos/apostas'; // Endpoint para criar apostas

// Opcional: Col_id do colaborador. Deixe vazio se desejar usar o token JWT.
const colIdManual = '3a56255b-4f7d-4591-bf5c-ed79db730d77'; // Exemplo: '3a56255b-4f7d-4591-bf5c-ed79db730d77'

// Token JWT válido (opcional). Se fornecido, será utilizado para extrair o col_id.
const JWT_TOKEN = ''; // Exemplo: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'

// Função para determinar se usar token ou col_id manual
function shouldUseToken() {
  return JWT_TOKEN && JWT_TOKEN !== '';
}

/**
 * Função para gerar números aleatórios únicos dentro de um intervalo.
 * @param {number} min - Valor mínimo do intervalo (inclusivo).
 * @param {number} max - Valor máximo do intervalo (inclusivo).
 * @param {number} count - Quantidade de números a gerar.
 * @returns {number[]} - Lista de números aleatórios únicos.
 */
function generateUniqueRandomNumbers(min, max, count) {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers);
}

/**
 * Função para fazer uma aposta automática.
 */
async function makeAutoBet() {
  const name = faker.person.fullName();
  const whatsapp = faker.phone.number('+55 9#########');
  const email = faker.internet.email();
  const palpiteNumbers = generateUniqueRandomNumbers(1, 60, 10); // Gerar 10 números entre 1 e 60

  const apostaData = {
    name, // Alinhado com o backend
    whatsapp,
    email,
    jogo_id: jogoId,
    palpite_numbers: palpiteNumbers,
    valor_total: 50.00, // Exemplo de valor total da aposta
    metodo_pagamento: 'pix', // Exemplo de método de pagamento
  };

  // Se não estiver usando token, adicionar o col_id manualmente
  if (!shouldUseToken()) {
    if (colIdManual) {
      apostaData.col_id = colIdManual;
    } else {
      console.error('Erro: Não foi fornecido um col_id manual e o token não está disponível.');
      return;
    }
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (shouldUseToken()) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }

    const response = await fetch(apiApostaEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(apostaData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao fazer aposta:', error);
    } else {
      const result = await response.json();
      console.log('Aposta criada com sucesso:', result);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

/**
 * Função principal para realizar múltiplas apostas automáticas.
 * @param {number} count - Quantidade de apostas a serem feitas.
 */
async function runAutoBets(count) {
  for (let i = 0; i < count; i++) {
    console.log(`Fazendo aposta ${i + 1} de ${count}...`);
    await makeAutoBet();
  }
}

// Executar o script para fazer 5 apostas automáticas
if (JWT_TOKEN === '' && colIdManual === '') {
  console.error('Por favor, forneça um token JWT válido ou um col_id manual.');
} else {
  runAutoBets(1000);
}
