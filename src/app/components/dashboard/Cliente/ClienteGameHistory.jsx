// src/app/components/dashboard/Cliente/ClienteGameHistory.jsx

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

const ClienteGameHistory = ({ clienteId }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cliente/gamehistory/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGames(response.data.games || []);
    } catch (error) {
      console.warn('Nenhum histórico de jogos encontrado ou índice inexistente.');
      setGames([]); // Fallback para lista vazia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Histórico de Jogos</Heading>
      {games.length === 0 ? (
        <Text>Nenhum jogo encontrado.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome do Jogo</Th>
              <Th>Tipo</Th>
              <Th>Valor</Th>
              <Th>Data de Criação</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {games.map((jogo) => (
              <Tr key={jogo.jog_id}>
                <Td>{jogo.jog_nome}</Td>
                <Td>{jogo.jog_tipodojogo}</Td>
                <Td>R$ {jogo.jog_valorjogo}</Td>
                <Td>{new Date(jogo.jog_datacriacao).toLocaleDateString()}</Td>
                <Td>{jogo.jog_status}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ClienteGameHistory;
