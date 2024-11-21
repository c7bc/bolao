// app/components/Admin/GameManagement.jsx

import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import axios from 'axios';
import GameFormModal from './GameFormModal';

const GameManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [nomeFilter, setNomeFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchJogos = async () => {
    const response = await axios.get('/api/jogos/list', {
      params: {
        status: statusFilter || undefined,
        nome: nomeFilter || undefined,
      },
    });
    setJogos(response.data.jogos);
  };

  useEffect(() => {
    fetchJogos();
  }, [statusFilter, nomeFilter]);

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Jogos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Jogo
      </Button>
      <GameFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchJogos} />
      <Box mb={4}>
        <Select
          placeholder="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          mb={2}
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="finalizado">Finalizado</option>
        </Select>
        <Input
          placeholder="Filtrar por Nome"
          value={nomeFilter}
          onChange={(e) => setNomeFilter(e.target.value)}
        />
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
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() =>
                    (window.location.href = `/admin/jogos/${jogo.jog_id}`)
                  }
                >
                  Detalhes
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default GameManagement;
