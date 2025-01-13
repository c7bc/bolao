// Caminho: src/app/components/dashboard/Cliente/ClienteScores.jsx (Linhas: 82)
// src/app/components/dashboard/Cliente/ClienteScores.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const ClienteScores = ({ clienteId }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cliente/scores/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setScores(response.data.scores || []);
    } catch (error) {
      console.warn('Nenhum histórico de pontuações encontrado ou índice inexistente.');
      setScores([]); // Fallback para lista vazia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Pontuações</Heading>
      {scores.length === 0 ? (
        <Text>Nenhuma pontuação encontrada.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Jogo</Th>
              <Th>Pontuação</Th>
              <Th>Data</Th>
            </Tr>
          </Thead>
          <Tbody>
            {scores.map((score) => (
              <Tr key={score.score_id}>
                <Td>{score.jog_nome}</Td>
                <Td>{score.pontuacao}</Td>
                <Td>{new Date(score.data).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ClienteScores;
