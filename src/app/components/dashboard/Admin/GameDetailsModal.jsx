// src/app/components/dashboard/Admin/GameDetailsModal.jsx (Ensure unique and necessary code)

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Stack,
} from '@chakra-ui/react';

const GameDetailsModal = ({ isOpen, onClose, jogo }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {jogo.jog_nome}</Text>
            <Text><strong>Status:</strong> {jogo.jog_status}</Text>
            <Text><strong>Tipo:</strong> {jogo.jog_tipodojogo}</Text>
            <Text><strong>Valor:</strong> R$ {jogo.jog_valorjogo}</Text>
            <Text><strong>Quantidade Mínima de Números:</strong> {jogo.jog_quantidade_minima}</Text>
            <Text><strong>Quantidade Máxima de Números:</strong> {jogo.jog_quantidade_maxima}</Text>
            <Text><strong>Números:</strong> {jogo.jog_numeros}</Text>
            <Text><strong>Data de Início:</strong> {new Date(jogo.jog_data_inicio).toLocaleDateString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(jogo.jog_data_fim).toLocaleDateString()}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(jogo.jog_datacriacao).toLocaleString()}</Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameDetailsModal;
