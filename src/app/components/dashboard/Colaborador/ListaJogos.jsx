// src/app/components/dashboard/Colaborador/ListaJogos.jsx

import React, { useState } from 'react';
import {
  Box, 
  SimpleGrid, 
  Heading, 
  Text, 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter, 
  VStack, 
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Container,
  CheckboxGroup,
  Checkbox,
} from '@chakra-ui/react';
import { FaDice, FaPencilAlt, FaTrophy, FaMoneyBillWave, FaQrcode, FaHistory } from 'react-icons/fa';
import GameDetailsModal from './GameDetailsModal';
import axios from 'axios';

const ListaJogos = ({ listaJogos }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGame, setSelectedGame] = useState(null);
  const [numberSelectionType, setNumberSelectionType] = useState('auto');
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [showHistory, setShowHistory] = useState(false);
  const [manualNumbers, setManualNumbers] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toast = useToast();

  const handleNumberSelection = (game) => {
    setSelectedGame(game);
    onOpen();
  };

  const generateRandomNumbers = () => {
    const numbers = new Set();
    while(numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 60) + 1);
    }
    setSelectedNumbers(Array.from(numbers));
  };

  const handleManualNumbersChange = (e) => {
    setManualNumbers(e.target.value);
  };

  const confirmPayment = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      // Validar números selecionados
      let numerosFinal;
      if (numberSelectionType === 'auto') {
        numerosFinal = selectedNumbers.join(',');
      } else {
        numerosFinal = manualNumbers.split(',').map(num => num.trim()).join(',');
        // Validar se os números são válidos
        const numerosArray = numerosFinal.split(',').map(num => num.trim());
        const min = parseInt(selectedGame.jog_quantidade_minima, 10) || 6;
        const max = parseInt(selectedGame.jog_quantidade_maxima, 10) || 15;

        if (numerosArray.length < min || numerosArray.length > max) {
          toast({
            title: `A quantidade de números deve estar entre ${min} e ${max}.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setIsProcessing(false);
          return;
        }

        const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
        if (!numerosValidos) {
          toast({
            title: 'Os números devem conter apenas dígitos.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setIsProcessing(false);
          return;
        }
      }

      // Chamar a API para registrar a aposta
      const response = await axios.post('/api/cliente/participar', {
        jogo_id: selectedGame.jog_id,
        numeros_escolhidos: numerosFinal,
        valor_total: parseFloat(selectedGame.jog_valorjogo),
        metodo_pagamento: paymentMethod,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Aposta registrada com sucesso!',
        description: 'Seu pagamento foi processado e sua aposta está ativa.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      setSelectedGame(null);
      setSelectedNumbers([]);
      setManualNumbers('');
      setPaymentMethod('pix');
      // Opcional: atualizar a lista de jogos ou outras partes do estado
    } catch (error) {
      console.error('Erro ao registrar aposta:', error);
      toast({
        title: 'Erro ao registrar aposta.',
        description: error.response?.data?.error || error.message || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading as="h3" size="lg" color="green.700">Lista de Jogos</Heading>
          <Button 
            leftIcon={<FaHistory />}
            onClick={() => setShowHistory(!showHistory)}
            colorScheme="green"
            variant="solid"
          >
            Histórico
          </Button>
        </HStack>

        {listaJogos.length === 0 ? (
          <Text>Não há jogos disponíveis no sistema.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {listaJogos.map((jogo) => (
              <Card key={jogo.jog_id} variant="outline">
                <CardHeader>
                  <Heading size="md" color="green.700">{jogo.jog_nome}</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    <Text color="gray.600">Valor: R$ {jogo.jog_valorjogo.toFixed(2)}</Text>
                    <Text color="gray.600">
                      Início: {new Date(jogo.jog_data_inicio).toLocaleDateString()}
                    </Text>
                    <Text color="gray.600">
                      Fim: {new Date(jogo.jog_data_fim).toLocaleDateString()}
                    </Text>
                    <Text color="gray.600">
                      Status: {jogo.jog_status === 'open' ? 'Em Andamento' : jogo.jog_status === 'upcoming' ? 'Próximo' : 'Encerrado'}
                    </Text>
                  </VStack>
                </CardBody>
                <CardFooter>
                  <Button
                    rightIcon={<FaDice />}
                    onClick={() => handleNumberSelection(jogo)}
                    colorScheme="blue"
                    width="full"
                    isDisabled={jogo.jog_status !== 'open'}
                  >
                    Escolher Números
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Modal para Escolher Números */}
        {selectedGame && (
          <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedGame(null); }} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Escolher Números - {selectedGame.jog_nome}</ModalHeader>
              <ModalCloseButton />
              <ModalBody py={6}>
                <VStack spacing={6}>
                  <RadioGroup value={numberSelectionType} onChange={setNumberSelectionType}>
                    <Stack direction="row" spacing={6}>
                      <Radio value="auto">
                        <HStack>
                          <FaDice />
                          <Text>Automático</Text>
                        </HStack>
                      </Radio>
                      <Radio value="manual">
                        <HStack>
                          <FaPencilAlt />
                          <Text>Manual</Text>
                        </HStack>
                      </Radio>
                    </Stack>
                  </RadioGroup>

                  {numberSelectionType === 'auto' ? (
                    <Button
                      onClick={generateRandomNumbers}
                      colorScheme="green"
                      width="full"
                    >
                      Gerar Números Aleatórios
                    </Button>
                  ) : (
                    <FormControl>
                      <FormLabel>Digite os números (separados por vírgula)</FormLabel>
                      <Input value={manualNumbers} onChange={handleManualNumbersChange} placeholder="1, 2, 3, 4, 5, 6" />
                    </FormControl>
                  )}

                  {selectedNumbers.length > 0 && (
                    <Text>Números selecionados: {selectedNumbers.join(', ')}</Text>
                  )}

                  <Box width="full">
                    <Heading size="md" mb={4}>Método de Pagamento</Heading>
                    <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
                      <Stack direction="row" spacing={6}>
                        <Radio value="pix">
                          <HStack>
                            <FaQrcode />
                            <Text>PIX</Text>
                          </HStack>
                        </Radio>
                        <Radio value="dinheiro">
                          <HStack>
                            <FaMoneyBillWave />
                            <Text>Dinheiro</Text>
                          </HStack>
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </Box>

                  <Button 
                    colorScheme="green" 
                    width="full" 
                    onClick={confirmPayment}
                    isLoading={isProcessing}
                    loadingText="Processando"
                  >
                    Confirmar Pagamento
                  </Button>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}

        {/* Histórico */}
        {showHistory && (
          <Card variant="outline">
            <CardHeader>
              <HStack>
                <FaTrophy />
                <Heading size="md" color="green.700">
                  Histórico de Ganhadores
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text color="gray.600">
                Histórico de jogos e ganhadores será exibido aqui.
              </Text>
            </CardBody>
          </Card>
        )}

        {/* Modal para Detalhes do Jogo */}
        <GameDetailsModal 
          game={selectedGame} 
          isOpen={isOpen} 
          onClose={() => { onClose(); setSelectedGame(null); }} 
        />
      </VStack>
    </Container>
  );
};

export default ListaJogos;
