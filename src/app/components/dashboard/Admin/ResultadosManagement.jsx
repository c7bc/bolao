// src/app/components/dashboard/Admin/ResultadosManagement.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';

const ResultadosManagement = () => {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchResultados = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/distribuir-premios', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResultados(response.data.processados || []);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      toast({
        title: 'Erro ao buscar resultados.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  const handleProcessarResultados = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.post('/api/distribuir-premios', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Prêmios distribuídos com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      fetchResultados();
    } catch (error) {
      console.error('Erro ao distribuir prêmios:', error);
      toast({
        title: 'Erro ao distribuir prêmios.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} bg="white" shadow="md" borderRadius="md">
      <Heading size="md" mb={4}>
        Gestão de Resultados
      </Heading>
      <Button colorScheme="blue" mb={4} onClick={handleProcessarResultados}>
        Processar Resultados
      </Button>
      {loading ? (
        <Flex justify="center" align="center">
          <Spinner />
        </Flex>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID do Resultado</Th>
              <Th>ID do Jogo</Th>
              <Th>Números Sorteados</Th>
              <Th>Total Ganhadores 10 Pontos</Th>
              <Th>Total Ganhadores 9 Pontos</Th>
              <Th>Total Ganhadores Menos Pontos</Th>
              <Th>Prêmio Total (R$)</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {resultados.map((resultado) => (
              <Tr key={resultado.resultado_id}>
                <Td>{resultado.resultado_id}</Td>
                <Td>{resultado.jog_id}</Td>
                <Td>{resultado.numeros_sorteados}</Td>
                <Td>{resultado.total_ganhadores_10_pontos}</Td>
                <Td>{resultado.total_ganhadores_9_pontos}</Td>
                <Td>{resultado.total_ganhadores_menos_pontos}</Td>
                <Td>R$ {resultado.premio_total.toFixed(2)}</Td>
                <Td>
                  <Badge colorScheme={resultado.status === 'PROCESSADO' ? 'green' : 'yellow'}>
                    {resultado.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ResultadosManagement;
