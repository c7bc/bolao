// src/app/components/dashboard/Colaborador/JogosAtivos.jsx

import React from 'react';
import { Box, SimpleGrid, Heading, Text, Button, Card, CardBody, CardHeader, CardFooter, useDisclosure } from '@chakra-ui/react';
import GameDetailsModal from './GameDetailsModal';

const JogosAtivos = ({ jogos, onViewDetails }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGame, setSelectedGame] = React.useState(null);

  const handleViewDetails = (game) => {
    setSelectedGame(game);
    onOpen();
  };

  return (
    <Box>
      <Heading as="h3" size="lg" color="green.700" mb={4}>Meus Jogos Ativos</Heading>

      {jogos.length === 0 ? (
        <Text>Você não está associado a nenhum jogo.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {jogos.map((jogo) => (
            <Card key={jogo.jog_id} variant="outline">
              <CardHeader>
                <Heading size="md" color="green.700">{jogo.jog_nome}</Heading>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" color="gray.600">Valor: R$ {jogo.jog_valorjogo.toFixed(2)}</Text>
                <Text fontSize="sm" color="gray.600">
                  Início: {new Date(jogo.jog_data_inicio).toLocaleDateString()}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Fim: {new Date(jogo.jog_data_fim).toLocaleDateString()}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Status: {jogo.jog_status === 'open' ? 'Em Andamento' : jogo.jog_status === 'upcoming' ? 'Próximo' : 'Encerrado'}
                </Text>
              </CardBody>
              <CardFooter>
                <Button 
                  colorScheme="blue" 
                  size="md" 
                  onClick={() => handleViewDetails(jogo)}
                >
                  Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Modal para Detalhes do Jogo */}
      {selectedGame && (
        <GameDetailsModal 
          game={selectedGame} 
          isOpen={isOpen} 
          onClose={() => { onClose(); setSelectedGame(null); }} 
        />
      )}
    </Box>
  );
};

export default JogosAtivos;
