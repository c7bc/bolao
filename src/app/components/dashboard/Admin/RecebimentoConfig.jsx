// src/app/components/dashboard/Admin/RecebimentoConfig.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { Flex } from '@chakra-ui/react';

const RecebimentoConfig = () => {
  const [recebimentos, setRecebimentos] = useState([]);
  const [formData, setFormData] = useState({
    tipo: '',
    nome_titular: '',
    chave_pix: '',
    tipo_chave: '',
    status: 'ativo',
    agencia: '',
    conta: '',
    banco: '',
  });
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Função para buscar os recebimentos
  const fetchRecebimentos = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/config/recebimentos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.recebimentos && response.data.recebimentos.length > 0) {
        setRecebimentos(response.data.recebimentos);
        setHasData(true);
      } else {
        setRecebimentos([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar recebimentos:', error);
      toast({
        title: 'Erro ao carregar recebimentos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setRecebimentos([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para adicionar um novo recebimento
  const handleAddRecebimento = async () => {
    const { tipo, nome_titular, chave_pix, tipo_chave } = formData;
    if (!tipo || !nome_titular || !chave_pix || !tipo_chave) {
      toast({
        title: 'Campos obrigatórios faltando.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/recebimentos', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Recebimento adicionado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({
        tipo: '',
        nome_titular: '',
        chave_pix: '',
        tipo_chave: '',
        status: 'ativo',
        agencia: '',
        conta: '',
        banco: '',
      });
      fetchRecebimentos();
    } catch (error) {
      console.error('Erro ao adicionar recebimento:', error);
      toast({
        title: 'Erro ao adicionar recebimento.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl isRequired mb={3}>
        <FormLabel>Tipo</FormLabel>
        <Select name="tipo" value={formData.tipo} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="pix">PIX</option>
          <option value="banco">Banco</option>
        </Select>
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Nome do Titular</FormLabel>
        <Input
          name="nome_titular"
          value={formData.nome_titular}
          onChange={handleInputChange}
          placeholder="Nome completo"
        />
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Chave PIX</FormLabel>
        <Input
          name="chave_pix"
          value={formData.chave_pix}
          onChange={handleInputChange}
          placeholder="Chave PIX"
        />
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Tipo da Chave</FormLabel>
        <Select name="tipo_chave" value={formData.tipo_chave} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="cpf">CPF</option>
          <option value="telefone">Telefone</option>
          <option value="email">Email</option>
        </Select>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Status</FormLabel>
        <Select name="status" value={formData.status} onChange={handleInputChange}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Agência</FormLabel>
        <Input
          name="agencia"
          value={formData.agencia}
          onChange={handleInputChange}
          placeholder="Agência"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Conta</FormLabel>
        <Input
          name="conta"
          value={formData.conta}
          onChange={handleInputChange}
          placeholder="Conta"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Banco</FormLabel>
        <Input
          name="banco"
          value={formData.banco}
          onChange={handleInputChange}
          placeholder="Banco"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddRecebimento} mb={4}>
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
              <Th>Tipo</Th>
              <Th>Nome do Titular</Th>
              <Th>Status</Th>
              <Th>Agência</Th>
              <Th>Conta</Th>
              <Th>Banco</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recebimentos.map((item) => (
              <Tr key={item.id}>
                <Td>{item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</Td>
                <Td>{item.nome_titular}</Td>
                <Td>
                  <Badge
                    colorScheme={item.status === 'ativo' ? 'green' : 'red'}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </Td>
                <Td>{item.agencia || 'N/A'}</Td>
                <Td>{item.conta || 'N/A'}</Td>
                <Td>{item.banco || 'N/A'}</Td>
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

export default RecebimentoConfig;
