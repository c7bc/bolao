// components/Cliente/JogosDisponiveis.jsx

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
  Input,
  FormControl,
  FormLabel,
  Select,
  Grid,
  GridItem
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

  const fetchJogos = useCallback(async () => {
    try {
      const response = await axios.get('/api/jogos/list', {
        params: { status: 'ativo' },
      });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Error fetching jogos:', error);
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
      const transactionId = uuidv4();
      
      // Criar histórico do cliente
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
    } catch (error) {
      console.error('Error submitting participation:', error);
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
    return <Text>Carregando jogos...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Jogos Disponíveis
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {jogos.map((jogo) => (
          <Box
            key={jogo.jog_id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            boxShadow="md"
          >
            <Heading as="h3" size="md" color="green.700" mb={2}>
              {jogo.jog_nome}
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Valor: R$ {jogo.jog_valorjogo}
            </Text>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Início: {new Date(jogo.jog_data_inicio).toLocaleDateString()}
            </Text>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Fim: {new Date(jogo.jog_data_fim).toLocaleDateString()}
            </Text>
            <Button
              colorScheme="green"
              size={buttonSize}
              onClick={() => handleParticipar(jogo)}
            >
              Participar
            </Button>
          </Box>
        ))}
      </SimpleGrid>

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
                  <Text>Valor por número: R$ {selectedJogo.jog_valorjogo}</Text>
                </Box>

                <Divider />

                <FormControl>
                  <FormLabel>Quantidade de números</FormLabel>
                  <NumberInput
                    min={1}
                    max={10}
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
                      <Badge key={numero} colorScheme="green" p={2} borderRadius="full">
                        {numero}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                <FormControl>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)}>
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

                <Button colorScheme="green" onClick={handleSubmit}>
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