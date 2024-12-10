// src/app/components/dashboard/Colaborador/GameDetailsModal.jsx
import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Text } from '@chakra-ui/react';

const GameDetailsModal = ({ game, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text><strong>Nome do Jogo:</strong> {game.name}</Text>
          <Text><strong>Categoria:</strong> {game.category}</Text>
          <Text><strong>Data de Início:</strong> {game.startDate}</Text>
          <Text><strong>Detalhes:</strong> {game.details}</Text>
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
