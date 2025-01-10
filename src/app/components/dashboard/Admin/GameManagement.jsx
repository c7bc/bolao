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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text
} from '@chakra-ui/react';
import { EditIcon, ViewIcon, DeleteIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameFormModal from './GameFormModal';
import GameEditModal from './GameEditModal';
import GameDetailsModal from './GameDetailsModal';
import PremiationForm from './PremiationForm';
import LotteryForm from './LotteryForm';
import { useToast } from '@chakra-ui/react';

const GameManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [selectedGameType, setSelectedGameType] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
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

  // Função para buscar tipos de jogos
  const fetchGameTypes = useCallback(async () => {
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
    }
  }, [toast]);

  // Função para buscar jogos
  const fetchJogos = useCallback(async () => {
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

      const params = {};
      if (selectedGameType) params.game_type_id = selectedGameType;
      if (dataFimFilter) params.data_fim = dataFimFilter;

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
  }, [selectedGameType, dataFimFilter, toast]);

  useEffect(() => {
    fetchGameTypes();
    fetchJogos();
  }, [fetchGameTypes, fetchJogos]);

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

      // Atualizar a visibilidade no backend
      await axios.put(`/api/jogos/${jogo.slug}/visibility`, { visibleInConcursos: updatedVisibility }, {
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
    const confirmDelete = confirm(`Tem certeza que deseja deletar o jogo "${jogo.jog_nome}"? Esta ação é irreversível.`);
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

      if (jogo.slug) {
        // Se o jogo possui slug, deletar via rota /api/jogos/[slug]
        await axios.delete(`/api/jogos/${jogo.slug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Se o jogo não possui slug, deletar via rota /api/jogos/delete com jog_id
        await axios.delete('/api/jogos/delete', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { jog_id: jogo.jog_id },
        });
      }

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
      <Box mb={4} display="flex" gap={4} flexWrap="wrap">
        {/* Seleção de Tipo de Jogo */}
        <Select
          placeholder="Filtrar por Tipo de Jogo"
          value={selectedGameType}
          onChange={(e) => setSelectedGameType(e.target.value)}
          width="250px"
        >
          {gameTypes.map((type) => (
            <option key={type.game_type_id} value={type.game_type_id}>
              {type.name}
            </option>
          ))}
        </Select>
        {/* Filtro por Data de Fim */}
        <Input
          type="date"
          placeholder="Filtrar por Data de Fim"
          value={dataFimFilter}
          onChange={(e) => setDataFimFilter(e.target.value)}
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
        <Tabs variant="enclosed" colorScheme="green">
          <TabList>
            <Tab>Geral</Tab>
            <Tab>Premiação</Tab>
            <Tab>Sorteio</Tab>
          </TabList>
          <TabPanels>
            {/* Aba Geral */}
            <TabPanel>
              <Table variant="striped" colorScheme="green">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Tipo de Jogo</Th>
                    <Th>Status</Th>
                    <Th>Data de Início</Th>
                    <Th>Data de Fim</Th>
                    <Th>Visível nos Concursos</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {jogos.map((jogo) => (
                    <Tr key={jogo.jog_id}>
                      <Td>{jogo.jog_nome}</Td>
                      <Td>
                        {gameTypes.find(type => type.game_type_id === jogo.jog_tipodojogo)?.name || jogo.jog_tipodojogo}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            jogo.jog_status === 'aberto'
                              ? 'green'
                              : jogo.jog_status === 'fechado'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {jogo.jog_status === 'aberto'
                            ? 'Aberto'
                            : jogo.jog_status === 'fechado'
                            ? 'Fechado'
                            : 'Encerrado'}
                        </Badge>
                      </Td>
                      <Td>{new Date(jogo.data_inicio).toLocaleString()}</Td>
                      <Td>{new Date(jogo.data_fim).toLocaleString()}</Td>
                      <Td>
                        <Badge colorScheme={jogo.visibleInConcursos ? 'green' : 'red'}>
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
                        <Tooltip label={jogo.visibleInConcursos ? "Ocultar nos Concursos" : "Mostrar nos Concursos"}>
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
            </TabPanel>

            {/* Aba Premiação */}
            <TabPanel>
              {selectedGame ? (
                <PremiationForm jogo={selectedGame} refreshList={fetchJogos} />
              ) : (
                <Text>Selecione um jogo para gerenciar a premiação.</Text>
              )}
            </TabPanel>

            {/* Aba Sorteio */}
            <TabPanel>
              {selectedGame ? (
                <LotteryForm jogo={selectedGame} refreshList={fetchJogos} />
              ) : (
                <Text>Selecione um jogo para gerenciar os sorteios.</Text>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default GameManagement;
