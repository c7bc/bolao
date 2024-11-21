// app/components/Admin/RecebimentoConfig.jsx

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

const RecebimentoConfig = () => {
  const [recebimentos, setRecebimentos] = useState([]);
  const [formData, setFormData] = useState({
    tipo: '',
    nome_titular: '',
    chave_pix: '',
    status: 'ativo',
    agencia: '',
    conta: '',
    banco: '',
    tipo_chave: '',
  });
  const toast = useToast();

  const fetchRecebimentos = async () => {
    // Substitua pelo endpoint correto
    const response = await axios.get('/api/config/recebimentos');
    setRecebimentos(response.data.recebimentos);
  };

  useEffect(() => {
    fetchRecebimentos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddRecebimento = async () => {
    try {
      await axios.post('/api/config/recebimentos', formData);
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
        status: 'ativo',
        agencia: '',
        conta: '',
        banco: '',
        tipo_chave: '',
      });
      fetchRecebimentos();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar recebimento.',
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
        <FormLabel>Tipo</FormLabel>
        <Select name="tipo" value={formData.tipo} onChange={handleInputChange}>
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
        />
      </FormControl>
      {/* Adicione outros campos conforme necessário */}
      <Button colorScheme="green" onClick={handleAddRecebimento}>
        Adicionar
      </Button>
      <Table variant="simple" mt={4}>
        <Thead>
          <Tr>
            <Th>Tipo</Th>
            <Th>Nome do Titular</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {recebimentos.map((item) => (
            <Tr key={item.id}>
              <Td>{item.tipo}</Td>
              <Td>{item.nome_titular}</Td>
              <Td>{item.status}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default RecebimentoConfig;
