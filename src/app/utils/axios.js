// src/app/utils/axios.js

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/', // Ajuste conforme necessário
});

// Adicionar um interceptor para incluir o token nas requisições
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ajuste conforme onde você armazena o token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
