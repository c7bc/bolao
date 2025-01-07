// src/app/components/dashboard/Admin/GameDetailsModal.jsx

'use client';

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
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {jogo.jog_nome}</Text>
            <Text><strong>Status:</strong> {jogo.jog_status === 'aberto' ? 'Em andamento' : 
                                          jogo.jog_status === 'fechado' ? 'Encerrado' : 'Próximos'}</Text>
            <Text><strong>Tipo:</strong> {jogo.jog_tipodojogo.replace('_', ' ')}</Text>
            <Text><strong>Valor do Ticket:</strong> {jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Text>
            <Text><strong>Valor do Prêmio:</strong> {jogo.jog_valorpremio_est ? `R$ ${jogo.jog_valorpremio_est}` : 'N/A'}</Text>
            <Text><strong>Quantidade Mínima de Seleções:</strong> {jogo.jog_quantidade_minima}</Text>
            <Text><strong>Quantidade Máxima de Seleções:</strong> {jogo.jog_quantidade_maxima}</Text>
            <Text><strong>Seleções:</strong> {jogo.jog_numeros || 'N/A'}</Text>
            <Text><strong>Pontos Necessários:</strong> {jogo.jog_pontos_necessarios || 'N/A'}</Text>
            <Text><strong>Data de Início:</strong> {new Date(jogo.jog_data_inicio).toLocaleString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(jogo.jog_data_fim).toLocaleString()}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(jogo.jog_datacriacao).toLocaleString()}</Text>
            <Text><strong>Slug:</strong> {jogo.slug}</Text>
            <Text><strong>Visível na Concursos:</strong> {jogo.visibleInConcursos ? 'Sim' : 'Não'}</Text>
            <Text><strong>Criador:</strong> {jogo.creator_role === 'admin' || jogo.creator_role === 'superadmin'
                ? 'Admin'
                : 'Colaborador'}
            </Text>
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
