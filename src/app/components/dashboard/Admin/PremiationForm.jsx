// Caminho: src/app/components/dashboard/Admin/PremiationForm.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Switch,
  Button,
  Select,
  Input,
  Stack,
  HStack,
  NumberInput,
  NumberInputField,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const PremiationForm = ({ jogo, refreshList }) => {
  const [premiationActive, setPremiationActive] = useState(false);
  const [premiationDetails, setPremiationDetails] = useState({
    campeao: '',
    vice: '',
    ultimoColocado: '',
    comissaoColaboradores: '',
    custosAdministrativos: '',
  });
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [pointPrizes, setPointPrizes] = useState([]);
  const toast = useToast();

  useEffect(() => {
    // Buscar detalhes de premiação do jogo
    const fetchPremiation = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: 'Token não encontrado.',
            description: 'Por favor, faça login novamente.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const response = await axios.get(`/api/jogos/${jogo.slug}/premiation`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data.premiation || {};
        setPremiationActive(data.active || false);
        setPremiationDetails({
          campeao: data.campeao || '',
          vice: data.vice || '',
          ultimoColocado: data.ultimoColocado || '',
          comissaoColaboradores: data.comissaoColaboradores || '',
          custosAdministrativos: data.custosAdministrativos || '',
        });
        setPointPrizes(data.pointPrizes || []);
      } catch (error) {
        console.error('Erro ao buscar premiação:', error);
        toast({
          title: 'Erro ao buscar premiação.',
          description: error.response?.data?.error || 'Erro desconhecido.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchPremiation();
  }, [jogo.slug, toast]);

  useEffect(() => {
    const total = Object.values(premiationDetails).reduce((acc, val) => acc + parseFloat(val || 0), 0);
    setTotalPercentage(total);
  }, [premiationDetails]);

  const handleToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.put(`/api/jogos/${jogo.slug}/premiation`, { active: !premiationActive }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPremiationActive(!premiationActive);
      toast({
        title: 'Premiação atualizada.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar premiação:', error);
      toast({
        title: 'Erro ao atualizar premiação.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePremiationChange = (e) => {
    const { name, value } = e.target;
    setPremiationDetails({
      ...premiationDetails,
      [name]: value,
    });
  };

  const handlePointPrizeAdd = () => {
    setPointPrizes([...pointPrizes, { pontos: '', premio: '' }]);
  };

  const handlePointPrizeRemove = (index) => {
    const updated = pointPrizes.filter((_, idx) => idx !== index);
    setPointPrizes(updated);
  };

  const handlePointPrizeChange = (index, field, value) => {
    const updated = pointPrizes.map((prize, idx) => {
      if (idx === index) {
        return { ...prize, [field]: value };
      }
      return prize;
    });
    setPointPrizes(updated);
  };

  const handleSubmit = async () => {
    try {
      if (premiationActive) {
        if (totalPercentage !== 100) {
          toast({
            title: 'Erro na premiação.',
            description: 'A soma das porcentagens deve ser igual a 100%.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      const payload = {
        active: premiationActive,
        ...premiationDetails,
        pointPrizes: premiationActive ? pointPrizes : [],
      };

      const token = localStorage.getItem('token');
      await axios.put(`/api/jogos/${jogo.slug}/premiation`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Premiação atualizada com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      refreshList();
    } catch (error) {
      console.error('Erro ao atualizar premiação:', error);
      toast({
        title: 'Erro ao atualizar premiação.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel htmlFor="premiationActive" mb="0">
          Premiação por Pontuação
        </FormLabel>
        <Switch
          id="premiationActive"
          isChecked={premiationActive}
          onChange={handleToggle}
          colorScheme="green"
        />
      </FormControl>

      {premiationActive && (
        <Stack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Campeão</FormLabel>
            <Input
              name="campeao"
              value={premiationDetails.campeao}
              onChange={handlePremiationChange}
              placeholder="Ex: Primeiro Lugar"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Vice</FormLabel>
            <Input
              name="vice"
              value={premiationDetails.vice}
              onChange={handlePremiationChange}
              placeholder="Ex: Segundo Lugar"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Último Colocado</FormLabel>
            <Input
              name="ultimoColocado"
              value={premiationDetails.ultimoColocado}
              onChange={handlePremiationChange}
              placeholder="Ex: Último Lugar"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Comissão para Colaboradores (%)</FormLabel>
            <NumberInput min={0} max={100}>
              <NumberInputField
                name="comissaoColaboradores"
                value={premiationDetails.comissaoColaboradores}
                onChange={handlePremiationChange}
                placeholder="Ex: 10"
              />
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Custos Administrativos (%)</FormLabel>
            <NumberInput min={0} max={100}>
              <NumberInputField
                name="custosAdministrativos"
                value={premiationDetails.custosAdministrativos}
                onChange={handlePremiationChange}
                placeholder="Ex: 20"
              />
            </NumberInput>
          </FormControl>
          {/* Verificar se a soma das porcentagens é 100 */}
          <Text color={totalPercentage === 100 ? 'green.500' : 'red.500'}>
            Soma das porcentagens: {totalPercentage}%
          </Text>
          {/* Formulários para adicionar/remover premiações por pontos */}
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold">Premiações por Pontuação</Text>
              <Button size="sm" onClick={handlePointPrizeAdd}>Adicionar</Button>
            </HStack>
            {pointPrizes.map((prize, index) => (
              <HStack key={index} spacing={4} mb={2}>
                <FormControl isRequired>
                  <FormLabel>Pontos</FormLabel>
                  <NumberInput min={1}>
                    <NumberInputField
                      value={prize.pontos}
                      onChange={(e) => handlePointPrizeChange(index, 'pontos', e.target.value)}
                      placeholder="Ex: 10"
                    />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Valor do Prêmio (R$)</FormLabel>
                  <NumberInput min={0} precision={2} step={0.01}>
                    <NumberInputField
                      value={prize.premio}
                      onChange={(e) => handlePointPrizeChange(index, 'premio', e.target.value)}
                      placeholder="Ex: 1000.00"
                    />
                  </NumberInput>
                </FormControl>
                <Button colorScheme="red" onClick={() => handlePointPrizeRemove(index)}>
                  Remover
                </Button>
              </HStack>
            ))}
          </Box>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Salvar Premiação
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default PremiationForm;
