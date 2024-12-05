// src/app/components/dashboard/Admin/GameManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';  // Adicionado useCallback
import {
  Box,
  Heading,
  Button,
  Select,
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
} from '@chakra-ui/react';
import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameFormModal from './GameFormModal';
import GameEditModal from './GameEditModal';
import GameDetailsModal from './GameDetailsModal';

const GameManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [nomeFilter, setNomeFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGame, setSelectedGame] = useState(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const fetchJogos = useCallback(async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (nomeFilter) params.nome = nomeFilter;

    try {
      const response = await axios.get('/api/jogos/list', { params });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
    }
  }, [statusFilter, nomeFilter]); // Dependências da função

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]); // Agora fetchJogos é uma dependência

  const handleEdit = (jogo) => {
    setSelectedGame(jogo);
    onEditOpen();
  };

  const handleViewDetails = (jogo) => {
    setSelectedGame(jogo);
    onDetailsOpen();
  };

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Jogos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Jogo
      </Button>
      <GameFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchJogos} />
      {selectedGame && (
        <>
          <GameEditModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            refreshList={fetchJogos}
            jogo={selectedGame}
          />
          <GameDetailsModal
            isOpen={isDetailsOpen}
            onClose={onDetailsClose}
            jogo={selectedGame}
          />
        </>
      )}
      <Box mb={4} display="flex" gap={4}>
        <Select
          placeholder="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          width="200px"
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="finalizado">Finalizado</option>
        </Select>
        <Input
          placeholder="Filtrar por Nome"
          value={nomeFilter}
          onChange={(e) => setNomeFilter(e.target.value)}
          width="200px"
        />
        <Button onClick={fetchJogos} colorScheme="blue">
          Filtrar
        </Button>
      </Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Status</Th>
            <Th>Valor</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {jogos.map((jogo) => (
            <Tr key={jogo.jog_id}>
              <Td>{jogo.jog_nome}</Td>
              <Td>{jogo.jog_status}</Td>
              <Td>R$ {jogo.jog_valorjogo}</Td>
              <Td>
                <Tooltip label="Editar Jogo">
                  <IconButton
                    aria-label="Editar"
                    icon={<EditIcon />}
                    mr={2}
                    onClick={() => handleEdit(jogo)}
                  />
                </Tooltip>
                <Tooltip label="Ver Detalhes">
                  <IconButton
                    aria-label="Detalhes"
                    icon={<ViewIcon />}
                    onClick={() => handleViewDetails(jogo)}
                  />
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default GameManagement;