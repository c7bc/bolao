// src/app/components/dashboard/Admin/JogosConfig.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  useToast,
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';

const JogosConfig = () => {
  const [valorDeposito, setValorDeposito] = useState('');
  const [valores, setValores] = useState([]);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Função para buscar os valores de depósito
  const fetchValores = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/config/jogos/valores', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.valores && response.data.valores.length > 0) {
        setValores(response.data.valores);
        setHasData(true);
      } else {
        setValores([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar valores:', error);
      toast({
        title: 'Erro ao carregar valores.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setValores([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchValores();
  }, [fetchValores]);

  // Função para adicionar um novo valor de depósito
  const handleAddValor = async () => {
    if (!valorDeposito || isNaN(valorDeposito) || Number(valorDeposito) < 0) {
      toast({
        title: 'Valor inválido.',
        description: 'Por favor, insira um valor válido.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/jogos/valores', { valor: parseFloat(valorDeposito) }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Valor adicionado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setValorDeposito('');
      fetchValores();
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      toast({
        title: 'Erro ao adicionar valor.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl mb={3}>
        <FormLabel>Valor de Depósito do Jogo (R$)</FormLabel>
        <Input
          type="number"
          value={valorDeposito}
          onChange={(e) => setValorDeposito(e.target.value)}
          placeholder="Insira o valor"
          min="0"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddValor} mb={4}>
        Adicionar
      </Button>
      {loading ? (
        <Flex justify="center" align="center">
          <Spinner />
        </Flex>
      ) : hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Valor (R$)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {valores.map((item) => (
              <Tr key={item.id}>
                <Td>R$ {item.valor.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default JogosConfig;
