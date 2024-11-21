// app/components/Cliente/JogosDisponiveis.jsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  useBreakpointValue,
} from '@chakra-ui/react';
import axios from 'axios';

const JogosDisponiveis = () => {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const response = await axios.get('/api/jogos/list', {
          params: { status: 'ativo' },
        });
        setJogos(response.data.jogos);
      } catch (error) {
        console.error('Error fetching jogos:', error);
        alert('Erro ao carregar jogos.');
      } finally {
        setLoading(false);
      }
    };

    fetchJogos();
  }, []);

  if (loading) {
    return <Text>Carregando jogos...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Jogos Disponíveis
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {jogos.map((jogo) => (
          <Box
            key={jogo.jog_id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            boxShadow="md"
          >
            <Heading as="h3" size="md" color="green.700" mb={2}>
              {jogo.jog_nome}
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Valor: R$ {jogo.jog_valorjogo}
            </Text>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Início: {new Date(jogo.jog_data_inicio).toLocaleDateString()}
            </Text>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Fim: {new Date(jogo.jog_data_fim).toLocaleDateString()}
            </Text>
            <Button
              colorScheme="green"
              size={buttonSize}
              onClick={() =>
                (window.location.href = `/cliente/jogos/${jogo.jog_id}`)
              }
            >
              Participar
            </Button>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default JogosDisponiveis;
