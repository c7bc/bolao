// app/components/Admin/JogosConfig.jsx

import React, { useState, useEffect } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const JogosConfig = () => {
  const [valorDeposito, setValorDeposito] = useState('');
  const [valores, setValores] = useState([]);
  const toast = useToast();

  const fetchValores = async () => {
    // Substitua pelo endpoint correto
    const response = await axios.get('/api/config/jogos/valores');
    setValores(response.data.valores);
  };

  useEffect(() => {
    fetchValores();
  }, []);

  const handleAddValor = async () => {
    try {
      await axios.post('/api/config/jogos/valores', { valor: valorDeposito });
      toast({
        title: 'Valor adicionado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setValorDeposito('');
      fetchValores();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar valor.',
        description: error.response.data.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl mb={3}>
        <FormLabel>Valor de Depósito do Jogo</FormLabel>
        <Input
          type="number"
          value={valorDeposito}
          onChange={(e) => setValorDeposito(e.target.value)}
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddValor}>
        Adicionar
      </Button>
      <Table variant="simple" mt={4}>
        <Thead>
          <Tr>
            <Th>Valor (R$)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {valores.map((item) => (
            <Tr key={item.id}>
              <Td>R$ {item.valor}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default JogosConfig;
