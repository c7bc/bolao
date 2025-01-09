// Caminho: src/app/components/dashboard/Admin/GameDetailsModal.jsx

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
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {jogo.jog_nome}</Text>
            <Text><strong>Descrição:</strong> {jogo.descricao}</Text>
            <Text><strong>Status:</strong> {jogo.jog_status === 'aberto' ? 'Aberto' : 
                                          jogo.jog_status === 'fechado' ? 'Fechado' : 'Encerrado'}</Text>
            <Text><strong>Tipo:</strong> {jogo.jog_tipodojogo}</Text>
            <Text><strong>Valor do Bilhete:</strong> {jogo.valorBilhete ? `R$ ${jogo.valorBilhete.toFixed(2)}` : 'N/A'}</Text>
            <Text><strong>Visível em Concursos:</strong> {jogo.visibleInConcursos ? 'Sim' : 'Não'}</Text>
            <Text><strong>Ativo:</strong> {jogo.ativo ? 'Sim' : 'Não'}</Text>
            <Text><strong>Data de Início:</strong> {new Date(jogo.jog_data_inicio).toLocaleString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(jogo.jog_data_fim).toLocaleString()}</Text>
            <Text><strong>Número Inicial:</strong> {jogo.numeroInicial}</Text>
            <Text><strong>Número Final:</strong> {jogo.numeroFinal}</Text>
            <Text><strong>Quantidade de Números:</strong> {jogo.quantidadeNumeros}</Text>
            <Text><strong>Pontos por Acerto:</strong> {jogo.pontosPorAcerto}</Text>
            <Text><strong>Número de Palpites:</strong> {jogo.numeroPalpites}</Text>
            <Text><strong>Slug:</strong> {jogo.slug}</Text>
            <Text><strong>Criador:</strong> {jogo.creator_role === 'admin' || jogo.creator_role === 'superadmin'
                ? 'Admin'
                : 'Colaborador'}
            </Text>
            {/* Adicionar mais campos conforme necessário */}
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
