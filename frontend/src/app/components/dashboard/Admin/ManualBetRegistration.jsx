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
  useToast,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Spinner,
  IconButton,
  Badge,
  Checkbox,
  Container,
  Stack,
  useBreakpointValue,
  SimpleGrid,
  Flex,
  TableContainer,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import axios from 'axios';

const ManualBetRegistration = () => {
  const [clientes, setClientes] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [gameDetails, setGameDetails] = useState(null);
  const [numbers, setNumbers] = useState([[]]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [numOfAutoBilhetes, setNumOfAutoBilhetes] = useState('1'); // Alterado para string
  const toast = useToast();

  // Configurações responsivas
  const stackDirection = useBreakpointValue({ base: 'column', md: 'row' });
  const containerWidth = useBreakpointValue({ base: '100%', md: '90%', lg: '80%' });
  const inputSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const spacing = useBreakpointValue({ base: 2, md: 4 });

  const fetchClientes = useCallback(async (search = '') => {
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/superadmin/clients/search?q=${search}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClientes(response.data.clients);
    } catch (error) {
      toast({
        title: 'Erro ao buscar clientes',
        description: error.response?.data?.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSearchLoading(false);
    }
  }, [toast]);

  const fetchJogos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/jogos/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJogos(response.data.jogos.filter(jogo => jogo.jog_status === 'aberto'));
    } catch (error) {
      toast({
        title: 'Erro ao buscar jogos',
        description: error.response?.data?.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const fetchGameDetails = useCallback(async (slug) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jogos/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGameDetails(response.data.jogo);
    } catch (error) {
      toast({
        title: 'Erro ao buscar detalhes do jogo',
        description: error.response?.data?.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const generateRandomNumbers = (min, max, uniqueCount) => {
    const minNum = parseInt(min, 10);
    const maxNum = parseInt(max, 10);
    
    if (minNum >= maxNum) {
      return [];
    }

    let numbersSet = new Set();
    let attempts = 0;
    const maxAttempts = 100;

    while (numbersSet.size < uniqueCount && attempts < maxAttempts) {
      const number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
      if (number >= minNum && number <= maxNum) {
        numbersSet.add(number);
      }
      attempts++;
    }

    return Array.from(numbersSet).sort((a, b) => a - b);
  };

  const updateNumbers = useCallback(() => {
    if (autoGenerate && gameDetails) {
      const numBilhetes = parseInt(numOfAutoBilhetes, 10) || 1; // Adicione esta conversão
      const newNumbers = Array(numBilhetes).fill(null).map(() => 
        generateRandomNumbers(
          gameDetails.numeroInicial,
          gameDetails.numeroFinal,
          gameDetails.numeroPalpites
        )
      );
      setNumbers(newNumbers);
    } else {
      setNumbers([[]]);
    }
  }, [autoGenerate, gameDetails, numOfAutoBilhetes]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  useEffect(() => {
    if (selectedGame) {
      fetchGameDetails(selectedGame);
    }
  }, [selectedGame, fetchGameDetails]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (clientSearch) {
        fetchClientes(clientSearch);
      }
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [clientSearch, fetchClientes]);

  useEffect(() => {
    updateNumbers();
  }, [autoGenerate, numOfAutoBilhetes, gameDetails, updateNumbers]);

  const handleAddNumber = () => {
    setNumbers(prev => [...prev, []]);
  };

  const handleRemoveNumber = (index) => {
    setNumbers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleNumberChange = (index, position, value) => {
    setNumbers(prev => {
      const newNumbers = [...prev];
      if (!newNumbers[index]) {
        newNumbers[index] = [];
      }
      newNumbers[index] = [...newNumbers[index]];
      
      // Converte o valor para número, usando 0 como fallback
      const numValue = parseInt(value, 10) || 0;
      
      // Atualiza o array com o número
      newNumbers[index][position] = numValue;
      
      return newNumbers;
    });
  };

  const validateNumbers = () => {
    if (!gameDetails) return false;

    for (const numberSet of numbers) {
      if (numberSet.length !== gameDetails.numeroPalpites) {
        return false;
      }

      for (const num of numberSet) {
        if (num < gameDetails.numeroInicial || num > gameDetails.numeroFinal || !Number.isInteger(num)) {
          return false;
        }
      }

      const uniqueNumbers = new Set(numberSet);
      if (uniqueNumbers.size !== numberSet.length) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedGame || !validateNumbers()) {
      toast({
        title: 'Dados inválidos',
        description: 'Por favor, verifique todos os campos e números escolhidos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/superadmin/manual-bet',
        {
          clientId: selectedClient,
          gameId: selectedGame,
          numbers: numbers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Aposta registrada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setSelectedClient('');
      setSelectedGame('');
      setNumbers([[]]);
      setClientSearch('');
      setAutoGenerate(false);
      setNumOfAutoBilhetes(1);
    } catch (error) {
      toast({
        title: 'Erro ao registrar aposta',
        description: error.response?.data?.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW={containerWidth} p={4}>
      <VStack spacing={spacing} align="stretch">
        <FormControl>
          <FormLabel>Buscar Cliente</FormLabel>
          <Input
            size={inputSize}
            placeholder="Digite o nome ou email do cliente"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
        </FormControl>

        {searchLoading ? (
          <Spinner />
        ) : (
          <Box maxH={{ base: "300px", md: "200px" }} overflowY="auto">
            <TableContainer>
              <Table variant="simple" size={inputSize}>
                <Thead position="sticky" top={0} bg="white" zIndex={1}>
                  <Tr>
                    <Th>Nome</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Email</Th>
                    <Th>Status</Th>
                    <Th>Ação</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {clientes.map((cliente) => (
                    <Tr key={cliente.cli_id}>
                      <Td>{cliente.cli_nome}</Td>
                      <Td display={{ base: 'none', md: 'table-cell' }}>{cliente.cli_email}</Td>
                      <Td>
                        <Badge
                          colorScheme={cliente.cli_status === 'active' ? 'green' : 'red'}
                        >
                          {cliente.cli_status}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size={buttonSize}
                          colorScheme={selectedClient === cliente.cli_id ? 'green' : 'blue'}
                          onClick={() => setSelectedClient(cliente.cli_id)}
                        >
                          {selectedClient === cliente.cli_id ? 'Selecionado' : 'Selecionar'}
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <FormControl>
          <FormLabel>Selecionar Jogo</FormLabel>
          <Select
            size={inputSize}
            placeholder="Escolha um jogo"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            {jogos.map((jogo) => (
              <option key={jogo.slug} value={jogo.slug}>
                {jogo.jog_nome}
              </option>
            ))}
          </Select>
        </FormControl>

        {gameDetails && (
          <Box>
            <Text fontSize={{ base: "sm", md: "md" }} mb={2}>
              Configure os números para cada bilhete:
            </Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" mb={4}>
              Escolha {gameDetails.numeroPalpites} números entre{' '}
              {gameDetails.numeroInicial} e {gameDetails.numeroFinal}
            </Text>

            <Stack direction={stackDirection} mb={4} spacing={spacing}>
              <Checkbox 
                size={inputSize}
                isChecked={autoGenerate} 
                onChange={(e) => setAutoGenerate(e.target.checked)}
              >
                Gerar Automático
              </Checkbox>
              {autoGenerate && (
  <NumberInput 
    size={inputSize}
    min={1} 
    value={numOfAutoBilhetes}
    onChange={(valueString) => {
      // Garante que o valor seja sempre uma string válida
      const value = valueString === '' ? '1' : valueString;
      setNumOfAutoBilhetes(value);
    }}
  >
    <NumberInputField />
    <NumberInputStepper>
      <NumberIncrementStepper />
      <NumberDecrementStepper />
    </NumberInputStepper>
  </NumberInput>
)}
            </Stack>

            {!autoGenerate && numbers.map((numberSet, index) => (
              <Stack 
                key={index} 
                direction={{ base: 'column', md: 'row' }} 
                mb={4} 
                spacing={spacing}
                align="center"
              >
                <Text>Bilhete {index + 1}:</Text>
                <SimpleGrid 
                  columns={{ base: 3, sm: 4, md: gameDetails.numeroPalpites }} 
                  spacing={2}
                >
                  {Array.from({ length: gameDetails.numeroPalpites }).map((_, pos) => (
                   <NumberInput
                   key={pos}
                   size={inputSize}
                   min={gameDetails.numeroInicial}
                   max={gameDetails.numeroFinal}
                   value={String(numberSet[pos] || 0)} // Força a conversão para string
                   keepWithinRange={true}
                   allowMouseWheel={false}
                   onChange={(valueString) => handleNumberChange(index, pos, valueString)}
                 >
                   <NumberInputField />
                   <NumberInputStepper>
                     <NumberIncrementStepper />
                     <NumberDecrementStepper />
                   </NumberInputStepper>
                 </NumberInput>
                  ))}
                </SimpleGrid>
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  size={buttonSize}
                  onClick={() => handleRemoveNumber(index)}
                  isDisabled={numbers.length === 1}
                />
              </Stack>
            ))}

            {!autoGenerate && (
              <Button
                leftIcon={<AddIcon />}
                onClick={handleAddNumber}
                size={buttonSize}
                mb={4}
              >
                Adicionar Bilhete
              </Button>
            )}

            {autoGenerate && 
              <VStack spacing={2} mb={4} align="stretch">
                {numbers.map((numberSet, index) => (
                  <Text key={index} fontSize={{ base: "sm", md: "md" }}>
                    Bilhete {index + 1}: {numberSet.join(', ')}
                  </Text>
                ))}
              </VStack>
            }
          </Box>
        )}

        <Button
          colorScheme="green"
          onClick={handleSubmit}
          isLoading={loading}
          size={buttonSize}
          isDisabled={!selectedClient || !selectedGame || !validateNumbers()}
          w={{ base: "100%", md: "auto" }}
        >
          Registrar Aposta
        </Button>
      </VStack>
    </Container>
  );
};

export default ManualBetRegistration;