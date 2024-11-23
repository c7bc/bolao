// src/app/components/dashboard/Colaborador/CommissionHistory.jsx

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

const CommissionHistory = ({ colaboradorId }) => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/colaborador/commissionhistory/${colaboradorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCommissions(response.data.commissions || []);
    } catch (error) {
      console.warn('Nenhum histórico de comissões encontrado ou índice inexistente.');
      setCommissions([]); // Fallback para lista vazia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colaboradorId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Histórico de Comissões</Heading>
      {commissions.length === 0 ? (
        <Text>Nenhuma comissão encontrada.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Cliente</Th>
              <Th>Valor da Comissão</Th>
              <Th>Data de Criação</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {commissions.map((comissao) => (
              <Tr key={comissao.fic_id}>
                <Td>{comissao.clienteNome}</Td>
                <Td>R$ {comissao.fic_comissao}</Td>
                <Td>{new Date(comissao.fic_datacriacao).toLocaleDateString()}</Td>
                <Td>{comissao.fic_status || 'Ativo'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default CommissionHistory;
