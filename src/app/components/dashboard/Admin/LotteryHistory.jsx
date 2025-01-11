// Caminho: src/app/components/dashboard/Admin/LotteryForm.jsx

'use client';

import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const LotteryForm = ({ jogo, refreshList }) => {
  const [lotteryData, setLotteryData] = useState({
    descricao: '',
    numerosSorteados: '',
  });
  const toast = useToast();
  const [canCreateLottery, setCanCreateLottery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sorteios, setSorteios] = useState([]);

  useEffect(() => {
    console.log('Jogo recebido no LotteryForm:', jogo);
    if (!jogo) return; // Evita erros se 'jogo' for null

    const checkStatus = () => {
      const now = new Date();
      const dataFim = jogo.data_fim ? new Date(jogo.data_fim) : null;
      if (jogo.jog_status === 'fechado' && now >= dataFim) {
        setCanCreateLottery(true);
      } else {
        setCanCreateLottery(false);
      }
    };

    checkStatus();
    fetchSorteios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jogo]);

  const fetchSorteios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log(`Buscando sorteios para o jogo: ${jogo.slug}`);
      const response = await axios.get(`/api/jogos/${jogo.slug}/lottery`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Sorteios recebidos:', response.data.sorteios);
      setSorteios(response.data.sorteios);
    } catch (error) {
      console.error('Erro ao buscar sorteios:', error);
      toast({
        title: 'Erro ao buscar sorteios.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLotteryData({
      ...lotteryData,
      [name]: value,
    });
  };

  const handleCreateLottery = async () => {
    try {
      if (!lotteryData.descricao || !lotteryData.numerosSorteados) {
        toast({
          title: 'Campos obrigatórios faltando.',
          description: 'Por favor, preencha todos os campos obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validar se o jogo está fechado
      const now = new Date();
      const dataFim = jogo.data_fim ? new Date(jogo.data_fim) : null;
      if (now < dataFim) {
        toast({
          title: 'Jogo ainda está aberto.',
          description: 'O sorteio só pode ser realizado após a data de encerramento.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Enviar dados para backend
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/jogos/${jogo.slug}/lottery`, {
        descricao: lotteryData.descricao,
        numerosSorteados: lotteryData.numerosSorteados,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Sorteio criado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setLotteryData({
        descricao: '',
        numerosSorteados: '',
      });

      fetchSorteios();
      refreshList();
    } catch (error) {
      console.error('Erro ao criar sorteio:', error);
      toast({
        title: 'Erro ao criar sorteio.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Exibe mensagem se nenhum jogo estiver selecionado
  if (!jogo) {
    return <Text>Por favor, selecione um jogo para criar e visualizar sorteios.</Text>;
  }

  return (
    <Box mt={8}>
      <Text fontSize="xl" mb={4} fontWeight="bold">
        Sorteios
      </Text>
      <Stack spacing={6}>
        {canCreateLottery ? (
          <Box>
            <Text fontSize="lg" mb={2} fontWeight="semibold">
              Criar Novo Sorteio
            </Text>
            <FormControl isRequired mb={4}>
              <FormLabel>Descrição do Sorteio</FormLabel>
              <Textarea
                name="descricao"
                value={lotteryData.descricao}
                onChange={handleChange}
                placeholder="Descrição do sorteio"
              />
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Números Sorteados</FormLabel>
              <Input
                name="numerosSorteados"
                value={lotteryData.numerosSorteados}
                onChange={handleChange}
                placeholder="Ex: 01, 15, 23, 34, 45, 60"
              />
            </FormControl>
            <Button colorScheme="blue" onClick={handleCreateLottery}>
              Criar Sorteio
            </Button>
          </Box>
        ) : (
          <Text color="gray.500">
            O sorteio só pode ser criado após o jogo estar fechado e a data de encerramento ter passado.
          </Text>
        )}
      </Stack>

      <Box mt={10}>
        <Text fontSize="lg" mb={4} fontWeight="semibold">
          Histórico de Sorteios
        </Text>
        {loading ? (
          <Flex justify="center" align="center">
            <Spinner size="lg" />
          </Flex>
        ) : sorteios.length > 0 ? (
          <Table variant="striped" colorScheme="green">
            <Thead>
              <Tr>
                <Th>Descrição</Th>
                <Th>Números Sorteados</Th>
                <Th>Data do Sorteio</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sorteios.map((sorteio) => (
                <Tr key={sorteio.sorteio_id}>
                  <Td>{sorteio.descricao}</Td>
                  <Td>{sorteio.numerosSorteados}</Td>
                  <Td>{new Date(sorteio.dataSorteio).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Text color="gray.500">Nenhum sorteio realizado para este jogo.</Text>
        )}
      </Box>
    </Box>
  );
};

export default LotteryForm;
