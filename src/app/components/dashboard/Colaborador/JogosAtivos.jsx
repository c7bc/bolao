import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, Heading, Text, Button, Select } from '@chakra-ui/react';
import axios from 'axios';

const JogosAtivos = () => {
  const [jogos, setJogos] = useState([]);
  const [status, setStatus] = useState('ativo'); // Default filter: ativo

  // Fetch games from API based on status
  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const response = await axios.get(`/api/jogos/list`, {
          params: { status },
        });
        setJogos(response.data.jogos);
      } catch (error) {
        console.error('Erro ao buscar jogos:', error);
      }
    };

    fetchJogos();
  }, [status]);

  return (
    <Box>
      <Heading as="h3" size="lg" color="green.700" mb={4}>Meus Jogos</Heading>

      {/* Filter by status */}
      <Select
        placeholder="Filtrar por Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        mb={4}
      >
        <option value="ativo">Ativos</option>
        <option value="finalizado">Finalizados</option>
      </Select>

      {jogos.length === 0 ? (
        <Text>Você não está associado a nenhum jogo.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {jogos.map((jogo) => (
            <Box
              key={jogo.jog_id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="md"
            >
              <Heading as="h3" size="md" color="green.700" mb={2}>{jogo.jog_nome}</Heading>
              <Text fontSize="sm" color="gray.600" mb={2}>Valor: R$ {jogo.jog_valorjogo}</Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                {new Date(jogo.jog_data_inicio).toLocaleDateString()} - {new Date(jogo.jog_data_fim).toLocaleDateString()}
              </Text>
              <Button colorScheme="blue" size="md">Detalhes</Button>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default JogosAtivos;
