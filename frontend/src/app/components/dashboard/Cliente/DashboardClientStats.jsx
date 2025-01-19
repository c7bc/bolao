'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Card,
  CardBody,
  Grid,
  Spinner,
  Text,
  useToast,
  Tooltip,
  IconButton,
  HStack,
  VStack,
  Skeleton,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import axios from 'axios';

export function DashboardClientStats() {
  const [stats, setStats] = useState({
    totalGanho: 0,
    jogosParticipados: 0,
    jogosAtivos: 0,
    lastUpdate: null,
    previousStats: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      setRefreshing(true);

      const response = await axios.get('/api/cliente/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        // Guardar estatísticas anteriores para comparação
        const previousStats = { ...stats };
        
        setStats({
          totalGanho: parseFloat(response.data.totalGanho || 0),
          jogosParticipados: parseInt(response.data.jogosParticipados || 0),
          jogosAtivos: parseInt(response.data.jogosAtivos || 0),
          lastUpdate: new Date().toISOString(),
          previousStats
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar estatísticas',
        description: error.response?.data?.error || 'Não foi possível carregar suas estatísticas.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats();
  };

  const calculatePercentageChange = (current, previous) => {
    if (!previous || !previous.previousStats) return null;
    const previousValue = previous.previousStats[current];
    const currentValue = stats[current];
    if (previousValue === 0) return null;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  if (loading) {
    return (
      <Card p={4} w="full" bg="white" boxShadow="md">
        <CardBody>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            {[1, 2, 3].map((index) => (
              <Box key={index}>
                <Skeleton height="20px" mb={2} />
                <Skeleton height="40px" />
              </Box>
            ))}
          </Grid>
        </CardBody>
      </Card>
    );
  }

  return (
    <StatGroup mb={6}>
      <Card p={4} w="full" bg="white" boxShadow="md">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="sm" color="gray.600">
              Última atualização: {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'Nunca'}
            </Text>
            <Tooltip label="Atualizar estatísticas">
              <IconButton
                icon={<RepeatIcon />}
                isLoading={refreshing}
                onClick={handleRefresh}
                variant="ghost"
                colorScheme="green"
                aria-label="Atualizar estatísticas"
              />
            </Tooltip>
          </HStack>

          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            <Stat>
              <StatLabel fontSize="lg" fontWeight="medium" color="gray.600">
                Total Ganho
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="green.500">
                {formatCurrency(stats.totalGanho)}
              </StatNumber>
              {calculatePercentageChange('totalGanho') !== null && (
                <StatHelpText>
                  <StatArrow type={calculatePercentageChange('totalGanho') >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(calculatePercentageChange('totalGanho')).toFixed(1)}%
                </StatHelpText>
              )}
            </Stat>

            <Stat>
              <StatLabel fontSize="lg" fontWeight="medium" color="gray.600">
                Jogos Participados
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="purple.500">
                {stats.jogosParticipados}
              </StatNumber>
              {calculatePercentageChange('jogosParticipados') !== null && (
                <StatHelpText>
                  <StatArrow type={calculatePercentageChange('jogosParticipados') >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(calculatePercentageChange('jogosParticipados')).toFixed(1)}%
                </StatHelpText>
              )}
            </Stat>

            <Stat>
              <StatLabel fontSize="lg" fontWeight="medium" color="gray.600">
                Jogos Ativos
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="blue.500">
                {stats.jogosAtivos}
              </StatNumber>
              {calculatePercentageChange('jogosAtivos') !== null && (
                <StatHelpText>
                  <StatArrow type={calculatePercentageChange('jogosAtivos') >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(calculatePercentageChange('jogosAtivos')).toFixed(1)}%
                </StatHelpText>
              )}
            </Stat>
          </Grid>
        </CardBody>
      </Card>
    </StatGroup>
  );
}