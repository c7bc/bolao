// src/app/components/dashboard/Admin/GameDetailsModal.jsx

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
  Badge,
} from '@chakra-ui/react';

const GameDetailsModal = ({ isOpen, onClose, jogo }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {jogo.jog_nome}</Text>
            <Text><strong>Status:</strong> {jogo.jog_status === 'open' ? 'Em andamento' : 
                                          jogo.jog_status === 'closed' ? 'Encerrado' : 'Em breve'}</Text>
            <Text><strong>Tipo:</strong> {jogo.jog_tipodojogo}</Text>
            <Text><strong>Valor do Ticket:</strong> {jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Text>
            <Text><strong>Valor do Prêmio:</strong> {jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Text>
            <Text><strong>Quantidade Mínima de Seleções:</strong> {jogo.jog_quantidade_minima}</Text>
            <Text><strong>Quantidade Máxima de Seleções:</strong> {jogo.jog_quantidade_maxima}</Text>
            <Text><strong>Seleções:</strong> {jogo.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (jogo.jog_numeros || 'N/A') : (jogo.jog_numeros || 'N/A')}</Text>
            <Text><strong>Pontos Necessários:</strong> {jogo.jog_pontos_necessarios || 'N/A'}</Text>
            <Text><strong>Data de Início:</strong> {new Date(jogo.jog_data_inicio).toLocaleDateString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(jogo.jog_data_fim).toLocaleDateString()}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(jogo.jog_datacriacao).toLocaleString()}</Text>
            <Text><strong>Slug:</strong> {jogo.slug}</Text>
            <Text><strong>Visível na Concursos:</strong> {jogo.visibleInConcursos ? 'Sim' : 'Não'}</Text>
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
