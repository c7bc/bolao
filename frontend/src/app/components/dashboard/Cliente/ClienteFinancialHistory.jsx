// Caminho: src/app/components/dashboard/Cliente/ClienteFinancialHistory.jsx (Linhas: 84)
// src/app/components/dashboard/Cliente/ClienteFinancialHistory.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const ClienteFinancialHistory = ({ clienteId }) => {
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchFinancials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cliente/financialhistory/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFinancials(response.data.financials || []);
    } catch (error) {
      console.warn('Nenhum histórico financeiro encontrado ou índice inexistente.');
      setFinancials([]); // Fallback para lista vazia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Histórico Financeiro</Heading>
      {financials.length === 0 ? (
        <Text>Nenhum registro financeiro encontrado.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Transação</Th>
              <Th>Valor</Th>
              <Th>Data</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {financials.map((finance) => (
              <Tr key={finance.fin_id}>
                <Td>{finance.fin_tipo}</Td>
                <Td>R$ {finance.fin_valor}</Td>
                <Td>{new Date(finance.fin_data).toLocaleDateString()}</Td>
                <Td>{finance.fin_status}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ClienteFinancialHistory;
