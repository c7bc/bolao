'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useToast,
  Spinner,
  Text,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import axios from 'axios';

const Configuracoes = () => {
  const [rateio, setRateio] = useState({
    rateio_10_pontos: '',
    rateio_9_pontos: '',
    rateio_menos_pontos: '',
    custos_administrativos: '',
    comissao_colaboradores: '',
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchRateio = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.get('/api/configuracoes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.configuracoes) {
        setRateio({
          rateio_10_pontos: response.data.configuracoes.rateio_10_pontos,
          rateio_9_pontos: response.data.configuracoes.rateio_9_pontos,
          rateio_menos_pontos: response.data.configuracoes.rateio_menos_pontos,
          custos_administrativos: response.data.configuracoes.custos_administrativos,
          comissao_colaboradores: response.data.configuracoes.comissao_colaboradores,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de rateio:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível carregar as configurações de rateio.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRateio();
  }, [fetchRateio]);

  const handleChange = (name, value) => {
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      setRateio(prev => ({
        ...prev,
        [name]: parsedValue,
      }));
    } else {
      setRateio(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async () => {
    const total = Object.values(rateio).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    if (total !== 100) {
      toast({
        title: 'Erro de Validação',
        description: 'A soma das porcentagens deve ser 100%.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.put('/api/configuracoes', 
        { 
          rateio_10_pontos: rateio.rateio_10_pontos,
          rateio_9_pontos: rateio.rateio_9_pontos,
          rateio_menos_pontos: rateio.rateio_menos_pontos,
          custos_administrativos: rateio.custos_administrativos,
          comissao_colaboradores: rateio.comissao_colaboradores,
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Sucesso',
        description: 'Configurações de rateio atualizadas com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações de rateio:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível atualizar as configurações de rateio.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="green.500" />
        <Text mt={4}>Carregando configurações...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxWidth="800px" mx="auto">
      <Heading as="h2" size="xl" mb={6} textAlign="center" color="green.600">
        Configurações de Rateio
      </Heading>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        <GridItem>
          <FormControl isRequired>
            <FormLabel>Porcentagem para 10 Pontos</FormLabel>
            <NumberInput
              value={rateio.rateio_10_pontos}
              onChange={(value) => handleChange('rateio_10_pontos', value)}
              min={0}
              max={100}
              precision={2}
            >
              <NumberInputField placeholder="Ex: 40" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl isRequired>
            <FormLabel>Porcentagem para 9 Pontos</FormLabel>
            <NumberInput
              value={rateio.rateio_9_pontos}
              onChange={(value) => handleChange('rateio_9_pontos', value)}
              min={0}
              max={100}
              precision={2}
            >
              <NumberInputField placeholder="Ex: 30" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl isRequired>
            <FormLabel>Porcentagem para Menos Pontos</FormLabel>
            <NumberInput
              value={rateio.rateio_menos_pontos}
              onChange={(value) => handleChange('rateio_menos_pontos', value)}
              min={0}
              max={100}
              precision={2}
            >
              <NumberInputField placeholder="Ex: 20" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl isRequired>
            <FormLabel>Custos Administrativos (%)</FormLabel>
            <NumberInput
              value={rateio.custos_administrativos}
              onChange={(value) => handleChange('custos_administrativos', value)}
              min={0}
              max={100}
              precision={2}
            >
              <NumberInputField placeholder="Ex: 10" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl isRequired>
            <FormLabel>Comissão para Colaboradores (%)</FormLabel>
            <NumberInput
              value={rateio.comissao_colaboradores}
              onChange={(value) => handleChange('comissao_colaboradores', value)}
              min={0}
              max={100}
              precision={2}
            >
              <NumberInputField placeholder="Ex: 0" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>
      </Grid>

      <Box textAlign="center" mt={8}>
        <Button colorScheme="green" size="lg" onClick={handleSubmit}>
          Salvar Configurações
        </Button>
      </Box>

      <Box mt={6} textAlign="center">
        <Text color="gray.500">Total: {Object.values(rateio).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)}%</Text>
      </Box>
    </Box>
  );
};

export default Configuracoes;
