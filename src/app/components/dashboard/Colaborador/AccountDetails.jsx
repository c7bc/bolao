// src/app/components/dashboard/Colaborador/AccountDetails.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const AccountDetails = ({ colaboradorId }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/colaborador/details/${colaboradorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDetails(response.data.details);
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
  }, [colaboradorId]);

  if (loading) {
    return <Spinner />;
  }

  if (!details) {
    return null;
  }

  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>Detalhes da Conta</Heading>
      <Text><strong>Rua:</strong> {details.col_rua}</Text>
      <Text><strong>Número:</strong> {details.col_numero}</Text>
      <Text><strong>Bairro:</strong> {details.col_bairro}</Text>
      <Text><strong>Cidade:</strong> {details.col_cidade}</Text>
      <Text><strong>Estado:</strong> {details.col_estado}</Text>
      <Text><strong>CEP:</strong> {details.col_cep}</Text>
      <Text><strong>Data de Criação:</strong> {new Date(details.col_datacriacao).toLocaleDateString()}</Text>
    </Box>
  );
};

export default AccountDetails;
