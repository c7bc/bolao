import React from 'react';
import { Box, SimpleGrid, Heading, Text, Button } from '@chakra-ui/react';

const JogosFinalizados = ({ jogos }) => {
  return (
    <Box>
      <Heading as="h3" size="lg" color="green.700" mb={4}>
        Jogos Finalizados
      </Heading>
      {jogos.length === 0 ? (
        <Text>Você não tem jogos finalizados.</Text>
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
              <Button colorScheme="blue" size="md">
                Detalhes
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default JogosFinalizados;
