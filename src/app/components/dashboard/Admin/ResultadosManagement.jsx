// Caminho: src/app/components/dashboard/Admin/ResultadosManagement.jsx
// src/app/components/dashboard/Admin/ResultadosManagement.jsx

'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  SimpleGrid,
  useToast,
  FormHelperText,
} from '@chakra-ui/react';
import axios from 'axios';

const ResultadosManagement = () => {
  const [formData, setFormData] = useState({
    concurso: '',
    tipo_jogo: 'MEGA', // Valor padrão para Mega-Sena
    numeros: ['', '', '', '', '', ''], // Seis campos para Mega-Sena
    data_sorteio: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('numero')) {
      const index = parseInt(name.split('_')[1], 10) - 1;
      const newNumeros = [...formData.numeros];
      newNumeros[index] = value;
      setFormData({ ...formData, numeros: newNumeros });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    // Validações
    if (!formData.concurso) {
      toast({
        title: 'Concurso é obrigatório.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Verificar se todos os números estão preenchidos
    const allNumbersFilled = formData.numeros.every(num => num !== '');
    if (!allNumbersFilled) {
      toast({
        title: 'Todos os números devem ser preenchidos.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Automatizar data e hora do sorteio
    const currentDate = new Date();
    const data_sorteio = currentDate.toISOString(); // ISO string para data e hora

    // Preparar payload
    const payload = {
      concurso: formData.concurso,
      tipo_jogo: formData.tipo_jogo,
      numeros: formData.numeros.join(','),
      data_sorteio,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/resultados/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Resultado registrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Resetar formulário
      setFormData({
        concurso: '',
        tipo_jogo: 'MEGA',
        numeros: ['', '', '', '', '', ''],
        data_sorteio: '',
      });
    } catch (error) {
      console.error('Erro ao registrar resultado:', error);
      toast({
        title: 'Erro ao registrar resultado.',
        description: error.response?.data?.message || 'Ocorreu um erro inesperado.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} bg="white" shadow="md" borderRadius="md">
      <Stack spacing={4}>
        {/* Concurso */}
        <FormControl isRequired>
          <FormLabel>Concurso</FormLabel>
          <Input
            name="concurso"
            value={formData.concurso}
            onChange={handleInputChange}
            placeholder="Número do Concurso"
          />
        </FormControl>

        {/* Tipo de Jogo */}
        <FormControl isRequired>
          <FormLabel>Tipo de Jogo</FormLabel>
          <Select
            name="tipo_jogo"
            value={formData.tipo_jogo}
            onChange={handleInputChange}
          >
            <option value="MEGA">Mega-Sena</option>
            <option value="LOTOFACIL">Lotofácil</option>
            <option value="JOGO_DO_BICHO">Jogo do Bicho</option>
          </Select>
        </FormControl>

        {/* Inserção dos Números Sorteados - Específico para Mega-Sena */}
        {formData.tipo_jogo === 'MEGA' && (
          <FormControl isRequired>
            <FormLabel>Números Sorteados</FormLabel>
            <SimpleGrid columns={[3, 3, 6]} spacing={4}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <NumberInput
                  key={num}
                  min={1}
                  max={60}
                  value={formData.numeros[num - 1]}
                  onChange={handleInputChange}
                >
                  <NumberInputField name={`numero_${num}`} placeholder={`N° ${num}`} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              ))}
            </SimpleGrid>
            <FormHelperText>Insira os 6 números sorteados.</FormHelperText>
          </FormControl>
        )}

        {/* Data do Sorteio */}
        <FormControl isRequired>
          <FormLabel>Data do Sorteio</FormLabel>
          <Input
            type="datetime-local"
            name="data_sorteio"
            value={formData.data_sorteio}
            onChange={handleInputChange}
            isReadOnly
            placeholder="Data e Hora do Sorteio"
          />
          <FormHelperText>Preenchido automaticamente com a data e hora atual.</FormHelperText>
        </FormControl>

        {/* Botão de Submissão */}
        <Button colorScheme="blue" onClick={handleSubmit}>
          Registrar Resultado
        </Button>
      </Stack>
    </Box>
  );
};

export default ResultadosManagement;
