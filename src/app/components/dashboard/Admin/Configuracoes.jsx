// src/app/components/dashboard/Admin/Configuracoes.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Select,
  Text,
  Spinner
} from '@chakra-ui/react';
import axios from 'axios';

const Configuracoes = () => {
  const [rateio, setRateio] = useState({
    premio_principal: 70,
    segundo_premio: 20,
    custos_administrativos: 10,
    comissao_colaboradores: 0,
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchRateio = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/config/rateio', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRateio(response.data.rateio);
      } catch (error) {
        console.error('Erro ao buscar configurações de rateio:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações de rateio.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRateio();
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRateio({
      ...rateio,
      [name]: parseFloat(value),
    });
  };

  const handleSubmit = async () => {
    // Validar a soma das porcentagens
    const total = Object.values(rateio).reduce((acc, val) => acc + val, 0);
    if (total !== 100) {
      toast({
        title: 'Erro de Validação',
        description: 'A soma das porcentagens deve ser 100.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/config/rateio', { rateio }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Configurações atualizadas com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações de rateio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações de rateio.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando configurações...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" mb={6}>
        Configurações de Rateio
      </Heading>
      <FormControl mb={4}>
        <FormLabel>Premio Principal (%)</FormLabel>
        <NumberInput
          name="premio_principal"
          value={rateio.premio_principal}
          onChange={handleChange}
          min={0}
          max={100}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Segundo Prêmio (%)</FormLabel>
        <NumberInput
          name="segundo_premio"
          value={rateio.segundo_premio}
          onChange={handleChange}
          min={0}
          max={100}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Custos Administrativos (%)</FormLabel>
        <NumberInput
          name="custos_administrativos"
          value={rateio.custos_administrativos}
          onChange={handleChange}
          min={0}
          max={100}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Comissão para Colaboradores (%)</FormLabel>
        <NumberInput
          name="comissao_colaboradores"
          value={rateio.comissao_colaboradores}
          onChange={handleChange}
          min={0}
          max={100}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <Button colorScheme="green" onClick={handleSubmit}>
        Salvar Configurações
      </Button>
    </Box>
  );
};

export default Configuracoes;
