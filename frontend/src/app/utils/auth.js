// src/app/utils/auth.js

import jwt from 'jsonwebtoken';

const JWT_SECRET = '43027bae66101fbad9c1ef4eb02e8158f5e2afa34b60f11144da6ea80dbdce68'; // Use variáveis de ambiente para segredos em produção
const JWT_EXPIRES_IN = '180d'; // Definido para 6 meses

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Função para verificar e decodificar o token (opcional)
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
