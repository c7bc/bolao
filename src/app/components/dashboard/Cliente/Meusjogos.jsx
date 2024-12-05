// components/Cliente/MeusJogos.jsx

import React, { useEffect, useState, useCallback } from 'react';
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
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
} from '@chakra-ui/react';
import axios from 'axios';

const MeusJogos = () => {
  const [meusJogos, setMeusJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchMeusJogos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cliente/meus-jogos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMeusJogos(response.data.jogos);
    } catch (error) {
      console.error('Error fetching meus jogos:', error);
      toast({
        title: 'Erro ao carregar jogos',
        description: 'Não foi possível carregar seus jogos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMeusJogos();
  }, [fetchMeusJogos]);

  const getStatusColor = (status) => {
    const statusColors = {
      'pendente': 'yellow',
      'ativo': 'green',
      'finalizado': 'blue',
      'cancelado': 'red'
    };
    return statusColors[status.toLowerCase()] || 'gray';
  };

  const handleVerDetalhes = (jogo) => {
    setSelectedJogo(jogo);
    onOpen();
  };

  const jogosAtivos = meusJogos.filter(jogo => jogo.status === 'ativo');
  const jogosPendentes = meusJogos.filter(jogo => jogo.status === 'pendente');
  const jogosFinalizados = meusJogos.filter(jogo => jogo.status === 'finalizado');

  if (loading) {
    return <Text>Carregando seus jogos...</Text>;
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Meus Jogos
      </Heading>

      <Tabs colorScheme="green" variant="enclosed">
        <TabList>
          <Tab>Ativos</Tab>
          <Tab>Pendentes</Tab>
          <Tab>Finalizados</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <JogosTable 
              jogos={jogosAtivos} 
              getStatusColor={getStatusColor}
              handleVerDetalhes={handleVerDetalhes}
              emptyMessage="Você não tem jogos ativos no momento."
            />
          </TabPanel>
          <TabPanel>
            <JogosTable 
              jogos={jogosPendentes}
              getStatusColor={getStatusColor}
              handleVerDetalhes={handleVerDetalhes}
              emptyMessage="Você não tem jogos pendentes no momento."
            />
          </TabPanel>
          <TabPanel>
            <JogosTable 
              jogos={jogosFinalizados}
              getStatusColor={getStatusColor}
              handleVerDetalhes={handleVerDetalhes}
              emptyMessage="Você não tem jogos finalizados."
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Jogo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedJogo && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">{selectedJogo.nome}</Text>
                  <Badge colorScheme={getStatusColor(selectedJogo.status)}>
                    {selectedJogo.status}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold">Data do Jogo:</Text>
                  <Text>{new Date(selectedJogo.data).toLocaleDateString()}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Valor Pago:</Text>
                  <Text>R$ {parseFloat(selectedJogo.valor).toFixed(2)}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Números Escolhidos:</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedJogo.numeros_escolhidos?.map((numero) => (
                      <Badge key={numero} colorScheme="green" p={2} borderRadius="full">
                        {numero}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                {selectedJogo.status === 'finalizado' && (
                  <>
                    <Box>
                      <Text fontWeight="bold">Números Sorteados:</Text>
                      <HStack spacing={2} flexWrap="wrap">
                        {selectedJogo.numeros_sorteados?.map((numero) => (
                          <Badge key={numero} colorScheme="blue" p={2} borderRadius="full">
                            {numero}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>

                    <Box>
                      <Text fontWeight="bold">Resultado:</Text>
                      <Text>{selectedJogo.resultado || 'Não premiado'}</Text>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Componente auxiliar para a tabela de jogos
const JogosTable = ({ jogos, getStatusColor, handleVerDetalhes, emptyMessage }) => {
  if (jogos.length === 0) {
    return <Text color="gray.600">{emptyMessage}</Text>;
  }

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Jogo</Th>
          <Th>Números</Th>
          <Th>Valor</Th>
          <Th>Status</Th>
          <Th>Data</Th>
          <Th>Ações</Th>
        </Tr>
      </Thead>
      <Tbody>
        {jogos.map((jogo) => (
          <Tr key={jogo.id}>
            <Td>{jogo.nome}</Td>
            <Td>
              <HStack spacing={1}>
                {jogo.numeros_escolhidos?.slice(0, 3).map((numero) => (
                  <Badge key={numero} colorScheme="green">
                    {numero}
                  </Badge>
                ))}
                {jogo.numeros_escolhidos?.length > 3 && (
                  <Badge colorScheme="green">
                    +{jogo.numeros_escolhidos.length - 3}
                  </Badge>
                )}
              </HStack>
            </Td>
            <Td>R$ {parseFloat(jogo.valor).toFixed(2)}</Td>
            <Td>
              <Badge colorScheme={getStatusColor(jogo.status)}>
                {jogo.status}
              </Badge>
            </Td>
            <Td>{new Date(jogo.data).toLocaleDateString()}</Td>
            <Td>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => handleVerDetalhes(jogo)}
              >
                Ver Detalhes
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default MeusJogos;