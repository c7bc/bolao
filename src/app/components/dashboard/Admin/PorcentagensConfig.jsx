// src/app/components/dashboard/Admin/PorcentagensConfig.jsx
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
  Text,
  Spinner,
  useToast,
  Flex
} from '@chakra-ui/react';
import axios from 'axios';

const PorcentagensConfig = () => {
  const [porcentagens, setPorcentagens] = useState([]);
  const [formData, setFormData] = useState({
    perfil: '',
    colaboradorId: '',
    porcentagem: '',
    descricao: '',
  });
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Função para buscar as porcentagens
  const fetchPorcentagens = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/config/porcentagens', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.porcentagens && response.data.porcentagens.length > 0) {
        setPorcentagens(response.data.porcentagens);
        setHasData(true);
      } else {
        setPorcentagens([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar porcentagens:', error);
      toast({
        title: 'Erro ao carregar porcentagens.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setPorcentagens([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPorcentagens();
  }, [fetchPorcentagens]);

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para adicionar uma nova porcentagem
  const handleAddPorcentagem = async () => {
    const { perfil, colaboradorId, porcentagem } = formData;
    if (!perfil || (perfil === 'colaborador' && !colaboradorId) || !porcentagem) {
      toast({
        title: 'Campos obrigatórios faltando.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (isNaN(porcentagem) || Number(porcentagem) < 0 || Number(porcentagem) > 100) {
      toast({
        title: 'Porcentagem inválida.',
        description: 'Por favor, insira uma porcentagem entre 0 e 100.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/porcentagens', {
        perfil: formData.perfil,
        colaboradorId: formData.perfil === 'colaborador' ? formData.colaboradorId : null,
        porcentagem: parseFloat(formData.porcentagem),
        descricao: formData.descricao,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Porcentagem adicionada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({
        perfil: '',
        colaboradorId: '',
        porcentagem: '',
        descricao: '',
      });
      fetchPorcentagens();
    } catch (error) {
      console.error('Erro ao adicionar porcentagem:', error);
      toast({
        title: 'Erro ao adicionar porcentagem.',
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
        <FormLabel>Perfil</FormLabel>
        <Select name="perfil" value={formData.perfil} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="jogos">Jogos</option>
          <option value="colaborador">Colaborador</option>
        </Select>
      </FormControl>
      {formData.perfil === 'colaborador' && (
        <FormControl isRequired mb={3}>
          <FormLabel>Colaborador ID</FormLabel>
          <Input
            name="colaboradorId"
            value={formData.colaboradorId}
            onChange={handleInputChange}
            placeholder="ID do colaborador"
          />
        </FormControl>
      )}
      <FormControl isRequired mb={3}>
        <FormLabel>Porcentagem (%)</FormLabel>
        <Input
          type="number"
          name="porcentagem"
          value={formData.porcentagem}
          onChange={handleInputChange}
          placeholder="Insira a porcentagem"
          min="0"
          max="100"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Descrição</FormLabel>
        <Input
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
          placeholder="Descrição opcional"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddPorcentagem} mb={4}>
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
              <Th>Perfil</Th>
              <Th>Colaborador ID</Th>
              <Th>Porcentagem (%)</Th>
              <Th>Descrição</Th>
            </Tr>
          </Thead>
          <Tbody>
            {porcentagens.map((item) => (
              <Tr key={item.id}>
                <Td>{item.perfil.charAt(0).toUpperCase() + item.perfil.slice(1)}</Td>
                <Td>{item.colaboradorId || 'N/A'}</Td>
                <Td>{item.porcentagem}%</Td>
                <Td>{item.descricao || 'N/A'}</Td>
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

export default PorcentagensConfig;
