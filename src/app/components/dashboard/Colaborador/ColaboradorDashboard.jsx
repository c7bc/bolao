// Caminho: src/app/components/dashboard/Colaborador/ColaboradorDashboard.jsx

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
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';

const ColaboradorDashboard = () => {
  const [colaboradorData, setColaboradorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const fetchColaboradorData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token ausente');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/colaborador/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setColaboradorData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados do colaborador:', error);
        alert('Erro ao carregar dados do colaborador.');
      } finally {
        setLoading(false);
      }
    };

    fetchColaboradorData();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!colaboradorData) {
    return (
      <Box p={6}>
        <Text>Dados do colaborador não disponíveis.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Bem-vindo, {colaboradorData.col_nome}
      </Heading>
      <Stack spacing={4}>
        <Text fontSize="lg" color="green.700">
          Total de Clientes: {colaboradorData.totalClientes}
        </Text>
        <Text fontSize="lg" color="green.700">
          Comissão Acumulada: R$ {colaboradorData.comissaoAcumulada}
        </Text>
        <Button
          colorScheme="green"
          size={buttonSize}
          onClick={() => (window.location.href = '/colaborador/clientes')}
        >
          Gerenciar Clientes
        </Button>
      </Stack>
    </Box>
  );
};

export default ColaboradorDashboard;
