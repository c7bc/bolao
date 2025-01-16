// src/app/components/dashboard/Admin/TaxasComissaoConfig.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Select,
  Textarea,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import axios from 'axios';

const TaxasComissaoConfig = () => {
  const [formData, setFormData] = useState({
    perfil: '',
    porcentagem: '',
    descricao: '',
  });
  const [taxas, setTaxas] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchTaxas = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/config/taxasComissao', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTaxas(response.data.taxas);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as taxas de comissão.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchTaxas();
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    // Validações
    if (!formData.perfil || !formData.porcentagem) {
      toast({
        title: 'Perfil e Porcentagem são obrigatórios.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (isNaN(formData.porcentagem) || formData.porcentagem < 0 || formData.porcentagem > 100) {
      toast({
        title: 'Porcentagem inválida. Deve ser um número entre 0 e 100.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Preparar payload
    const payload = {
      perfil: formData.perfil,
      porcentagem: parseFloat(formData.porcentagem),
      descricao: formData.descricao,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/taxasComissao/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Taxa de Comissão configurada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Resetar formulário
      setFormData({
        perfil: '',
        porcentagem: '',
        descricao: '',
      });

      // Atualizar a lista de taxas
      const response = await axios.get('/api/config/taxasComissao', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTaxas(response.data.taxas);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível configurar a taxa de comissão.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} bg="white" shadow="md" borderRadius="md">
      <Stack spacing={4} mb={6}>
        {/* Perfil Relacionado */}
        <FormControl isRequired>
          <FormLabel>Perfil Relacionado</FormLabel>
          <Select
            name="perfil"
            value={formData.perfil}
            onChange={handleInputChange}
            placeholder="Selecione o Perfil"
          >
            <option value="Jogos">Jogos</option>
            <option value="Outros">Outros</option>
          </Select>
        </FormControl>

        {/* Porcentagem da Taxa de Comissão */}
        <FormControl isRequired>
          <FormLabel>Porcentagem da Taxa de Comissão (%)</FormLabel>
          <Input
            name="porcentagem"
            type="number"
            value={formData.porcentagem}
            onChange={handleInputChange}
            placeholder="Ex: 5"
            min="0"
            max="100"
          />
        </FormControl>

        {/* Descrição Opcional */}
        <FormControl>
          <FormLabel>Descrição (Opcional)</FormLabel>
          <Textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            placeholder="Descreva a taxa de comissão (opcional)"
          />
        </FormControl>

        {/* Botão de Submissão */}
        <Button colorScheme="blue" onClick={handleSubmit}>
          Salvar Taxa de Comissão
        </Button>
      </Stack>

      {/* Tabela de Taxas Configuradas */}
      {taxas.length > 0 && (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Perfil</Th>
              <Th>Porcentagem (%)</Th>
              <Th>Descrição</Th>
            </Tr>
          </Thead>
          <Tbody>
            {taxas.map((taxa) => (
              <Tr key={taxa.rateio_id}>
                <Td>{taxa.perfil.charAt(0).toUpperCase() + taxa.perfil.slice(1)}</Td>
                <Td>{taxa.porcentagem.toFixed(2)}%</Td>
                <Td>{taxa.descricao || 'N/A'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default TaxasComissaoConfig;
