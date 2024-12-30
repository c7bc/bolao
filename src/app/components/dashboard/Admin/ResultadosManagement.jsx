// src/app/components/dashboard/Admin/ResultadosManagement.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  IconButton,
  Tooltip,
  Badge,
  Flex,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import axios from 'axios';

const ResultadosManagement = () => {
  const [jogosFechados, setJogosFechados] = useState([]);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchJogosFechados = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/jogos/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { status: 'closed' },
      });
      setJogosFechados(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos fechados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar os jogos fechados.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJogosFechados();
  }, [fetchJogosFechados]);

  const handleRegistrarResultado = async (jogo) => {
    try {
      const token = localStorage.getItem('token');
      // Registrar resultado automaticamente baseado nos pontos
      const payload = {
        concurso: jogo.jog_nome, // Assumindo que 'jog_nome' é o identificador do concurso
        tipo_jogo: jogo.jog_tipodojogo,
        numeros: jogo.jog_numeros,
        data_sorteio: new Date().toISOString(),
      };

      await axios.post('/api/resultados/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Resultado registrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      fetchJogosFechados();
    } catch (error) {
      console.error('Erro ao registrar resultado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o resultado.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} bg="white" shadow="md" borderRadius="md" mt={6}>
      <Heading size="lg" mb={4}>
        Gerenciar Resultados
      </Heading>
      {loading ? (
        <Flex justify="center" align="center" mt="10">
          <Spinner size="xl" />
        </Flex>
      ) : jogosFechados.length > 0 ? (
        <Table variant="striped" colorScheme="blue">
          <Thead>
            <Tr>
              <Th>Nome do Jogo</Th>
              <Th>Tipo de Jogo</Th>
              <Th>Números/Animais Sorteados</Th>
              <Th>Data do Sorteio</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {jogosFechados.map((jogo) => (
              <Tr key={jogo.jog_id}>
                <Td>{jogo.jog_nome}</Td>
                <Td>{jogo.jog_tipodojogo.replace('_', ' ')}</Td>
                <Td>{jogo.jog_numeros}</Td>
                <Td>{new Date(jogo.jog_data_fim).toLocaleString()}</Td>
                <Td>
                  <Tooltip label="Registrar Resultado">
                    <IconButton
                      aria-label="Registrar Resultado"
                      icon={<CheckIcon />}
                      colorScheme="green"
                      onClick={() => handleRegistrarResultado(jogo)}
                    />
                  </Tooltip>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" mt={10}>
          <Badge colorScheme="yellow">Nenhum jogo fechado disponível para sorteio.</Badge>
        </Box>
      )}
    </Box>
  );
};

export default ResultadosManagement;
