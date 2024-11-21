// app/components/Admin/PorcentagensConfig.jsx

import React, { useState, useEffect } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const PorcentagensConfig = () => {
  const [porcentagens, setPorcentagens] = useState([]);
  const [formData, setFormData] = useState({
    perfil: '',
    porcentagem: '',
    descricao: '',
  });
  const toast = useToast();

  const fetchPorcentagens = async () => {
    // Substitua pelo endpoint correto
    const response = await axios.get('/api/config/porcentagens');
    setPorcentagens(response.data.porcentagens);
  };

  useEffect(() => {
    fetchPorcentagens();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddPorcentagem = async () => {
    try {
      await axios.post('/api/config/porcentagens', formData);
      toast({
        title: 'Porcentagem adicionada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({
        perfil: '',
        porcentagem: '',
        descricao: '',
      });
      fetchPorcentagens();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar porcentagem.',
        description: error.response.data.error || 'Erro desconhecido.',
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
          <option value="jogos">Jogos</option>
          <option value="colaborador">Colaborador</option>
        </Select>
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Porcentagem (%)</FormLabel>
        <Input
          type="number"
          name="porcentagem"
          value={formData.porcentagem}
          onChange={handleInputChange}
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Descrição</FormLabel>
        <Input
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddPorcentagem}>
        Adicionar
      </Button>
      <Table variant="simple" mt={4}>
        <Thead>
          <Tr>
            <Th>Perfil</Th>
            <Th>Porcentagem (%)</Th>
            <Th>Descrição</Th>
          </Tr>
        </Thead>
        <Tbody>
          {porcentagens.map((item) => (
            <Tr key={item.id}>
              <Td>{item.perfil}</Td>
              <Td>{item.porcentagem}%</Td>
              <Td>{item.descricao}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PorcentagensConfig;
