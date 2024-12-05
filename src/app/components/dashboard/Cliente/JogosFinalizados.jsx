import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  VStack,
  HStack,
  useToast,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
} from '@chakra-ui/react';
import axios from 'axios';

const JogosFinalizados = () => {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchJogosFinalizados = useCallback(async () => {
    try {
      const response = await axios.get('/api/jogos/list', {
        params: { status: 'finalizado' },
      });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Error fetching jogos finalizados:', error);
      toast({
        title: 'Erro ao carregar jogos',
        description: 'Não foi possível carregar os jogos finalizados.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJogosFinalizados();
  }, [fetchJogosFinalizados]);

  const handleVerDetalhes = (jogo) => {
    setSelectedJogo(jogo);
    onOpen();
  };

  if (loading) {
    return <Text>Carregando jogos finalizados...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Jogos Finalizados
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {jogos.map((jogo) => (
          <Box
            key={jogo.jog_id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="md"
            bg="white"
          >
            <VStack align="stretch" spacing={3}>
              <Heading as="h3" size="md" color="green.700">
                {jogo.jog_nome}
              </Heading>
              
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Data do Sorteio:
                </Text>
                <Text fontWeight="medium">
                  {new Date(jogo.jog_data_sorteio).toLocaleDateString()}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.600">
                  Prêmio Total:
                </Text>
                <Text fontWeight="bold" color="green.600">
                  R$ {parseFloat(jogo.jog_premiototal).toFixed(2)}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Números Sorteados:
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {jogo.numeros_sorteados?.map((numero) => (
                    <Badge
                      key={numero}
                      colorScheme="green"
                      p={2}
                      borderRadius="full"
                    >
                      {numero}
                    </Badge>
                  ))}
                </HStack>
              </Box>

              <Button
                colorScheme="blue"
                size="sm"
                onClick={() => handleVerDetalhes(jogo)}
              >
                Ver Detalhes e Ganhadores
              </Button>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>

      {jogos.length === 0 && (
        <Text color="gray.600" textAlign="center">
          Nenhum jogo finalizado disponível.
        </Text>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Jogo Finalizado</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedJogo && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" color="green.700" mb={2}>
                    {selectedJogo.jog_nome}
                  </Heading>
                  <Text color="gray.600">
                    Sorteado em: {new Date(selectedJogo.jog_data_sorteio).toLocaleDateString()}
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Números Sorteados:</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedJogo.numeros_sorteados?.map((numero) => (
                      <Badge
                        key={numero}
                        colorScheme="green"
                        p={2}
                        borderRadius="full"
                      >
                        {numero}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Prêmio Total:</Text>
                  <Text fontSize="lg" color="green.600" fontWeight="bold">
                    R$ {parseFloat(selectedJogo.jog_premiototal).toFixed(2)}
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={4}>Lista de Ganhadores:</Text>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Nome</Th>
                        <Th>Números Acertados</Th>
                        <Th isNumeric>Prêmio</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedJogo.ganhadores?.map((ganhador, index) => (
                        <Tr key={index}>
                          <Td>{ganhador.nome}</Td>
                          <Td>
                            <HStack spacing={1}>
                              {ganhador.numeros_acertados?.map((numero) => (
                                <Badge key={numero} colorScheme="green">
                                  {numero}
                                </Badge>
                              ))}
                            </HStack>
                          </Td>
                          <Td isNumeric>
                            R$ {parseFloat(ganhador.premio).toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default JogosFinalizados;