'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Badge,
  Divider,
  FormControl,
  FormLabel,
  Select,
  Grid,
  GridItem,
  Spinner
} from '@chakra-ui/react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const JogosDisponiveis = () => {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const [selecaoNumeros, setSelecaoNumeros] = useState('manual');
  const [numerosEscolhidos, setNumerosEscolhidos] = useState([]);
  const [quantidadeNumeros, setQuantidadeNumeros] = useState(1);
  const [metodoPagamento, setMetodoPagamento] = useState('pix');
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleRedirectToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const fetchJogos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Erro de autenticação',
          description: 'Faça login novamente para continuar.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        handleRedirectToLogin();
        return;
      }

      const response = await axios.get('/api/jogos/list', {
        params: { status: 'aberto' },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Error fetching jogos:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem('token');
        handleRedirectToLogin();
        return;
      }

      toast({
        title: 'Erro ao carregar jogos',
        description: 'Não foi possível carregar a lista de jogos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  const handleParticipar = (jogo) => {
    setSelectedJogo(jogo);
    setNumerosEscolhidos([]);
    setQuantidadeNumeros(1);
    onOpen();
  };

  const gerarNumerosAleatorios = () => {
    const numeros = [];
    while (numeros.length < quantidadeNumeros) {
      const numero = Math.floor(Math.random() * 60) + 1;
      if (!numeros.includes(numero)) {
        numeros.push(numero);
      }
    }
    setNumerosEscolhidos(numeros.sort((a, b) => a - b));
  };

  const handleNumeroClick = (numero) => {
    if (numerosEscolhidos.includes(numero)) {
      setNumerosEscolhidos(numerosEscolhidos.filter(n => n !== numero));
    } else if (numerosEscolhidos.length < quantidadeNumeros) {
      setNumerosEscolhidos([...numerosEscolhidos, numero].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async () => {
    if (numerosEscolhidos.length !== quantidadeNumeros) {
      toast({
        title: 'Seleção incompleta',
        description: `Selecione ${quantidadeNumeros} números para continuar.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro de autenticação',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        handleRedirectToLogin();
        return;
      }

      const transactionId = uuidv4();
      
      await axios.post('/api/historico-cliente/create', {
        htc_transactionid: transactionId,
        htc_status: 'pending',
        htc_idjogo: selectedJogo.jog_id,
        htc_deposito: selectedJogo.jog_valorjogo * quantidadeNumeros,
        htc_cotas: numerosEscolhidos,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Participação registrada!',
        description: 'Seus números foram registrados com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      fetchJogos();
    } catch (error) {
      console.error('Error submitting participation:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem('token');
        handleRedirectToLogin();
        return;
      }

      toast({
        title: 'Erro ao participar',
        description: 'Não foi possível registrar sua participação. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando jogos disponíveis...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Jogos Disponíveis
      </Heading>

      {jogos.length === 0 ? (
        <Text textAlign="center" fontSize="lg" color="gray.600">
          Nenhum jogo disponível no momento.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {jogos.map((jogo) => (
            <Box
              key={jogo.jog_id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="md"
              bg="white"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.02)' }}
            >
              <VStack align="stretch" spacing={3}>
                <Heading as="h3" size="md" color="green.700">
                  {jogo.jog_nome}
                </Heading>
                
                <Text fontSize="sm" color="gray.600">
                  Valor: R$ {jogo.jog_valorjogo?.toFixed(2)}
                </Text>
                
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Período:
                  </Text>
                  <Text>
                    {new Date(jogo.jog_data_inicio).toLocaleDateString()} até{' '}
                    {new Date(jogo.jog_data_fim).toLocaleDateString()}
                  </Text>
                </Box>

                <HStack spacing={2}>
                  <Badge colorScheme="green">Mín: {jogo.jog_quantidade_minima}</Badge>
                  <Badge colorScheme="green">Máx: {jogo.jog_quantidade_maxima}</Badge>
                </HStack>

                <Button
                  colorScheme="green"
                  size={buttonSize}
                  onClick={() => handleParticipar(jogo)}
                  isFullWidth
                >
                  Participar
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Participar do Jogo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedJogo && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>{selectedJogo.jog_nome}</Heading>
                  <Text>Valor por número: R$ {selectedJogo.jog_valorjogo?.toFixed(2)}</Text>
                </Box>

                <Divider />

                <FormControl>
                  <FormLabel>Quantidade de números</FormLabel>
                  <NumberInput
                    min={selectedJogo.jog_quantidade_minima}
                    max={selectedJogo.jog_quantidade_maxima}
                    value={quantidadeNumeros}
                    onChange={(value) => setQuantidadeNumeros(Number(value))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <RadioGroup value={selecaoNumeros} onChange={setSelecaoNumeros}>
                  <HStack spacing={4}>
                    <Radio value="manual">Seleção Manual</Radio>
                    <Radio value="automatica">Seleção Automática</Radio>
                  </HStack>
                </RadioGroup>

                {selecaoNumeros === 'automatica' && (
                  <Button colorScheme="blue" onClick={gerarNumerosAleatorios}>
                    Gerar Números Aleatórios
                  </Button>
                )}

                {selecaoNumeros === 'manual' && (
                  <Grid templateColumns="repeat(6, 1fr)" gap={2}>
                    {[...Array(60)].map((_, i) => (
                      <GridItem key={i}>
                        <Button
                          size="sm"
                          variant={numerosEscolhidos.includes(i + 1) ? "solid" : "outline"}
                          colorScheme={numerosEscolhidos.includes(i + 1) ? "green" : "gray"}
                          onClick={() => handleNumeroClick(i + 1)}
                          isDisabled={
                            !numerosEscolhidos.includes(i + 1) &&
                            numerosEscolhidos.length >= quantidadeNumeros
                          }
                        >
                          {i + 1}
                        </Button>
                      </GridItem>
                    ))}
                  </Grid>
                )}

                <Box>
                  <Text fontWeight="bold">Números selecionados:</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {numerosEscolhidos.map((numero) => (
                      <Badge
                        key={numero}
                        colorScheme="green"
                        p={2}
                        borderRadius="full"
                        cursor="pointer"
                        onClick={() => handleNumeroClick(numero)}
                      >
                        {numero}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                <FormControl>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select
                    value={metodoPagamento}
                    onChange={(e) => setMetodoPagamento(e.target.value)}
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="boleto">Boleto</option>
                  </Select>
                </FormControl>

                <Box>
                  <Text fontWeight="bold">
                    Valor Total: R$ {(selectedJogo.jog_valorjogo * quantidadeNumeros).toFixed(2)}
                  </Text>
                </Box>

                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isDisabled={numerosEscolhidos.length !== quantidadeNumeros}
                >
                  Confirmar Participação
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default JogosDisponiveis;