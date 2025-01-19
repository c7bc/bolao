import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

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
