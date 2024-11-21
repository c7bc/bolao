// app/components/Cliente/MeusJogos.jsx

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

const MeusJogos = () => {
  const [meusJogos, setMeusJogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeusJogos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/cliente/meus-jogos', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMeusJogos(response.data.jogos);
      } catch (error) {
        console.error('Error fetching meus jogos:', error);
        alert('Erro ao carregar seus jogos.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeusJogos();
  }, []);

  if (loading) {
    return <Text>Carregando seus jogos...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Meus Jogos
      </Heading>
      {meusJogos.length === 0 ? (
        <Text>Você ainda não participou de nenhum jogo.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Jogo</Th>
              <Th>Status</Th>
              <Th>Data</Th>
            </Tr>
          </Thead>
          <Tbody>
            {meusJogos.map((jogo) => (
              <Tr key={jogo.id}>
                <Td>{jogo.nome}</Td>
                <Td>{jogo.status}</Td>
                <Td>{new Date(jogo.data).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default MeusJogos;
