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
        >
          {numero}
        </Text>
      </Tooltip>
    );
  };

  const renderDetalhesDuplicacoes = (duplicacoesDetalhadas) => {
    if (!duplicacoesDetalhadas?.length) return null;

    return duplicacoesDetalhadas.map((duplicacao, index) => (
      <Text key={index} fontSize="sm" color="gray.600">
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
    <Box w="full">
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Gerenciamento de Sorteios</Heading>
        </CardHeader>
        <CardBody>
          {canCreateLottery() ? (
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Descrição do Sorteio</FormLabel>
                <Textarea
                  name="descricao"
                  value={lotteryData.descricao}
                  onChange={handleChange}
                  placeholder="Descreva o sorteio"
                  resize="vertical"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="auto-generate" mb="0">
                  Gerar números automaticamente?
                </FormLabel>
                <Switch
                  id="auto-generate"
                  isChecked={useAutoGenerate}
                  onChange={(e) => setUseAutoGenerate(e.target.checked)}
                />
              </FormControl>

              {useAutoGenerate && (
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Quantidade de números</FormLabel>
                    <NumberInput
                      min={1}
                      max={numeroFinal - numeroInicial + 1}
                      value={quantityToGenerate}
                      onChange={(value) => setQuantityToGenerate(Number(value))}
                    >
                      <NumberInputField />
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
                  >
                    Gerar Números
                  </Button>
                </HStack>
              )}

              <FormControl isRequired>
                <FormLabel>Números Sorteados</FormLabel>
                <Input
                  name="numerosSorteados"
                  value={lotteryData.numerosSorteados}
                  onChange={handleChange}
                  placeholder={`Digite os números entre ${numeroInicial} e ${numeroFinal}, separados por vírgula`}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleCreateLottery}
                isLoading={loading}
              >
                Criar Sorteio
              </Button>
            </VStack>
          ) : (
            <Alert status="warning">
              <AlertIcon />
              O sorteio só pode ser criado após o jogo estar fechado e a data de encerramento ter passado
            </Alert>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Histórico de Sorteios</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : sorteios.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Ordem</Th>
                    <Th>Descrição</Th>
                    <Th>Números Sorteados</Th>
                    <Th>Data do Sorteio</Th>
                    <Th>Duplicações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sorteios.map((sorteio, index) => (
                    <Tr key={sorteio.sorteio_id}>
                      <Td>{sorteios.length - index}</Td>
                      <Td>{sorteio.descricao}</Td>
                      <Td>
                        <HStack wrap="wrap" spacing={1}>
                          {sorteio.numerosArray.map(numero => 
                            renderNumeroSorteado(numero, sorteio)
                          )}
                        </HStack>
                      </Td>
                      <Td>
                        {new Date(sorteio.dataSorteio).toLocaleString('pt-BR')}
                      </Td>
                      <Td>
                        {sorteio.numerosDuplicados.length > 0 ? (
                          <VStack align="start" spacing={2}>
                            <Badge colorScheme="red">
                              {sorteio.numerosDuplicados.length} números duplicados
                            </Badge>
                            {renderDetalhesDuplicacoes(sorteio.duplicacoesDetalhadas)}
                          </VStack>
                        ) : (
                          <Badge colorScheme="green">Nenhum</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Alert status="info">
              <AlertIcon />
              Nenhum sorteio realizado para este jogo
            </Alert>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default LotteryForm;