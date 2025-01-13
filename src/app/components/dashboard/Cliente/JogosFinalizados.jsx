// Caminho: src/app/components/dashboard/Cliente/JogosFinalizados.jsx (Linhas: 346)
// components/Cliente/JogosFinalizados.jsx
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
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';

const JogosFinalizados = () => {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const [resultados, setResultados] = useState([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const fetchResultados = useCallback(async () => {
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
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/cliente/resultados', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.resultados) {
        setResultados(response.data.resultados);
      }
    } catch (error) {
      console.error('Error fetching resultados:', error);
      if (error.response?.status === 401) {
        toast({
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
    }
  }, [toast, router]);

  const fetchJogosFinalizados = useCallback(async () => {
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
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/jogos/list', {
        params: { status: 'finalizado' },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.jogos) {
        setJogos(response.data.jogos);
      }
    } catch (error) {
      console.error('Error fetching jogos finalizados:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

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
  }, [toast, router]);

  useEffect(() => {
    fetchJogosFinalizados();
    fetchResultados();
  }, [fetchJogosFinalizados, fetchResultados]);

  const handleVerDetalhes = (jogo) => {
    const jogoComResultados = {
      ...jogo,
      resultados: resultados.filter(r => r.jog_id === jogo.jog_id),
    };
    setSelectedJogo(jogoComResultados);
    onOpen();
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando jogos finalizados...</Text>
      </Box>
    );
  }

  if (!jogos.length) {
    return (
      <Box p={6} textAlign="center">
        <Text fontSize="lg" color="gray.600">
          Nenhum jogo finalizado disponível.
        </Text>
      </Box>
    );
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
            transition="transform 0.2s"
            _hover={{ transform: 'scale(1.02)' }}
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
                  {new Date(jogo.jog_data_sorteio || jogo.jog_data_fim).toLocaleDateString()}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.600">
                  Prêmio Total:
                </Text>
                <Text fontWeight="bold" color="green.600">
                  R$ {parseFloat(jogo.jog_valorpremio || 0).toFixed(2)}
                </Text>
              </Box>

              {jogo.numeros_sorteados && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Números Sorteados:
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {(Array.isArray(jogo.numeros_sorteados) 
                      ? jogo.numeros_sorteados 
                      : jogo.numeros_sorteados?.split(',')
                    )?.map((numero) => (
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
              )}

              <Button
                colorScheme="blue"
                size="sm"
                onClick={() => handleVerDetalhes(jogo)}
                isFullWidth
              >
                Ver Detalhes e Ganhadores
              </Button>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>

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
                    Sorteado em: {new Date(selectedJogo.jog_data_sorteio || selectedJogo.jog_data_fim).toLocaleDateString()}
                  </Text>
                </Box>

                <Divider />

                {selectedJogo.numeros_sorteados && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Números Sorteados:</Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {(Array.isArray(selectedJogo.numeros_sorteados)
                        ? selectedJogo.numeros_sorteados
                        : selectedJogo.numeros_sorteados?.split(',')
                      )?.map((numero) => (
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
                )}

                <Box>
                  <Text fontWeight="bold" mb={2}>Prêmio Total:</Text>
                  <Text fontSize="lg" color="green.600" fontWeight="bold">
                    R$ {parseFloat(selectedJogo.jog_valorpremio || 0).toFixed(2)}
                  </Text>
                </Box>

                <Divider />

                {selectedJogo.resultados?.length > 0 ? (
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
                        {selectedJogo.resultados.map((resultado, index) => (
                          <Tr key={index}>
                            <Td>{resultado.ganhador_nome || 'Anônimo'}</Td>
                            <Td>
                              <HStack spacing={1}>
                                {resultado.numeros_acertados?.map((numero) => (
                                  <Badge key={numero} colorScheme="green">
                                    {numero}
                                  </Badge>
                                ))}
                              </HStack>
                            </Td>
                            <Td isNumeric>
                              R$ {parseFloat(resultado.premio || 0).toFixed(2)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text color="gray.600" textAlign="center">
                    Nenhum ganhador registrado para este jogo.
                  </Text>
                )}
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
