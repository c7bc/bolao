// Caminho: src/app/components/dashboard/Cliente/ClienteDashboard.jsx (Linhas: 129)
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
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Card,
  CardBody,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import axios from 'axios';

const ClienteDashboard = () => {
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const [jogosEncerrados, setJogosEncerrados] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');

        const [userRes, jogosRes] = await Promise.all([
          axios.get('/api/user', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get('/api/jogos/list', {
            params: { status: 'encerrado' },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setClienteData(userRes.data.user);
        setJogosEncerrados(jogosRes.data.jogos);
      } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando dashboard...</Text>
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
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Bem-vindo, {clienteData.name}
      </Heading>

      <StatGroup mb={6}>
        <Stat>
          <StatLabel>Total Ganho</StatLabel>
          <StatNumber color="green.500">
            R$ {(clienteData.ganhos || 0).toFixed(2)}
          </StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Jogos Participados</StatLabel>
          <StatNumber color="purple.500">
            {jogosEncerrados.length}
          </StatNumber>
        </Stat>
      </StatGroup>

      <Stack spacing={4}>
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
        <Button
          colorScheme="green"
          size={buttonSize}
          onClick={() => (window.location.href = '/cliente/jogos-finalizados')}
        >
          Jogos Finalizados
        </Button>
      </Stack>
    </Box>
  );
};

export default ClienteDashboard;
