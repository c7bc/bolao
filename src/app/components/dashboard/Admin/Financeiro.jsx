// app/components/Admin/Financeiro.jsx

import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import axios from 'axios';

const Financeiro = () => {
  const [resumo, setResumo] = useState({
    totalRecebido: 0,
    totalComissaoColaborador: 0,
    totalPago: 0,
  });
  const [comissoesColaboradores, setComissoesColaboradores] = useState([]);
  const [comissoesClientes, setComissoesClientes] = useState([]);

  const fetchFinanceiro = async () => {
    // Substitua pelos endpoints corretos
    const resumoResponse = await axios.get('/api/financeiro/resumo');
    const colaboradoresResponse = await axios.get('/api/financeiro/colaboradores');
    const clientesResponse = await axios.get('/api/financeiro/clientes');

    setResumo(resumoResponse.data);
    setComissoesColaboradores(colaboradoresResponse.data.comissoes);
    setComissoesClientes(clientesResponse.data.comissoes);
  };

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Financeiro
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Stat>
          <StatLabel>Total Recebido</StatLabel>
          <StatNumber>R$ {resumo.totalRecebido}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Comissão Colaboradores</StatLabel>
          <StatNumber>R$ {resumo.totalComissaoColaborador}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Pago</StatLabel>
          <StatNumber>R$ {resumo.totalPago}</StatNumber>
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
          </Tr>
        </Thead>
        <Tbody>
          {comissoesColaboradores.map((item) => (
            <Tr key={item.colaboradorId}>
              <Td>{item.nomeColaborador}</Td>
              <Td>R$ {item.comissao}</Td>
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
          </Tr>
        </Thead>
        <Tbody>
          {comissoesClientes.map((item) => (
            <Tr key={item.clienteId}>
              <Td>{item.nomeCliente}</Td>
              <Td>R$ {item.comissao}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Financeiro;
