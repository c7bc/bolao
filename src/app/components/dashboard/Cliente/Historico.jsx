// app/components/Cliente/Historico.jsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';

const Historico = () => {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/cliente/historico', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHistorico(response.data.historico);
      } catch (error) {
        console.error('Error fetching historico:', error);
        alert('Erro ao carregar seu histórico.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, []);

  if (loading) {
    return <Text>Carregando histórico...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Histórico
      </Heading>
      {historico.length === 0 ? (
        <Text>Você não possui histórico.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Jogo</Th>
              <Th>Data</Th>
              <Th>Resultado</Th>
            </Tr>
          </Thead>
          <Tbody>
            {historico.map((item) => (
              <Tr key={item.id}>
                <Td>{item.jogoNome}</Td>
                <Td>{new Date(item.data).toLocaleDateString()}</Td>
                <Td>{item.resultado}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default Historico;
