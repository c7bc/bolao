// src/app/components/dashboard/Admin/AdminDashboard.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText, 
  StatArrow,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Progress,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
} from 'react-icons/fi';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

const StatCard = ({ title, value, increase, icon, description }) => {
  const cardBg = useColorModeValue('white', 'green.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const iconBg = useColorModeValue('green.100', 'green.900');
  const iconColor = useColorModeValue('green.500', 'green.200');

  return (
    <Card
      bg={cardBg}
      shadow="xl" 
      borderRadius="2xl"
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-5px)' }}
    >
      <CardBody>
        <Flex justify="space-between" align="center">
          <Stat>
            <StatLabel color={textColor}>{title}</StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" mt="2">
              {value}
            </StatNumber>
            {increase !== undefined && (
              <StatHelpText mb="0">
                <StatArrow type={increase >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(increase)}%
              </StatHelpText>
            )}
            {description && (
              <Text fontSize="sm" color={textColor} mt="2">
                {description}
              </Text>
            )}
          </Stat>
          <Box
            p="3"
            bg={iconBg}
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={icon} w="6" h="6" color={iconColor} />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

const RecentActivityCard = () => {
  const cardBg = useColorModeValue('white', 'green.800');
  const borderColor = useColorModeValue('green.100', 'green.700');

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/activities/recent', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setActivities(response.data.atividades || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="2xl">
      <CardBody>
        <Heading size="md" mb="4">
          Atividades Recentes
        </Heading>
        {loading ? (
          <Flex justify="center" align="center">
            <Spinner />
          </Flex>
        ) : activities.length > 0 ? (
          <Stack spacing="4">
            {activities.map((activity, index) => (
              <Flex
                key={index}
                justify="space-between"
                align="center"
                p="3"
                borderBottom={index !== activities.length - 1 ? '1px' : 'none'}
                borderColor={borderColor}
              >
                <Flex align="center" gap="3">
                  <Badge
                    colorScheme={
                      activity.status === 'success'
                        ? 'green'
                        : activity.status === 'warning'
                        ? 'yellow'
                        : activity.status === 'error'
                        ? 'red'
                        : 'blue'
                    }
                    borderRadius="full"
                    px="2"
                  >
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </Badge>
                  <Text>{activity.text}</Text>
                </Flex>
                <Text fontSize="sm" color="gray.500">
                  {activity.time}
                </Text>
              </Flex>
            ))}
          </Stack>
        ) : (
          <Text>Nenhuma atividade recente encontrada.</Text>
        )}
      </CardBody>
    </Card>
  );
};

const TaskProgressCard = () => {
  const cardBg = useColorModeValue('white', 'green.800');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks/progress', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks(response.data.tarefas || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="2xl">
      <CardBody>
        <Heading size="md" mb="4">
          Progresso das Tarefas
        </Heading>
        {loading ? (
          <Flex justify="center" align="center">
            <Spinner />
          </Flex>
        ) : tasks.length > 0 ? (
          <Stack spacing="4">
            {tasks.map((task, index) => (
              <Box key={index}>
                <Flex justify="space-between" mb="2">
                  <Text fontSize="sm">{task.name}</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {task.progress}%
                  </Text>
                </Flex>
                <Progress
                  value={task.progress}
                  colorScheme={task.color || 'green'}
                  borderRadius="full"
                  size="sm"
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Text>Nenhuma tarefa em progresso.</Text>
        )}
      </CardBody>
    </Card>
  );
};

const AdminDashboard = ({ userName = 'Administrador' }) => {
  const bgColor = useColorModeValue('green.50', 'gray.900');
  const headingColor = useColorModeValue('green.800', 'white');
  const toast = useToast();

  const [stats, setStats] = useState({
    usuariosAtivos: 0,
    receitaMensal: 0,
    taxaConversao: 0,
    jogosAtivos: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [usuariosRes, financeiroRes, jogosRes] = await Promise.all([
        axios.get('/api/users/active', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('/api/financeiro/resumo', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('/api/jogos/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { status: 'open' },
        }),
      ]);

      setStats({
        usuariosAtivos: Array.isArray(usuariosRes.data.usuarios) ? usuariosRes.data.usuarios.length : 0,
        receitaMensal: typeof financeiroRes.data.totalRecebido === 'number' ? financeiroRes.data.totalRecebido : 0,
        taxaConversao: typeof financeiroRes.data.taxaConversao === 'number' ? financeiroRes.data.taxaConversao : 0,
        jogosAtivos: Array.isArray(jogosRes.data.jogos) ? jogosRes.data.jogos.length : 0,
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar estatísticas.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Box
      p={{ base: 4, md: 8 }}
      bg={bgColor}
      minH="100vh"
      transition="0.3s ease"
    >
      <Flex
        direction="column"
        gap="6"
      >
        {/* Header Section */}
        <Box mb="6">
          <Heading
            size="lg"
            color={headingColor}
            fontWeight="bold"
            mb="2"
          >
            Dashboard do Administrador
          </Heading>
          <Text
            fontSize="md"
            color={useColorModeValue('gray.600', 'gray.300')}
          >
            Bem-vindo de volta, {userName}! Aqui está o resumo do seu sistema.
          </Text>
        </Box>

        {/* Stats Grid */}
        {loading ? (
          <Flex justify="center" align="center" mt="10">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing="6"
          >
            <StatCard
              title="Jogos Ativos"
              value={stats.jogosAtivos}
              increase={15}
              icon={FiActivity}
              description="Total de jogos ativos na plataforma"
            />
          </SimpleGrid>
        )}

        {/* Activity and Tasks Grid */}
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing="6"
          mt="6"
        >
          <RecentActivityCard />
          <TaskProgressCard />
        </SimpleGrid>
      </Flex>
    </Box>
  );
};

export default AdminDashboard;
