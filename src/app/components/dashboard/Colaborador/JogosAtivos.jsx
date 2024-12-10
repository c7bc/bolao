// src/app/components/dashboard/Colaborador/JogosAtivos.jsx

import React from 'react';
import { Box, SimpleGrid, Heading, Text, Button } from '@chakra-ui/react';

const JogosAtivos = ({ jogos, onViewDetails }) => {
  return (
    <Box>
      <Heading as="h3" size="lg" color="green.700" mb={4}>Meus Jogos Ativos</Heading>

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
              <Button colorScheme="blue" size="md" onClick={() => onViewDetails(jogo)}>
                Detalhes
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default JogosAtivos;
