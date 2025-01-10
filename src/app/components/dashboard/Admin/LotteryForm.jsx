// src/app/components/dashboard/Admin/LotteryForm.jsx

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

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const closingDate = new Date(jogo.data_fim);
      if (jogo.jog_status === 'fechado' && now > closingDate) {
        setCanCreateLottery(true);
      } else {
        setCanCreateLottery(false);
      }
    };

    checkStatus();
  }, [jogo]);

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
      const closingDate = new Date(jogo.data_fim);
      if (now < closingDate) {
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
      await axios.post(`/api/jogos/${jogo.slug}/lottery`, {
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

  return (
    <Box>
      {canCreateLottery ? (
        <Stack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Descrição do Sorteio</FormLabel>
            <Textarea
              name="descricao"
              value={lotteryData.descricao}
              onChange={handleChange}
              placeholder="Descrição do sorteio"
            />
          </FormControl>
          <FormControl isRequired>
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
        </Stack>
      ) : (
        <Text>O sorteio só pode ser criado após o jogo estar fechado e a data de encerramento ter passado.</Text>
      )}
    </Box>
  );
};

export default LotteryForm;
