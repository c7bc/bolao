// src/app/api/notificacoes/enviar/route.js

import { NextResponse } from 'next/server';
import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import dynamoDbClient from '../../../lib/dynamoDbClient';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

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

    // Parsing do corpo da requisição
    const { destinatario_id, mensagem, tipo } = await request.json();

    if (!destinatario_id || !mensagem || !tipo) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    // Buscar detalhes do destinatário (cliente ou colaborador)
    const destinatarioTable = tipo === 'cliente' ? 'Cliente' : 'Colaborador';
    const buscarParams = {
      TableName: destinatarioTable,
      KeyConditionExpression: tipo === 'cliente' ? 'cli_id = :id' : 'col_id = :id',
      ExpressionAttributeValues: {
        ':id': { S: destinatario_id },
      },
    };

    const buscarCommand = new QueryCommand(buscarParams);
    const buscarResult = await dynamoDbClient.send(buscarCommand);

    if (buscarResult.Items.length === 0) {
      return NextResponse.json({ error: `${tipo} não encontrado.` }, { status: 404 });
    }

    const destinatario = unmarshall(buscarResult.Items[0]);

    // Enviar email (simulação ou via serviço real)
    const emailEnviado = await enviarEmail(destinatario.cli_email || destinatario.col_email, mensagem);

    if (!emailEnviado) {
      return NextResponse.json({ error: 'Falha ao enviar notificação.' }, { status: 500 });
    }

    // Registrar a notificação na tabela 'Notificacoes'
    const notificacao = {
      not_id: uuidv4(),
      destinatario_id,
      tipo,
      mensagem,
      not_datacriacao: new Date().toISOString(),
      not_status: 'ENVIADA',
    };

    const putParams = {
      TableName: 'Notificacoes',
      Item: marshall(notificacao),
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({ message: 'Notificação enviada com sucesso.', notificacao }, { status: 200 });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Envia um email para o destinatário.
 * @param {string} email - Email do destinatário.
 * @param {string} mensagem - Mensagem a ser enviada.
 * @returns {boolean} - True se enviado com sucesso, false caso contrário.
 */
async function enviarEmail(email, mensagem) {
  try {
    // Configurar transporter do Nodemailer (exemplo com SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Bolão" <no-reply@bolaon.com>',
      to: email,
      subject: 'Notificação da Plataforma de Bolão',
      text: mensagem,
      // html: '<b>' + mensagem + '</b>', // Opcional
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}
