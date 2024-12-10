// src/app/components/dashboard/Colaborador/ListaJogos.jsx

import React from 'react';
import {
  Box, SimpleGrid, Heading, Text, Button, Card, CardBody, CardHeader, CardFooter, VStack, HStack,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, RadioGroup,
  Radio, FormControl, FormLabel, Input, Stack, Container, CheckboxGroup, Checkbox,
} from '@chakra-ui/react';
import { FaDice, FaPencilAlt, FaTrophy, FaMoneyBillWave, FaQrcode, FaHistory } from 'react-icons/fa';

const ListaJogos = ({ listaJogos }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGame, setSelectedGame] = React.useState(null);
  const [numberSelectionType, setNumberSelectionType] = React.useState('auto');
  const [selectedNumbers, setSelectedNumbers] = React.useState([]);
  const [paymentMethod, setPaymentMethod] = React.useState('pix');
  const [showHistory, setShowHistory] = React.useState(false);
  const [manualNumbers, setManualNumbers] = React.useState('');

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

  const confirmPayment = () => {
    // Aqui você poderia chamar um endpoint para confirmar a compra do jogo, salvar a aposta, etc.
    // Por ora, apenas fecha o modal.
    onClose();
    setSelectedGame(null);
    setSelectedNumbers([]);
    setManualNumbers('');
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
                    <Text color="gray.600">Valor: R$ {jogo.jog_valorjogo}</Text>
                    <Text color="gray.600">
                      Início: {new Date(jogo.jog_data_inicio).toLocaleDateString()}
                    </Text>
                    <Text color="gray.600">
                      Fim: {new Date(jogo.jog_data_fim).toLocaleDateString()}
                    </Text>
                  </VStack>
                </CardBody>
                <CardFooter>
                  <Button
                    rightIcon={<FaDice />}
                    onClick={() => handleNumberSelection(jogo)}
                    colorScheme="blue"
                    width="full"
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
          <Modal isOpen={isOpen} onClose={onClose} size="lg">
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

                  <Button colorScheme="green" width="full" onClick={confirmPayment}>
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
      </VStack>
    </Container>
  );
};

export default ListaJogos;
