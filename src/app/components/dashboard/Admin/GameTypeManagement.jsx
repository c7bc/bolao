// Caminho: src/app/components/dashboard/Admin/GameTypeManagement.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  IconButton,
  Tooltip,
  Badge,
  Flex,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameTypeFormModal from './GameTypeFormModal';
import GameTypeEditModal from './GameTypeEditModal';
import { useToast } from '@chakra-ui/react';

const GameTypeManagement = () => {
  const [gameTypes, setGameTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGameType, setSelectedGameType] = useState(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  // Modal para detalhes do tipo de jogo
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();

  const [detailGameType, setDetailGameType] = useState(null);

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

  const handleEdit = (gameType) => {
    setSelectedGameType(gameType);
    onEditOpen();
  };

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

  const handleRowClick = (gameType) => {
    setDetailGameType(gameType);
    onDetailOpen();
  };

  const filteredGameTypes = gameTypes.filter((gameType) =>
    gameType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Tipos de Jogos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Criar Tipo de Jogo
      </Button>
      <GameTypeFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchGameTypes} />
      {selectedGameType && (
        <GameTypeEditModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          refreshList={fetchGameTypes}
          gameType={selectedGameType}
        />
      )}
      {/* Modal de Detalhes */}
      {detailGameType && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Detalhes do Tipo de Jogo</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Nome:</Text>
                  <Text>{detailGameType.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Slug:</Text>
                  <Text>{detailGameType.slug}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Quantidade Mínima de Números:</Text>
                  <Text>{detailGameType.min_numbers}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Quantidade Máxima de Números:</Text>
                  <Text>{detailGameType.max_numbers}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Dígitos Mínimos:</Text>
                  <Text>{detailGameType.min_digits}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Dígitos Máximos:</Text>
                  <Text>{detailGameType.max_digits}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Pontos para 10 Acertos:</Text>
                  <Text>{detailGameType.points_for_10}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Pontos para 9 Acertos:</Text>
                  <Text>{detailGameType.points_for_9}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Total de Números Sorteados:</Text>
                  <Text>{detailGameType.total_drawn_numbers}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Quantidade de Rodadas:</Text>
                  <Text>{detailGameType.rounds}</Text>
                </Box>
                {detailGameType.rounds > 1 && (
                  <Box>
                    <Text fontWeight="bold">Horários de Sorteio:</Text>
                    <Text>{detailGameType.draw_times.join(', ')}</Text>
                  </Box>
                )}
                <Box>
                  <Text fontWeight="bold">Valor do Ticket (R$):</Text>
                  <Text>{parseFloat(detailGameType.ticket_price).toFixed(2)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Método de Geração de Números:</Text>
                  <Text>
                    {detailGameType.number_generation === 'automatic' ? 'Automático' : 'Manual'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Atualizado em:</Text>
                  <Text>{new Date(detailGameType.updated_at).toLocaleString()}</Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                colorScheme="blue"
                leftIcon={<EditIcon />}
                mr={3}
                onClick={() => {
                  handleEdit(detailGameType);
                  onDetailClose();
                }}
              >
                Editar
              </Button>
              <Button
                colorScheme="red"
                leftIcon={<DeleteIcon />}
                onClick={() => {
                  handleDelete(detailGameType);
                  onDetailClose();
                }}
              >
                Remover
              </Button>
              <Button variant="ghost" ml={3} onClick={onDetailClose}>
                Fechar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      <Box mb={4} display="flex" gap={4} flexWrap="wrap" alignItems="center">
        {/* Campo de Busca */}
        <Input
          placeholder="Buscar por Nome"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          width={{ base: '100%', md: '300px' }}
        />
      </Box>
      {loading ? (
        <Flex justify="center" align="center" mt="10">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" colorScheme="blue">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Rodadas</Th>
                <Th>Valor do Ticket (R$)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredGameTypes.map((gameType) => (
                <Tr
                  key={gameType.game_type_id}
                  _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                  onClick={() => handleRowClick(gameType)}
                >
                  <Td>{gameType.name}</Td>
                  <Td>{gameType.rounds}</Td>
                  <Td>{parseFloat(gameType.ticket_price).toFixed(2)}</Td>
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
