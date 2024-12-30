// src/app/components/dashboard/Cliente/ClienteDashboard.jsx

'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Stack,
  Button,
  useBreakpointValue,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';

const ClienteDashboard = () => {
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const fetchClienteData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token não encontrado. Faça login novamente.');
        }

        const response = await axios.get('/api/cliente/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setClienteData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
        alert(
          error.response?.data?.error || 'Erro ao carregar dados do cliente.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClienteData();
  }, []);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando...</Text>
      </Box>
    );
  }

  if (!clienteData) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500">Erro ao carregar dados do cliente.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Verifica se o nome do cliente está disponível */}
      {clienteData.cli_nome && (
        <Heading as="h2" size="xl" color="green.800" mb={6}>
          Bem-vindo, {clienteData.cli_nome}
        </Heading>
      )}
      <Stack spacing={4}>
        {/* Total Ganho */}
        <Text fontSize="lg" color="green.700">
          Total Ganho: R$ {(clienteData.ganhos || 0).toFixed(2)}
        </Text>

        {/* Mensagens */}
        {clienteData.mensagens && Array.isArray(clienteData.mensagens) && (
          <Text fontSize="lg" color="green.700">
            Mensagens: {clienteData.mensagens.length}
          </Text>
        )}

        {/* Botões de Navegação */}
        <Button
          colorScheme="green"
          size={buttonSize}
          onClick={() => (window.location.href = '/cliente/jogos-disponiveis')}
        >
          Ver Jogos Disponíveis
        </Button>
        <Button
          colorScheme="green"
          size={buttonSize}
          onClick={() => (window.location.href = '/cliente/meus-jogos')}
        >
          Meus Jogos
        </Button>
      </Stack>
    </Box>
  );
};

export default ClienteDashboard;
