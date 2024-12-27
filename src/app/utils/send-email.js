// src/app/utils/send-email.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Cria e retorna um transportador Nodemailer configurado.
 * @returns {nodemailer.Transporter} - Transportador configurado.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Servidor SMTP (ex: smtp.zoho.com)
    port: parseInt(process.env.EMAIL_PORT, 10), // Porta para SSL (geralmente 465)
    secure: process.env.EMAIL_SECURE === 'true', // Usar SSL
    auth: {
      user: process.env.EMAIL_USER, // Seu e-mail
      pass: process.env.EMAIL_PASS, // Sua senha ou senha específica do aplicativo
    },
  });
};

/**
 * Função para enviar e-mails.
 * @param {Object} mailOptions - Opções do e-mail.
 * @param {string} mailOptions.to - Destinatário do e-mail.
 * @param {string} mailOptions.subject - Assunto do e-mail.
 * @param {string} [mailOptions.text] - Corpo em texto simples do e-mail.
 * @param {string} [mailOptions.html] - Corpo em HTML do e-mail.
 * @returns {Promise} - Promessa que resolve quando o e-mail é enviado.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM, // Remetente padrão
      to, // Destinatário
      subject, // Assunto
      text, // Corpo em texto simples
      html, // Corpo em HTML
    };

    // Enviar o e-mail
    const info = await transporter.sendMail(mailOptions);

    console.log(`E-mail enviado para ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
    throw error;
  }
};

export default sendEmail;
