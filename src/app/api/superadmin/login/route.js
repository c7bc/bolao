// src/app/api/superadmin/login/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-seguro'; // Use variáveis de ambiente
const JWT_EXPIRES_IN = '1h'; // Expiração do token
const MAX_ATTEMPTS = 5; // Número máximo de tentativas permitidas
const BLOCK_TIME = 15 * 60 * 1000; // Tempo de bloqueio em milissegundos (15 minutos)

// Armazena tentativas de login em memória
const loginAttempts = {};

function recordFailedAttempt(identifier) {
  const now = Date.now();
  if (!loginAttempts[identifier]) {
    loginAttempts[identifier] = { attempts: 1, firstAttemptTime: now };
  } else {
    loginAttempts[identifier].attempts += 1;
    loginAttempts[identifier].lastAttemptTime = now;
  }
}

function isBlocked(identifier) {
  const record = loginAttempts[identifier];
  if (!record) return false;

  const now = Date.now();
  if (record.attempts >= MAX_ATTEMPTS) {
    if (now - record.firstAttemptTime < BLOCK_TIME) {
      return true; // Bloqueado
    }
    // Limpa o registro após o tempo de bloqueio
    delete loginAttempts[identifier];
  }
  return false;
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Identificador único para tentativas (pode ser email ou IP)
    const identifier = email;

    // Verificar bloqueio
    if (isBlocked(identifier)) {
      return NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 });
    }

    // Verificar se o superadministrador com o email existe
    const scanParams = {
      TableName: 'Admin',
      FilterExpression: 'adm_email = :email AND adm_role = :role',
      ExpressionAttributeValues: {
        ':email': { S: email },
        ':role': { S: 'superadmin' },
      },
    };

    const command = new ScanCommand(scanParams);
    const data = await dynamoDbClient.send(command);

    if (!data.Items || data.Items.length === 0) {
      recordFailedAttempt(identifier); // Registrar tentativa falha
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const superadmin = unmarshall(data.Items[0]);

    // Verificar a senha
    const isPasswordValid = await bcrypt.compare(password, superadmin.adm_password);

    if (!isPasswordValid) {
      recordFailedAttempt(identifier); // Registrar tentativa falha
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Resetar tentativas em caso de sucesso
    delete loginAttempts[identifier];

    // Gerar um token JWT com 'role' e 'adm_nome'
    const token = jwt.sign(
      {
        adm_id: superadmin.adm_id,
        adm_email: superadmin.adm_email,
        adm_nome: superadmin.adm_nome, // Incluir o nome no payload
        role: superadmin.adm_role, // Alterado de 'adm_role' para 'role'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error during superadmin login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
