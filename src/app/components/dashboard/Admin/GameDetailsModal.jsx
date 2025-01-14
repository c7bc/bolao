'use client';

import React, { useEffect, useState } from 'react';
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
import axios from 'axios';

const GameDetailsModal = ({ isOpen, onClose, jogo, refreshList, gameTypes = [] }) => {
  const [currentGame, setCurrentGame] = useState(jogo);

  useEffect(() => {
    if (isOpen && jogo) {
      setCurrentGame(jogo);
    }
  }, [isOpen, jogo]);

  useEffect(() => {
    const updateStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.post(
          '/api/jogos/update-status',
          { jog_id: currentGame.jog_id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status && response.data.status !== currentGame.jog_status) {
          setCurrentGame((prev) => ({ ...prev, jog_status: response.data.status }));
          if (typeof refreshList === 'function') {
            refreshList(); // Atualiza a lista de jogos no componente pai
          }
        }
      } catch (error) {
        // Log error but keep the application running
        console.error('Erro ao atualizar o status do jogo:', error);
        // Optionally, you could notify the user about the error without stopping the component
        // You might want to add a state for showing error messages or use a toast notification
      }
    };

    if (isOpen && currentGame) {
      updateStatus();
    }
  }, [isOpen, currentGame, refreshList]);

  if (!currentGame) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {currentGame.jog_nome || 'N/A'}</Text>
            <Text><strong>ID:</strong> {currentGame.jog_id || 'N/A'}</Text>
            <Text><strong>Descrição:</strong> {currentGame.descricao || 'N/A'}</Text>
            <Text>
              <strong>Status:</strong> {currentGame.jog_status === 'aberto' ? 'Aberto' : 
                                        currentGame.jog_status === 'fechado' ? 'Fechado' : 'Encerrado'}
            </Text>
            <Text>
              <strong>Tipo: </strong> 
              {Array.isArray(gameTypes)
                ? gameTypes.find(type => type.game_type_id === currentGame.jog_tipodojogo)?.name || currentGame.jog_tipodojogo || 'N/A'
                : 'N/A'}
            </Text>
            <Text>
              <strong>Valor do Bilhete:</strong> {currentGame.jog_valorBilhete !== undefined 
                ? `R$ ${currentGame.jog_valorBilhete.toFixed(2)}`
                : 'N/A'}
            </Text>
            <Text><strong>Visível em Concursos:</strong> {currentGame.visibleInConcursos ? 'Sim' : 'Não'}</Text>
            <Text><strong>Ativo:</strong> {currentGame.ativo ? 'Sim' : 'Não'}</Text>
            <Text>
              <strong>Data de Início:</strong> {currentGame.data_inicio ? new Date(currentGame.data_inicio).toLocaleString() : 'N/A'}
            </Text>
            <Text>
              <strong>Data de Fim:</strong> {currentGame.data_fim ? new Date(currentGame.data_fim).toLocaleString() : 'N/A'}
            </Text>
            <Text><strong>Número Inicial:</strong> {currentGame.numeroInicial || 'N/A'}</Text>
            <Text><strong>Número Final:</strong> {currentGame.numeroFinal || 'N/A'}</Text>
            <Text><strong>Pontos por Acerto:</strong> {currentGame.pontosPorAcerto || 'N/A'}</Text>
            <Text><strong>Número de Palpites:</strong> {currentGame.numeroPalpites || 'N/A'}</Text>
            <Text><strong>Slug:</strong> {currentGame.slug || 'N/A'}</Text>
            <Text>
              <strong>Criador:</strong> Admin
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