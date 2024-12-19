'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
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
  Badge,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

const Financeiro = () => {
  const [resumo, setResumo] = useState({
    totalRecebido: 0,
    totalComissaoColaborador: 0,
    totalPago: 0,
  });
  const [comissoesColaboradores, setComissoesColaboradores] = useState([]);
  const [comissoesClientes, setComissoesClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Definindo a função fora do useEffect para evitar a inclusão dela como dependência
  const fetchFinanceiro = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [resumoRes, colaboradoresRes, clientesRes] = await Promise.all([
        axios.get('/api/financeiro/resumo', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('/api/financeiro/colaboradores', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('/api/financeiro/clientes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setResumo(resumoRes.data.resumo || {});
      setComissoesColaboradores(colaboradoresRes.data.comissoes || []);
      setComissoesClientes(clientesRes.data.comissoes || []);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast({
        title: 'Erro ao carregar dados financeiros.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Adicionando toast como dependência, pois ele é usado dentro da função

  useEffect(() => {
    fetchFinanceiro();
  }, [fetchFinanceiro]); // Agora o efeito depende de fetchFinanceiro, mas a função é estável

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Financeiro
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Stat>
          <StatLabel>Total Recebido</StatLabel>
          <StatNumber>R$ {resumo.totalRecebido?.toFixed(2) || 0}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Comissão Colaboradores</StatLabel>
          <StatNumber>R$ {resumo.totalComissaoColaborador?.toFixed(2) || 0}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Pago</StatLabel>
          <StatNumber>R$ {resumo.totalPago?.toFixed(2) || 0}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
      </SimpleGrid>
      <Heading size="md" mb={2}>
        Comissão dos Colaboradores
      </Heading>
      <Table variant="simple" mb={6}>
        <Thead>
          <Tr>
            <Th>Colaborador</Th>
            <Th>Comissão (R$)</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {comissoesColaboradores.map((item) => (
            <Tr key={item.colaboradorId}>
              <Td>{item.nomeColaborador}</Td>
              <Td>R$ {item.comissao?.toFixed(2) || 0}</Td>
              <Td>
                <Badge colorScheme={item.status === 'pago' ? 'green' : 'yellow'}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Heading size="md" mb={2}>
        Comissão dos Clientes
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Cliente</Th>
            <Th>Comissão (R$)</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {comissoesClientes.map((item) => (
            <Tr key={item.clienteId}>
              <Td>{item.nomeCliente}</Td>
              <Td>R$ {item.comissao?.toFixed(2) || 0}</Td>
              <Td>
                <Badge colorScheme={item.status === 'pago' ? 'green' : 'yellow'}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Financeiro;
