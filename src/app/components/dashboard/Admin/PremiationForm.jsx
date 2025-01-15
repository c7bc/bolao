// src/app/components/dashboard/Admin/PremiationForm.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Switch,
  useToast,
  HStack,
  Text
} from '@chakra-ui/react';
import axios from 'axios';

const PremiationForm = ({ jogo, refreshList }) => {
  const [premiationData, setPremiationData] = useState({
    active: false,
    fixedPremiation: {
      campeao: '',
      vice: '',
      ultimoColocado: '',
      comissaoColaboradores: '',
      custosAdministrativos: '',
    },
    pointPrizes: [],
  });
  const toast = useToast();

  useEffect(() => {
    if (jogo && jogo.premiation) {
      setPremiationData({
        active: jogo.premiation.active || false,
        fixedPremiation: jogo.premiation.fixedPremiation || {
          campeao: '',
          vice: '',
          ultimoColocado: '',
          comissaoColaboradores: '',
          custosAdministrativos: '',
        },
        pointPrizes: Array.isArray(jogo.premiation.pointPrizes) ? jogo.premiation.pointPrizes : [],
      });
    } else {
      // Caso 'jogo.premiation' não exista, resetar para valores padrão
      setPremiationData({
        active: false,
        fixedPremiation: {
          campeao: '',
          vice: '',
          ultimoColocado: '',
          comissaoColaboradores: '',
          custosAdministrativos: '',
        },
        pointPrizes: [],
      });
    }
  }, [jogo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('fixedPremiation.')) {
      const field = name.split('.')[1];
      setPremiationData((prev) => ({
        ...prev,
        fixedPremiation: {
          ...prev.fixedPremiation,
          [field]: value,
        },
      }));
    } else if (name === 'active') {
      setPremiationData((prev) => ({
        ...prev,
        active: checked,
      }));
    }
  };

  const handlePointPrizeChange = (index, field, value) => {
    const updatedPointPrizes = [...premiationData.pointPrizes];
    if (updatedPointPrizes[index]) {
      updatedPointPrizes[index][field] = value;
      setPremiationData((prev) => ({
        ...prev,
        pointPrizes: updatedPointPrizes,
      }));
    }
  };

  const addPointPrize = () => {
    setPremiationData((prev) => ({
      ...prev,
      pointPrizes: [...prev.pointPrizes, { pontos: '', premio: '' }],
    }));
  };

  const removePointPrize = (index) => {
    const updatedPointPrizes = [...premiationData.pointPrizes];
    if (updatedPointPrizes[index]) {
      updatedPointPrizes.splice(index, 1);
      setPremiationData((prev) => ({
        ...prev,
        pointPrizes: updatedPointPrizes,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validações
      if (!premiationData.active) {
        const { campeao, vice, ultimoColocado, comissaoColaboradores, custosAdministrativos } = premiationData.fixedPremiation;
        const total =
          (parseFloat(campeao) || 0) +
          (parseFloat(vice) || 0) +
          (parseFloat(ultimoColocado) || 0) +
          (parseFloat(comissaoColaboradores) || 0) +
          (parseFloat(custosAdministrativos) || 0);

        if (total !== 100) {
          toast({
            title: 'Soma das porcentagens inválida.',
            description: 'A soma das porcentagens deve ser igual a 100%.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      } else {
        // Validação dos Prêmios por Pontuação
        if (premiationData.pointPrizes.length > 0) {
          for (let i = 0; i < premiationData.pointPrizes.length; i++) {
            const prize = premiationData.pointPrizes[i];
            if (!prize.pontos || !prize.premio) {
              toast({
                title: 'Prêmio inválido.',
                description: `Por favor, preencha todos os campos para o prêmio ${i + 1}.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
              return;
            }
            if (parseFloat(prize.pontos) <= 0) {
              toast({
                title: 'Pontos inválidos.',
                description: `Os pontos para o prêmio ${i + 1} devem ser maiores que zero.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
              return;
            }
            if (parseFloat(prize.premio) <= 0) {
              toast({
                title: 'Prêmio inválido.',
                description: `O valor do prêmio ${i + 1} deve ser maior que zero.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
              return;
            }
          }
        } else {
          toast({
            title: 'Sem prêmios por pontuação.',
            description: 'Por favor, adicione pelo menos um prêmio por pontuação.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

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

      await axios.put(`/api/jogos/${jogo.slug}/premiation`, premiationData, {
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
      <Stack spacing={4}>
        {/* Toggle para Premiação por Pontuação */}
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="active" mb="0">
            Premiação por Pontuação Ativa?
          </FormLabel>
          <Switch
            id="active"
            name="active"
            isChecked={premiationData.active}
            onChange={handleChange}
            colorScheme="green"
          />
        </FormControl>

        {/* Premiação Fixa */}
        {!premiationData.active && (
          <>
            <FormControl isRequired>
              <FormLabel>Campeão (%)</FormLabel>
              <Input
                type="number"
                name="fixedPremiation.campeao"
                value={premiationData.fixedPremiation.campeao}
                onChange={handleChange}
                placeholder="Ex: 40"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Vice (%)</FormLabel>
              <Input
                type="number"
                name="fixedPremiation.vice"
                value={premiationData.fixedPremiation.vice}
                onChange={handleChange}
                placeholder="Ex: 20"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Último Colocado (%)</FormLabel>
              <Input
                type="number"
                name="fixedPremiation.ultimoColocado"
                value={premiationData.fixedPremiation.ultimoColocado}
                onChange={handleChange}
                placeholder="Ex: 10"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Comissão de Colaboradores (%)</FormLabel>
              <Input
                type="number"
                name="fixedPremiation.comissaoColaboradores"
                value={premiationData.fixedPremiation.comissaoColaboradores}
                onChange={handleChange}
                placeholder="Ex: 15"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Custos Administrativos (%)</FormLabel>
              <Input
                type="number"
                name="fixedPremiation.custosAdministrativos"
                value={premiationData.fixedPremiation.custosAdministrativos}
                onChange={handleChange}
                placeholder="Ex: 15"
              />
            </FormControl>
            {/* Soma das Porcentagens */}
            <Text color={
              Object.values(premiationData.fixedPremiation).reduce(
                (acc, val) => acc + (parseFloat(val) || 0),
                0
              ) === 100 ? 'green.500' : 'red.500'
            }>
              Soma das porcentagens: {Object.values(premiationData.fixedPremiation).reduce(
                (acc, val) => acc + (parseFloat(val) || 0),
                0
              )}%
            </Text>
            {Object.values(premiationData.fixedPremiation).reduce(
              (acc, val) => acc + (parseFloat(val) || 0),
              0
            ) !== 100 && (
              <Text color="red.500">
                A soma das porcentagens deve ser igual a 100%.
              </Text>
            )}
          </>
        )}

        {/* Premiação por Pontuação */}
        {premiationData.active && (
          <Box>
            <Text fontWeight="bold" mb={2}>Premiação por Pontuação</Text>
            {premiationData.pointPrizes && premiationData.pointPrizes.length > 0 ? (
              premiationData.pointPrizes.map((prize, index) => (
                <HStack key={index} spacing={4} mb={2}>
                  <FormControl isRequired>
                    <FormLabel>Pontos</FormLabel>
                    <Input
                      type="number"
                      value={prize.pontos}
                      onChange={(e) => handlePointPrizeChange(index, 'pontos', e.target.value)}
                      placeholder="Ex: 5"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Prêmio (R$)</FormLabel>
                    <Input
                      type="number"
                      value={prize.premio}
                      onChange={(e) => handlePointPrizeChange(index, 'premio', e.target.value)}
                      placeholder="Ex: 1000"
                    />
                  </FormControl>
                  <Button colorScheme="red" onClick={() => removePointPrize(index)}>
                    Remover
                  </Button>
                </HStack>
              ))
            ) : (
              <Text color="gray.500" mb={2}>
                Nenhum prêmio por pontuação adicionado.
              </Text>
            )}
            <Button onClick={addPointPrize} colorScheme="green">
              Adicionar Prêmio
            </Button>
          </Box>
        )}

        <Button colorScheme="blue" onClick={handleSubmit}>
          Salvar Premiação
        </Button>
      </Stack>
    </Box>
  );
};

export default PremiationForm;
