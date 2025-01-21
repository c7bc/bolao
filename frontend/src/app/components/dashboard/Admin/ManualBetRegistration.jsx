// frontend\src\app\components\dashboard\Admin\ManualBetRegistration.jsx

'use client';

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
  const [numOfAutoBilhetes, setNumOfAutoBilhetes] = useState(1);
  const toast = useToast();

  // Fetch clients with debounced search
  const fetchClientes = async (search = '') => {
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
  };

  // Fetch open games
  const fetchJogos = async () => {
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
  };

  // Fetch game details by slug
  const fetchGameDetails = async (slug) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jogos/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGameDetails(response.data.jogo);
      updateNumbers(autoGenerate); // Update numbers based on autoGenerate state
    } catch (error) {
      toast({
        title: 'Erro ao buscar detalhes do jogo',
        description: error.response?.data?.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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
  }, [clientSearch, fetchClientes]);  // Adicione `fetchClientes` nas dependências

// Generate random numbers adhering to game rules
const generateRandomNumbers = (min, max, uniqueCount) => {
    // Converte min e max para números inteiros
    const minNum = parseInt(min, 10);
    const maxNum = parseInt(max, 10);

    // Verificar se min é menor que max
    if (minNum >= maxNum) {
      return [];
    }
  
    console.log(`Número inicial: ${minNum}, Número máximo: ${maxNum}, Total de números únicos necessários: ${uniqueCount}`);
  
    const numbers = new Set();
    const maxAttempts = 100; // Previne loop infinito
    let attempts = 0;

    while (numbers.size < uniqueCount && attempts < maxAttempts) {
      const number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  
      console.log(`Tentando gerar número: ${number}`); // Log do número gerado
  
      if (number >= minNum && number <= maxNum) {
        numbers.add(number);
        console.log(`Número adicionado: ${number}`); // Log do número adicionado ao array
      }
      
      attempts++;
    }
  
    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
    console.log(`Números finais gerados e ordenados: ${sortedNumbers}`); // Log dos números finais
    return sortedNumbers;
  };
  
  // Update numbers based on autoGenerate flag
  const updateNumbers = (auto) => {
    if (auto && gameDetails) {
      // Verificar valores do gameDetails
      console.log('Valores do gameDetails:', gameDetails);
  
      const newNumbers = [];
      for (let i = 0; i < numOfAutoBilhetes; i++) {
        const bilhete = generateRandomNumbers(
          gameDetails.numeroInicial,
          gameDetails.numeroFinal,
          gameDetails.numeroPalpites
        );
        newNumbers.push(bilhete);
      }
  
      setNumbers(newNumbers);
      console.log('Números gerados para todos os bilhetes:', newNumbers); // Log dos números gerados
    } else {
      setNumbers([[]]);
      console.log('Gerador desativado. Nenhum número gerado.');
    }
  };
  
  // Efeito para atualização automática
  useEffect(() => {
    updateNumbers(autoGenerate);
  }, [autoGenerate, numOfAutoBilhetes, gameDetails, updateNumbers]);  // Adicione `updateNumbers` nas dependências  

  const handleAddNumber = () => {
    setNumbers([...numbers, []]);
  };

  const handleRemoveNumber = (index) => {
    const newNumbers = numbers.filter((_, idx) => idx !== index);
    setNumbers(newNumbers);
  };

  const handleNumberChange = (index, position, value) => {
    const newNumbers = [...numbers];
    if (!newNumbers[index]) {
      newNumbers[index] = [];
    }
    // Ensure no leading zeros when manually entering numbers
    newNumbers[index][position] = value === '' ? 0 : parseInt(value, 10);
    setNumbers(newNumbers);
  };

  const validateNumbers = () => {
    if (!gameDetails) return false;

    for (const numberSet of numbers) {
      // Check for correct amount of numbers
      if (numberSet.length !== gameDetails.numeroPalpites) {
        return false;
      }

      // Check if numbers are within allowed range
      for (const num of numberSet) {
        if (num < gameDetails.numeroInicial || num > gameDetails.numeroFinal || !Number.isInteger(num)) {
          return false;
        }
      }

      // Check for duplicates
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
      const response = await axios.post(
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

      // Reset form
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
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Buscar Cliente</FormLabel>
          <Input
            placeholder="Digite o nome ou email do cliente"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
        </FormControl>

        {searchLoading ? (
          <Spinner />
        ) : (
          <Box maxH="200px" overflowY="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Ação</Th>
                </Tr>
              </Thead>
              <Tbody>
                {clientes.map((cliente) => (
                  <Tr key={cliente.cli_id}>
                    <Td>{cliente.cli_nome}</Td>
                    <Td>{cliente.cli_email}</Td>
                    <Td>
                      <Badge
                        colorScheme={cliente.cli_status === 'active' ? 'green' : 'red'}
                      >
                        {cliente.cli_status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
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
          </Box>
        )}

        <FormControl>
          <FormLabel>Selecionar Jogo</FormLabel>
          <Select
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
            <Text fontSize="sm" mb={2}>
              Configure os números para cada bilhete:
            </Text>
            <Text fontSize="xs" color="gray.600" mb={4}>
              Escolha {gameDetails.numeroPalpites} números entre{' '}
              {gameDetails.numeroInicial} e {gameDetails.numeroFinal}
            </Text>

            <HStack mb={4}>
              <Checkbox isChecked={autoGenerate} onChange={(e) => setAutoGenerate(e.target.checked)}>
                Gerar Automático
              </Checkbox>
              {autoGenerate && (
                <NumberInput 
                  min={1} 
                  value={numOfAutoBilhetes} 
                  onChange={(_, value) => setNumOfAutoBilhetes(value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              )}
            </HStack>

            {!autoGenerate && numbers.map((numberSet, index) => (
              <HStack key={index} mb={4}>
                <Text>Bilhete {index + 1}:</Text>
                {Array.from({ length: gameDetails.numeroPalpites }).map((_, pos) => (
                  <NumberInput
                    key={pos}
                    min={gameDetails.numeroInicial}
                    max={gameDetails.numeroFinal}
                    value={numberSet[pos] || ''}
                    onChange={(value) => handleNumberChange(index, pos, value)}
                    size="sm"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ))}
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleRemoveNumber(index)}
                  isDisabled={numbers.length === 1}
                />
              </HStack>
            ))}

            {!autoGenerate && (
              <Button
                leftIcon={<AddIcon />}
                onClick={handleAddNumber}
                size="sm"
                mb={4}
              >
                Adicionar Bilhete
              </Button>
            )}

            {autoGenerate && 
              <VStack spacing={2} mb={4}>
                {numbers.map((numberSet, index) => (
                  <Text key={index}>Bilhete {index + 1}: {numberSet.join(', ')}</Text>
                ))}
              </VStack>
            }
          </Box>
        )}

        <Button
          colorScheme="green"
          onClick={handleSubmit}
          isLoading={loading}
          isDisabled={!selectedClient || !selectedGame || !validateNumbers()}
        >
          Registrar Aposta
        </Button>
      </VStack>
    </Box>
  );
};

export default ManualBetRegistration;