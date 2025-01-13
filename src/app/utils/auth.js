// src/utils/auth.js

import jwt from 'jsonwebtoken';

const JWT_SECRET = '43027bae66101fbad9c1ef4eb02e8158f5e2afa34b60f11144da6ea80dbdce68'; // Use variáveis de ambiente para segredos
const JWT_EXPIRES_IN = '30d'; // Defina a expiração do token

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Função para verificar e decodificar o token (opcional)
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};
