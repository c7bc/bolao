// src/app/components/dashboard/Cliente/AccountDetails.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const AccountDetails = ({ clienteId }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cliente/details/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDetails(response.data.cliente);
    } catch (error) {
      console.error('Erro ao buscar detalhes da conta:', error);
      toast({
        title: 'Erro ao carregar detalhes da conta.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  if (loading) {
    return <Spinner />;
  }

  if (!details) {
    return null;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Detalhes da Conta</Heading>
      <Text><strong>Nome:</strong> {details.cli_nome}</Text>
      <Text><strong>Email:</strong> {details.cli_email}</Text>
      <Text><strong>Telefone:</strong> {details.cli_telefone}</Text>
      <Text><strong>Status:</strong> {details.cli_status}</Text>
      <Text><strong>ID do Colaborador:</strong> {details.cli_idcolaborador || 'N/A'}</Text>
      <Text><strong>Data de Criação:</strong> {new Date(details.cli_datacriacao).toLocaleDateString()}</Text>
    </Box>
  );
};

export default AccountDetails;
