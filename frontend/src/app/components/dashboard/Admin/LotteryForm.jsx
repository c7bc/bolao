import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Textarea,
  useToast,
  Text,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Tooltip,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useBreakpointValue,
  Container,
} from '@chakra-ui/react';
import { InfoIcon, WarningIcon } from '@chakra-ui/icons';
import axios from 'axios';

const LotteryForm = ({ jogo }) => {
  const [lotteryData, setLotteryData] = useState({
    descricao: '',
    numerosSorteados: '',
  });
  const [loading, setLoading] = useState(false);
  const [sorteios, setSorteios] = useState([]);
  const [numeroInicial] = useState(parseInt(jogo?.numeroInicial, 10) || 1);
  const [numeroFinal] = useState(parseInt(jogo?.numeroFinal, 10) || 60);
  const [useAutoGenerate, setUseAutoGenerate] = useState(false);
  const [quantityToGenerate, setQuantityToGenerate] = useState(6);
  const toast = useToast();

  // Responsive layout configurations
  const stackDirection = useBreakpointValue({ base: 'column', md: 'row' });
  const containerWidth = useBreakpointValue({ base: '100%', md: '90%', lg: '80%' });
  const tableFontSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const cardPadding = useBreakpointValue({ base: '4', md: '6' });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const headingSize = useBreakpointValue({ base: 'sm', md: 'md' });

  const fetchSorteios = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jogos/${jogo.slug}/lottery`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sorteiosOrdenados = response.data.sorteios.sort((a, b) => 
        new Date(b.dataSorteio) - new Date(a.dataSorteio)
      );
      const sorteiosProcessados = processarDuplicacoes(sorteiosOrdenados);
      setSorteios(sorteiosProcessados);
    } catch (error) {
      toast({
        title: 'Erro ao buscar sorteios',
        description: error.response?.data?.error || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [jogo, toast]);

  useEffect(() => {
    if (jogo) {
      fetchSorteios();
    }
  }, [jogo, fetchSorteios]);

  const processarDuplicacoes = (sorteiosData) => {
    const sorteiosOrdenados = [...sorteiosData];
    
    return sorteiosOrdenados.map((sorteioAtual, indexAtual) => {
      const duplicacoesPorSorteio = [];
      
      for (let i = indexAtual + 1; i < sorteiosOrdenados.length; i++) {
        const sorteioAnterior = sorteiosOrdenados[i];
        const numerosAtuais = sorteioAtual.numerosArray;
        const numerosAnteriores = sorteioAnterior.numerosArray;
        
        const numerosDuplicados = numerosAtuais.filter(num => 
          numerosAnteriores.includes(num)
        );

        if (numerosDuplicados.length > 0) {
          duplicacoesPorSorteio.push({
            sorteioId: sorteioAnterior.sorteio_id,
            descricao: sorteioAnterior.descricao,
            numerosDuplicados,
            ordemSorteio: sorteiosOrdenados.length - i
          });
        }
      }

      return {
        ...sorteioAtual,
        duplicacoesDetalhadas: duplicacoesPorSorteio,
        numerosDuplicados: [...new Set(
          duplicacoesPorSorteio.flatMap(dup => dup.numerosDuplicados)
        )]
      };
    });
  };

  const generateRandomNumbers = () => {
    const numbers = new Set();
    while (numbers.size < quantityToGenerate) {
      const randomNum = Math.floor(Math.random() * (numeroFinal - numeroInicial + 1)) + numeroInicial;
      numbers.add(randomNum);
    }
    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
    setLotteryData(prev => ({
      ...prev,
      numerosSorteados: sortedNumbers.join(', ')
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLotteryData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderNumeroSorteado = (numero, sorteio) => {
    const isDuplicado = sorteio.numerosDuplicados?.includes(numero);
    
    return (
      <Tooltip
        key={`${sorteio.sorteio_id}-${numero}`}
        label={isDuplicado ? 'Número duplicado de sorteios anteriores' : 'Número único'}
        placement="top"
      >
        <Text
          as="span"
          color={isDuplicado ? 'red.500' : 'inherit'}
          fontWeight={isDuplicado ? 'bold' : 'normal'}
          mx="1"
          fontSize={tableFontSize}
        >
          {numero}
        </Text>
      </Tooltip>
    );
  };

  const renderDetalhesDuplicacoes = (duplicacoesDetalhadas) => {
    if (!duplicacoesDetalhadas?.length) return null;

    return duplicacoesDetalhadas.map((duplicacao, index) => (
      <Text key={index} fontSize={tableFontSize} color="gray.600">
        Duplicados do sorteio {duplicacao.ordemSorteio} ({duplicacao.descricao}): 
        {duplicacao.numerosDuplicados.join(', ')}
      </Text>
    ));
  };

  const canCreateLottery = () => {
    if (!jogo) return false;
    const now = new Date();
    const dataFim = jogo.data_fim ? new Date(jogo.data_fim) : null;
    return jogo.jog_status === 'fechado' && dataFim && now >= dataFim;
  };

  const handleCreateLottery = async () => {
    try {
      if (!lotteryData.descricao || !lotteryData.numerosSorteados) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post(
        `/api/jogos/${jogo.slug}/lottery`,
        lotteryData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Sorteio criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setLotteryData({
        descricao: '',
        numerosSorteados: '',
      });
      
      fetchSorteios();
    } catch (error) {
      toast({
        title: 'Erro ao criar sorteio',
        description: error.response?.data?.error || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!jogo) {
    return (
      <Alert status="info">
        <AlertIcon />
        Selecione um jogo para gerenciar os sorteios
      </Alert>
    );
  }

  return (
    <Container maxW={containerWidth} px={{ base: 2, md: 4 }}>
      <Box w="full">
        <Card mb={6} p={cardPadding}>
          <CardHeader>
            <Heading size={headingSize}>Gerenciamento de Sorteios</Heading>
          </CardHeader>
          <CardBody>
            {canCreateLottery() ? (
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize={tableFontSize}>Descrição do Sorteio</FormLabel>
                  <Textarea
                    name="descricao"
                    value={lotteryData.descricao}
                    onChange={handleChange}
                    placeholder="Descreva o sorteio"
                    resize="vertical"
                    fontSize={tableFontSize}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="auto-generate" mb="0" fontSize={tableFontSize}>
                    Gerar números automaticamente?
                  </FormLabel>
                  <Switch
                    id="auto-generate"
                    isChecked={useAutoGenerate}
                    onChange={(e) => setUseAutoGenerate(e.target.checked)}
                  />
                </FormControl>

                {useAutoGenerate && (
                  <Stack direction={stackDirection} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize={tableFontSize}>Quantidade de números</FormLabel>
                      <NumberInput
                        min={1}
                        max={numeroFinal - numeroInicial + 1}
                        value={quantityToGenerate}
                        onChange={(value) => setQuantityToGenerate(Number(value))}
                        size={buttonSize}
                      >
                        <NumberInputField fontSize={tableFontSize} />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    <Button
                      colorScheme="teal"
                      onClick={generateRandomNumbers}
                      alignSelf="flex-end"
                      size={buttonSize}
                    >
                      Gerar Números
                    </Button>
                  </Stack>
                )}

                <FormControl isRequired>
                  <FormLabel fontSize={tableFontSize}>Números Sorteados</FormLabel>
                  <Input
                    name="numerosSorteados"
                    value={lotteryData.numerosSorteados}
                    onChange={handleChange}
                    placeholder={`Digite os números entre ${numeroInicial} e ${numeroFinal}, separados por vírgula`}
                    fontSize={tableFontSize}
                  />
                </FormControl>

                <Button
                  colorScheme="blue"
                  onClick={handleCreateLottery}
                  isLoading={loading}
                  size={buttonSize}
                >
                  Criar Sorteio
                </Button>
              </VStack>
            ) : (
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize={tableFontSize}>
                  O sorteio só pode ser criado após o jogo estar fechado e a data de encerramento ter passado
                </Text>
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card p={cardPadding}>
          <CardHeader>
            <Heading size={headingSize}>Histórico de Sorteios</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" p={8}>
                <Spinner size={buttonSize} />
              </Flex>
            ) : sorteios.length > 0 ? (
              <Box overflowX="auto" width="100%">
                {/* Versão para Desktop */}
                <Box display={{ base: 'none', lg: 'block' }}>
                  <Table variant="simple" size={buttonSize}>
                    <Thead>
                      <Tr>
                        <Th fontSize={tableFontSize}>Ordem</Th>
                        <Th fontSize={tableFontSize}>Descrição</Th>
                        <Th fontSize={tableFontSize}>Números Sorteados</Th>
                        <Th fontSize={tableFontSize}>Data do Sorteio</Th>
                        <Th fontSize={tableFontSize}>Duplicações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sorteios.map((sorteio, index) => (
                        <Tr key={sorteio.sorteio_id}>
                          <Td fontSize={tableFontSize}>{sorteios.length - index}</Td>
                          <Td fontSize={tableFontSize}>{sorteio.descricao}</Td>
                          <Td>
                            <HStack wrap="wrap" spacing={1}>
                              {sorteio.numerosArray.map(numero => 
                                renderNumeroSorteado(numero, sorteio)
                              )}
                            </HStack>
                          </Td>
                          <Td fontSize={tableFontSize}>
                            {new Date(sorteio.dataSorteio).toLocaleString('pt-BR')}
                          </Td>
                          <Td>
                            {sorteio.numerosDuplicados.length > 0 ? (
                              <VStack align="start" spacing={2}>
                                <Badge colorScheme="red" fontSize={tableFontSize}>
                                  {sorteio.numerosDuplicados.length} números duplicados
                                </Badge>
                                {renderDetalhesDuplicacoes(sorteio.duplicacoesDetalhadas)}
                              </VStack>
                            ) : (
                              <Badge colorScheme="green" fontSize={tableFontSize}>
                                Nenhum
                              </Badge>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Versão para Mobile */}
                <VStack display={{ base: 'flex', lg: 'none' }} spacing={4} width="100%">
                  {sorteios.map((sorteio, index) => (
                    <Card key={sorteio.sorteio_id} width="100%" variant="outline">
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize={tableFontSize}>
                              Ordem:
                            </Text>
                            <Text fontSize={tableFontSize}>
                              {sorteios.length - index}
                            </Text>
                          </HStack>

                          <VStack align="stretch">
                            <Text fontWeight="bold" fontSize={tableFontSize}>
                              Descrição:
                            </Text>
                            <Text fontSize={tableFontSize}>
                              {sorteio.descricao}
                            </Text>
                          </VStack>

                          <VStack align="stretch">
                            <Text fontWeight="bold" fontSize={tableFontSize}>
                              Números Sorteados:
                            </Text>
                            <Flex wrap="wrap" gap={2}>
                              {sorteio.numerosArray.map(numero => 
                                renderNumeroSorteado(numero, sorteio)
                              )}
                            </Flex>
                          </VStack>

                          <VStack align="stretch">
                            <Text fontWeight="bold" fontSize={tableFontSize}>
                              Data do Sorteio:
                            </Text>
                            <Text fontSize={tableFontSize}>
                              {new Date(sorteio.dataSorteio).toLocaleString('pt-BR')}
                            </Text>
                          </VStack>

                          <VStack align="stretch">
                            <Text fontWeight="bold" fontSize={tableFontSize}>
                              Duplicações:
                            </Text>
                            {sorteio.numerosDuplicados.length > 0 ? (
                              <VStack align="start" spacing={2}>
                                <Badge colorScheme="red" fontSize={tableFontSize}>
                                  {sorteio.numerosDuplicados.length} números duplicados
                                </Badge>
                                <Box>
                                  {renderDetalhesDuplicacoes(sorteio.duplicacoesDetalhadas)}
                                </Box>
                              </VStack>
                            ) : (
                              <Badge colorScheme="green" fontSize={tableFontSize}>
                                Nenhum
                              </Badge>
                            )}
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </Box>
            ) : (
              <Alert status="info">
                <AlertIcon />
                <Text fontSize={tableFontSize}>
                  Nenhum sorteio realizado para este jogo
                </Text>
              </Alert>
            )}
          </CardBody>
        </Card>
      </Box>
    </Container>
  );
};

export default LotteryForm;