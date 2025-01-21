'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useToast,
  Text,
  HStack,
  Center,
  VStack,
  Card,
  CardBody,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const Historico = () => {
  const [historico, setHistorico] = useState({
    apostas: [],
    premiacoes: [],
    jogosParticipados: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAposta, setSelectedAposta] = useState(null);
  const toast = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pendente': 'yellow',
      'ativo': 'green',
      'finalizado': 'blue',
      'pago': 'green',
      'encerrado': 'red',
      'cancelado': 'red',
      'fechado': 'orange'
    };
    return statusColors[status?.toLowerCase()] || 'gray';
  };

  const fetchHistorico = useCallback(async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/cliente/historico', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Resposta da API:', response.data);

      if (response.data) {
        setHistorico({
          apostas: response.data.apostas || [],
          premiacoes: response.data.premiacoes || [],
          jogosParticipados: response.data.jogosParticipados || []
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar histórico',
        description: error.response?.data?.error || 'Não foi possível carregar seu histórico.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const handleRefresh = () => {
    fetchHistorico();
  };

  const handleApostaClick = (aposta) => {
    setSelectedAposta(aposta);
    onOpen();
  };

  if (loading) {
    return (
      <Center p={8}>
        <Spinner size="xl" color="green.500" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Card boxShadow="md" bg="white">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="medium" color="gray.600">
              Histórico de Apostas e Premiações
            </Text>
            <Button
              leftIcon={<RepeatIcon />}
              colorScheme="green"
              variant="ghost"
              onClick={handleRefresh}
              isLoading={refreshing}
              loadingText="Atualizando..."
            >
              Atualizar
            </Button>
          </HStack>

          <Tabs colorScheme="green" variant="enclosed">
            <TabList>
              <Tab fontWeight="medium">Apostas</Tab>
              <Tab fontWeight="medium">Premiações</Tab>
              {/* <Tab fontWeight="medium">Jogos Participados</Tab> */}
            </TabList>

            <TabPanels>
              <TabPanel>
                {historico.apostas.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={4}>
                      <Text color="gray.500" fontSize="lg">
                        Você ainda não fez nenhuma aposta
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Data</Th>
                          <Th>Jogo</Th>
                          <Th>Números</Th>
                          <Th>Valor</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {historico.apostas.map((aposta, index) => (
                          <Tr 
                            key={aposta.aposta_id || index}
                            _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                            onClick={() => handleApostaClick(aposta)}
                          >
                            <Td>{formatDate(aposta.data_criacao)}</Td>
                            <Td>{aposta.jogo_nome}</Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap">
                                {aposta.numeros_escolhidos?.map((numero, idx) => (
                                  <Badge key={idx} colorScheme="green" variant="subtle">
                                    {numero}
                                  </Badge>
                                ))}
                              </HStack>
                            </Td>
                            <Td>{formatCurrency(aposta.valor)}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(aposta.status)}>
                                {aposta.status || 'Pendente'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>

              <TabPanel>
                {historico.premiacoes.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={4}>
                      <Text color="gray.500" fontSize="lg">
                        Você ainda não tem premiações
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Data</Th>
                          <Th>Categoria</Th>
                          <Th>Prêmio</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {historico.premiacoes.map((premiacao, index) => (
                          <Tr key={premiacao.premiacao_id || index}>
                            <Td>{formatDate(premiacao.data_criacao)}</Td>
                            <Td>
                              <Badge colorScheme="purple">
                                {premiacao.categoria || 'Não especificada'}
                              </Badge>
                            </Td>
                            <Td>{formatCurrency(premiacao.premio)}</Td>
                            <Td>
                              <Badge colorScheme={premiacao.pago ? 'green' : 'yellow'}>
                                {premiacao.pago ? 'Pago' : 'Pendente'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>

              <TabPanel>
                {historico.jogosParticipados.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={4}>
                      <Text color="gray.500" fontSize="lg">
                        Você ainda não participou de nenhum jogo
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Jogo</Th>
                          <Th>Data Início</Th>
                          <Th>Data Fim</Th>
                          <Th>Status</Th>
                          {/* <Th>Resultado</Th> */}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {historico.jogosParticipados.map((jogo, index) => (
                          <Tr key={jogo.jog_id || index}>
                            <Td>{jogo.jog_nome}</Td>
                            <Td>{formatDate(jogo.data_inicio)}</Td>
                            <Td>{formatDate(jogo.data_fim)}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(jogo.status)}>
                                {jogo.status || 'Pendente'}
                              </Badge>
                            </Td>
                            {/* <Td>{jogo.resultado || 'Em andamento'}</Td> */}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal de detalhes da aposta */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes da Aposta</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAposta && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Jogo:</Text>
                  <Text>{selectedAposta.jogo_nome}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Data da Aposta:</Text>
                  <Text>{formatDate(selectedAposta.data_criacao)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Números Escolhidos:</Text>
                  <HStack spacing={1} flexWrap="wrap" mt={2}>
                    {selectedAposta.numeros_escolhidos?.map((numero, idx) => (
                      <Badge key={idx} colorScheme="green" variant="subtle">
                        {numero}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
                <Box>
                  <Text fontWeight="bold">Valor:</Text>
                  <Text>{formatCurrency(selectedAposta.valor)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedAposta.status)}>
                    {selectedAposta.status || 'Pendente'}
                  </Badge>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Historico;
