// src/app/components/dashboard/Admin/GameManagement.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { EditIcon, ViewIcon, DeleteIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameFormModal from './GameFormModal';
import GameEditModal from './GameEditModal';
import GameDetailsModal from './GameDetailsModal';
import { useToast } from '@chakra-ui/react';

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
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const fetchJogos = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (nomeFilter) params.nome = nomeFilter;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/jogos/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: 'Erro ao buscar jogos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, nomeFilter, toast]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  const handleEdit = (jogo) => {
    setSelectedGame(jogo);
    onEditOpen();
  };

  const handleViewDetails = (jogo) => {
    setSelectedGame(jogo);
    onDetailsOpen();
  };

  const handleToggleVisibility = async (jogo) => {
    try {
      const updatedVisibility = !jogo.visibleInConcursos;
      const token = localStorage.getItem('token');
      await axios.put(`/api/jogos/${jogo.slug}`, { visibleInConcursos: updatedVisibility }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: `Visibilidade atualizada para ${updatedVisibility ? 'Visível' : 'Oculto'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: 'Erro ao atualizar visibilidade.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (jogo) => {
    const confirmDelete = confirm(`Tem certeza que deseja deletar o bolão "${jogo.jog_nome}"? Esta ação é irreversível.`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/jogos/${jogo.slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Jogo deletado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      console.error('Erro ao deletar jogo:', error);
      toast({
        title: 'Erro ao deletar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
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
          <option value="open">Em Andamento</option>
          <option value="upcoming">Próximos</option>
          <option value="closed">Finalizados</option>
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
      {loading ? (
        <Flex justify="center" align="center" mt="10">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Table variant="striped" colorScheme="green">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Status</Th>
              <Th>Valor do Ticket (R$)</Th>
              <Th>Prêmio (R$)</Th>
              <Th>Pontos Necessários</Th>
              <Th>Visível na Concursos</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {jogos.map((jogo) => (
              <Tr key={jogo.jog_id}>
                <Td>{jogo.jog_nome}</Td>
                <Td>
                  <Badge
                    colorScheme={jogo.jog_status === 'open' ? 'green' : jogo.jog_status === 'closed' ? 'red' : 'yellow'}
                  >
                    {jogo.jog_status === 'open' ? 'Em andamento' : 
                     jogo.jog_status === 'closed' ? 'Encerrado' : 'Próximos'}
                  </Badge>
                </Td>
                <Td>{jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Td>
                <Td>{jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Td>
                <Td>{jogo.jog_pontos_necessarios || 'N/A'}</Td>
                <Td>
                  <Badge
                    colorScheme={jogo.visibleInConcursos ? 'green' : 'red'}
                  >
                    {jogo.visibleInConcursos ? 'Sim' : 'Não'}
                  </Badge>
                </Td>
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
                      mr={2}
                      onClick={() => handleViewDetails(jogo)}
                    />
                  </Tooltip>
                  <Tooltip label={jogo.visibleInConcursos ? "Ocultar na Concursos" : "Mostrar na Concursos"}>
                    <IconButton
                      aria-label="Toggle Visibilidade"
                      icon={jogo.visibleInConcursos ? <ViewOffIcon /> : <ViewIcon />}
                      mr={2}
                      onClick={() => handleToggleVisibility(jogo)}
                    />
                  </Tooltip>
                  <Tooltip label="Deletar Jogo">
                    <IconButton
                      aria-label="Deletar"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDelete(jogo)}
                    />
                  </Tooltip>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default GameManagement;
