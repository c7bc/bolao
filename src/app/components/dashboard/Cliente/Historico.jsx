// components/Cliente/Historico.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Divider,
  useToast,
  Image,
  Link,
  Flex,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Card,
  CardBody,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { 
  FiDownload, 
  FiEye, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiDollarSign,
  FiAward
} from 'react-icons/fi';
import axios from 'axios';

const Historico = () => {
  const [historicoJogos, setHistoricoJogos] = useState([]);
  const [historicoFinanceiro, setHistoricoFinanceiro] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalheSelecionado, setDetalheSelecionado] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchHistorico = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Buscar histórico de jogos
      const jogosResponse = await axios.get('/api/cliente/gamehistory', { headers });
      setHistoricoJogos(jogosResponse.data.games);

      // Buscar histórico financeiro
      const financeiroResponse = await axios.get('/api/cliente/financialhistory', { headers });
      setHistoricoFinanceiro(financeiroResponse.data.financials);

      // Buscar resultados
      const resultadosResponse = await axios.get('/api/cliente/resultados', { headers });
      setResultados(resultadosResponse.data.resultados);
    } catch (error) {
      console.error('Error fetching historico:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: 'Não foi possível carregar seu histórico completo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const getStatusColor = (status) => {
    const statusColors = {
      'pendente': 'yellow',
      'aprovado': 'green',
      'rejeitado': 'red',
      'em_analise': 'blue',
      'cancelado': 'gray'
    };
    return statusColors[status.toLowerCase()] || 'gray';
  };

  const handleVerDetalhes = (item) => {
    setDetalheSelecionado(item);
    onOpen();
  };

  const ResumoFinanceiro = () => (
    <StatGroup mb={6}>
      <Card p={4} w="full">
        <CardBody>
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <GridItem>
              <Stat>
                <StatLabel>Total Apostado</StatLabel>
                <StatNumber color="blue.500">
                  R$ {historicoFinanceiro.reduce((acc, curr) => acc + curr.valor, 0).toFixed(2)}
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Total Ganho</StatLabel>
                <StatNumber color="green.500">
                  R$ {historicoFinanceiro.filter(h => h.tipo === 'premio')
                    .reduce((acc, curr) => acc + curr.valor, 0).toFixed(2)}
                </StatNumber>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Jogos Participados</StatLabel>
                <StatNumber color="purple.500">
                  {historicoJogos.length}
                </StatNumber>
              </Stat>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </StatGroup>
  );

  if (loading) {
    return <Text>Carregando histórico...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Histórico Completo
      </Heading>

      <ResumoFinanceiro />

      <Tabs variant="enclosed" colorScheme="green">
        <TabList>
          <Tab>Histórico de Jogos</Tab>
          <Tab>Movimentações Financeiras</Tab>
          <Tab>Resultados</Tab>
        </TabList>

        <TabPanels>
          {/* Histórico de Jogos */}
          <TabPanel>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Jogo</Th>
                  <Th>Data</Th>
                  <Th>Números</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {historicoJogos.map((jogo) => (
                  <Tr key={jogo.htc_id}>
                    <Td>{jogo.jog_nome}</Td>
                    <Td>{new Date(jogo.htc_datacriacao).toLocaleDateString()}</Td>
                    <Td>
                      <HStack spacing={1}>
                        {Array.from({ length: 10 }, (_, i) => jogo[`htc_cota${i + 1}`])
                          .filter(Boolean)
                          .map((numero, idx) => (
                            <Badge key={idx} colorScheme="green">
                              {numero}
                            </Badge>
                          ))}
                      </HStack>
                    </Td>
                    <Td>R$ {jogo.htc_deposito.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(jogo.htc_status)}>
                        {jogo.htc_status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleVerDetalhes(jogo)}
                      >
                        <Icon as={FiEye} mr={2} /> Ver Detalhes
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

          {/* Movimentações Financeiras */}
          <TabPanel>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data</Th>
                  <Th>Tipo</Th>
                  <Th>Valor</Th>
                  <Th>Método</Th>
                  <Th>Status</Th>
                  <Th>Comprovante</Th>
                </Tr>
              </Thead>
              <Tbody>
                {historicoFinanceiro.map((movimentacao) => (
                  <Tr key={movimentacao.id}>
                    <Td>{new Date(movimentacao.data).toLocaleDateString()}</Td>
                    <Td>
                      <Badge colorScheme={movimentacao.tipo === 'deposito' ? 'blue' : 'green'}>
                        {movimentacao.tipo === 'deposito' ? 'Depósito' : 'Prêmio'}
                      </Badge>
                    </Td>
                    <Td>R$ {movimentacao.valor.toFixed(2)}</Td>
                    <Td>{movimentacao.metodo_pagamento}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(movimentacao.status)}>
                        {movimentacao.status}
                      </Badge>
                    </Td>
                    <Td>
                      {movimentacao.comprovante_url && (
                        <Link href={movimentacao.comprovante_url} isExternal>
                          <Button size="sm" leftIcon={<FiDownload />}>
                            Download
                          </Button>
                        </Link>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

          {/* Resultados */}
          <TabPanel>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Jogo</Th>
                  <Th>Data Sorteio</Th>
                  <Th>Números Sorteados</Th>
                  <Th>Seus Números</Th>
                  <Th>Acertos</Th>
                  <Th>Prêmio</Th>
                </Tr>
              </Thead>
              <Tbody>
                {resultados.map((resultado) => (
                  <Tr key={resultado.id}>
                    <Td>{resultado.jogo_nome}</Td>
                    <Td>{new Date(resultado.data_sorteio).toLocaleDateString()}</Td>
                    <Td>
                      <HStack spacing={1}>
                        {resultado.numeros_sorteados.map((numero) => (
                          <Badge key={numero} colorScheme="blue">
                            {numero}
                          </Badge>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        {resultado.seus_numeros.map((numero) => (
                          <Badge 
                            key={numero} 
                            colorScheme={resultado.numeros_sorteados.includes(numero) ? "green" : "gray"}
                          >
                            {numero}
                          </Badge>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={resultado.acertos > 0 ? "green" : "gray"}
                        fontSize="lg"
                      >
                        {resultado.acertos}
                      </Badge>
                    </Td>
                    <Td>
                      {resultado.premio > 0 ? (
                        <Text color="green.500" fontWeight="bold">
                          R$ {resultado.premio.toFixed(2)}
                        </Text>
                      ) : (
                        <Text color="gray.500">-</Text>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal de Detalhes */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Jogo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {detalheSelecionado && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>{detalheSelecionado.jog_nome}</Heading>
                  <Badge colorScheme={getStatusColor(detalheSelecionado.htc_status)}>
                    {detalheSelecionado.htc_status}
                  </Badge>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Data da Participação:</Text>
                  <Text>{new Date(detalheSelecionado.htc_datacriacao).toLocaleString()}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Números Escolhidos:</Text>
                  <HStack spacing={2} wrap="wrap">
                    {Array.from({ length: 10 }, (_, i) => detalheSelecionado[`htc_cota${i + 1}`])
                      .filter(Boolean)
                      .map((numero, idx) => (
                        <Badge key={idx} colorScheme="green" p={2} borderRadius="full">
                          {numero}
                        </Badge>
                      ))}
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Valor Pago:</Text>
                  <Text fontSize="lg" color="green.600">
                    R$ {detalheSelecionado.htc_deposito.toFixed(2)}
                  </Text>
                </Box>

                {detalheSelecionado.comprovante_url && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Comprovante:</Text>
                    <Link href={detalheSelecionado.comprovante_url} isExternal>
                      <Button leftIcon={<FiDownload />} colorScheme="blue">
                        Baixar Comprovante
                      </Button>
                    </Link>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Historico;