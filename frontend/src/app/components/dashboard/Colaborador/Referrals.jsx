// src/app/components/dashboard/Colaborador/Referrals.jsx

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

const Referrals = ({ colaboradorId }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/colaborador/referrals/${colaboradorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReferrals(response.data.referrals || []);
    } catch (error) {
      console.warn('Nenhum indicado encontrado ou índice inexistente.');
      setReferrals([]); // Fallback para lista vazia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colaboradorId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Indicados</Heading>
      {referrals.length === 0 ? (
        <Text>Nenhum indicado encontrado.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Data de Cadastro</Th>
            </Tr>
          </Thead>
          <Tbody>
            {referrals.map((cliente) => (
              <Tr key={cliente.cli_id}>
                <Td>{cliente.cli_nome}</Td>
                <Td>{cliente.cli_email}</Td>
                <Td>{cliente.cli_telefone}</Td>
                <Td>{new Date(cliente.cli_datacriacao).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default Referrals;
