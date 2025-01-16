// src/app/components/dashboard/Colaborador/GameDetailsModal.jsx

import React from 'react';
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalCloseButton, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Text, 
  VStack 
} from '@chakra-ui/react';

const GameDetailsModal = ({ game, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={3}>
            <Text><strong>Nome do Jogo:</strong> {game.jog_nome}</Text>
            <Text><strong>Tipo de Jogo:</strong> {game.jog_tipodojogo}</Text>
            <Text><strong>Status:</strong> {game.jog_status}</Text>
            <Text><strong>Valor do Ticket:</strong> R$ {game.jog_valorjogo.toFixed(2)}</Text>
            <Text><strong>Valor do Prêmio:</strong> R$ {game.jog_valorpremio.toFixed(2)}</Text>
            <Text><strong>Quantidade Mínima:</strong> {game.jog_quantidade_minima}</Text>
            <Text><strong>Quantidade Máxima:</strong> {game.jog_quantidade_maxima}</Text>
            {game.jog_pontos_necessarios && (
              <Text><strong>Pontos Necessários:</strong> {game.jog_pontos_necessarios}</Text>
            )}
            <Text><strong>Data de Início:</strong> {new Date(game.jog_data_inicio).toLocaleDateString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(game.jog_data_fim).toLocaleDateString()}</Text>
            <Text><strong>Slug:</strong> {game.slug}</Text>
            <Text><strong>Visível em Concursos:</strong> {game.visibleInConcursos ? 'Sim' : 'Não'}</Text>
            <Text><strong>Seleções:</strong> {game.jog_numeros}</Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameDetailsModal;
