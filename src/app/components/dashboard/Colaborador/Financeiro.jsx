// src/app/components/dashboard/Colaborador/Financeiro.jsx

'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  FormControl,
  FormLabel,
  Button,
  Flex,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const Financeiro = () => {
  const [resumo, setResumo] = useState({
    totalComissao: 0,
    totalPago: 0,
  });
  const [comissoes, setComissoes] = useState([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const toast = useToast();

  // Função para buscar resumo financeiro
  const fetchResumo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/financeiro/resumo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResumo(response.data.resumo);
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      toast({
        title: 'Erro ao carregar resumo financeiro.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Função para buscar lista de clientes
  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/clientes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClientes(response.data.clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro ao carregar clientes.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Função para buscar comissões com base nos filtros
  const fetchComissoes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};

      if (filtroPeriodo !== 'todos') {
        params.periodo = filtroPeriodo;
      }

      if (filtroCliente) {
        params.clienteId = filtroCliente;
      }

      const response = await axios.get('/api/colaborador/financeiro/comissoes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setComissoes(response.data.comissoes);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      toast({
        title: 'Erro ao carregar comissões.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar dados (Opcional)
  const handleExport = () => {
    // Implementar lógica de exportação, como baixar um CSV
    alert('Função de exportação ainda não implementada.');
  };

  useEffect(() => {
    // Chama todas as funções de busca ao montar o componente
    const fetchData = async () => {
      await fetchResumo();
      await fetchClientes();
      await fetchComissoes();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuscar comissões quando os filtros mudarem
  useEffect(() => {
    fetchComissoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroPeriodo, filtroCliente]);

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Financeiro
      </Heading>

      {/* Resumo Financeiro */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <Stat>
          <StatLabel>Total de Comissões</StatLabel>
          <StatNumber>R$ {resumo.totalComissao.toFixed(2)}</StatNumber>
          <StatHelpText>Comissões acumuladas até hoje</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Pago</StatLabel>
          <StatNumber>R$ {resumo.totalPago.toFixed(2)}</StatNumber>
          <StatHelpText>Pagamentos efetuados até hoje</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Filtros */}
      <Flex mb={4} alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Box>
          <FormControl mr={4} mb={{ base: 2, md: 0 }}>
            <FormLabel>Período</FormLabel>
            <Select
              placeholder="Selecionar período"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="ultimo-mes">Último Mês</option>
              <option value="ultimo-trimestre">Último Trimestre</option>
              <option value="ano-atual">Ano Atual</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Cliente</FormLabel>
            <Select
              placeholder="Selecionar cliente"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            >
              {clientes.map((cliente) => (
                <option key={cliente.cli_id} value={cliente.cli_id}>
                  {cliente.cli_nome}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Button colorScheme="green" mr={2} onClick={handleExport}>
            Exportar Dados
          </Button>
          <Button colorScheme="blue" onClick={fetchComissoes}>
            Atualizar
          </Button>
        </Box>
      </Flex>

      {/* Lista de Comissões */}
      {loading ? (
        <Text>Carregando comissões...</Text>
      ) : comissoes.length === 0 ? (
        <Text>Nenhuma comissão encontrada com os filtros selecionados.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Cliente</Th>
              <Th>Valor da Comissão</Th>
              <Th>Data</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {comissoes.map((comissao) => (
              <Tr key={comissao.id}>
                <Td>{comissao.clienteNome}</Td>
                <Td>R$ {comissao.valorComissao.toFixed(2)}</Td>
                <Td>{new Date(comissao.data).toLocaleDateString()}</Td>
                <Td>{comissao.status}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default Financeiro;
