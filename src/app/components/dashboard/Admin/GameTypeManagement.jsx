// src/app/components/dashboard/Admin/GameTypeManagement.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Spinner,
  Flex,
  useToast,
  useDisclosure,
  Text,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameTypeFormModal from './GameTypeFormModal';
import GameTypeEditModal from './GameTypeEditModal';

const GameTypeManagement = () => {
  const [gameTypes, setGameTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameType, setSelectedGameType] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const toast = useToast();

  // Função para buscar tipos de jogos
  const fetchGameTypes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/game-types/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGameTypes(response.data.gameTypes);
    } catch (error) {
      console.error('Erro ao buscar tipos de jogos:', error);
      toast({
        title: 'Erro ao buscar tipos de jogos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGameTypes();
  }, [fetchGameTypes]);

  const handleDelete = async (gameType) => {
    const confirmDelete = confirm(
      `Tem certeza que deseja deletar o tipo de jogo "${gameType.name}"? Esta ação é irreversível.`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.delete(`/api/game-types/${gameType.game_type_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Tipo de jogo deletado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      fetchGameTypes();
    } catch (error) {
      console.error('Erro ao deletar tipo de jogo:', error);
      toast({
        title: 'Erro ao deletar tipo de jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (gameType) => {
    setSelectedGameType(gameType);
    onEditOpen();
  };

  return (
    <Box
      p={6}
      bg="white"
      shadow="md"
      borderRadius="md"
      mb={6}
      maxW="100%"
      overflowX="auto"
    >
      <Heading size="md" mb={4}>
        Gestão de Tipos de Jogos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Criar Tipo de Jogo
      </Button>
      {/* Modal para Criar Tipo de Jogo */}
      <GameTypeFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchGameTypes} />
      {/* Modal para Editar Tipo de Jogo */}
      {selectedGameType && (
        <GameTypeEditModal
          isOpen={isEditOpen}
          onClose={() => {
            setSelectedGameType(null);
            onEditClose();
          }}
          gameType={selectedGameType}
          refreshList={fetchGameTypes}
        />
      )}
      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : gameTypes.length === 0 ? (
        <Flex justify="center" align="center" height="200px">
          <Text>Nenhum tipo de jogo encontrado.</Text>
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" minW="800px">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Números Mínimos</Th>
                <Th>Números Máximos</Th>
                <Th>Dígitos Mínimos</Th>
                <Th>Dígitos Máximos</Th>
                <Th>Pontos para 10</Th>
                <Th>Pontos para 9</Th>
                <Th>Números Sorteados</Th>
                <Th>Rodadas</Th>
                <Th>Horários de Sorteio</Th>
                <Th>Valor do Ticket (R$)</Th>
                <Th>Geração de Números</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {gameTypes.map((type) => (
                <Tr key={type.game_type_id}>
                  <Td>{type.name}</Td>
                  <Td>{type.min_numbers}</Td>
                  <Td>{type.max_numbers}</Td>
                  <Td>{type.min_digits}</Td>
                  <Td>{type.max_digits}</Td>
                  <Td>{type.points_for_10}</Td>
                  <Td>{type.points_for_9}</Td>
                  <Td>{type.total_drawn_numbers}</Td>
                  <Td>{type.rounds}</Td>
                  <Td>{type.draw_times.join(', ')}</Td>
                  <Td>R$ {type.ticket_price.toFixed(2)}</Td>
                  <Td>{type.number_generation === 'automatic' ? 'Automático' : 'Manual'}</Td>
                  <Td>
                    <Tooltip label="Editar Tipo de Jogo">
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        mr={2}
                        onClick={() => handleEdit(type)}
                      />
                    </Tooltip>
                    <Tooltip label="Deletar Tipo de Jogo">
                      <IconButton
                        aria-label="Deletar"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        onClick={() => handleDelete(type)}
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default GameTypeManagement;
