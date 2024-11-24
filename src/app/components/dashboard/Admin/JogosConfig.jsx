// src/app/components/dashboard/Admin/JogosConfig.jsx

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
} from '@chakra-ui/react';
import axios from '../../../utils/axios'; // Ajuste o caminho conforme necessário

const JogosConfig = () => {
  const [valorDeposito, setValorDeposito] = useState('');
  const [valores, setValores] = useState([]);
  const [hasData, setHasData] = useState(false);

  // Função para buscar os valores de depósito
  const fetchValores = useCallback(async () => {
    try {
      const response = await axios.get('/api/config/jogos/valores');
      if (response.data.valores && response.data.valores.length > 0) {
        setValores(response.data.valores);
        setHasData(true);
      } else {
        setValores([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar valores:', error);
      setValores([]);
      setHasData(false);
    }
  }, []);

  useEffect(() => {
    fetchValores();
  }, [fetchValores]);

  // Função para adicionar um novo valor de depósito
  const handleAddValor = async () => {
    if (!valorDeposito) {
      alert('Por favor, insira um valor válido.');
      return;
    }
    try {
      await axios.post('/api/config/jogos/valores', { valor: parseFloat(valorDeposito) });
      alert('Valor adicionado com sucesso!');
      setValorDeposito('');
      fetchValores();
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      alert('Erro ao adicionar valor. Por favor, tente novamente.');
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
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddValor} mb={4}>
        Adicionar
      </Button>
      {hasData ? (
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
