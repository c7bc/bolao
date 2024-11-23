'use client';

import React from 'react';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Progress,
  Badge,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

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

  const activities = [
    { status: 'success', text: 'Novo usuário registrado', time: '5 min atrás' },
    { status: 'warning', text: 'Atualização pendente', time: '1h atrás' },
    { status: 'info', text: 'Novo jogo adicionado', time: '2h atrás' },
    { status: 'error', text: 'Erro no sistema', time: '3h atrás' },
  ];

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="2xl">
      <CardBody>
        <Heading size="md" mb="4">
          Atividades Recentes
        </Heading>
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
                  {activity.status}
                </Badge>
                <Text>{activity.text}</Text>
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {activity.time}
              </Text>
            </Flex>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};

const TaskProgressCard = () => {
  const cardBg = useColorModeValue('white', 'green.800');
  
  const tasks = [
    { name: 'Manutenção do Sistema', progress: 75, color: 'green' },
    { name: 'Atualização de Usuários', progress: 45, color: 'blue' },
    { name: 'Backup de Dados', progress: 90, color: 'purple' },
  ];

  return (
    <Card bg={cardBg} shadow="xl" borderRadius="2xl">
      <CardBody>
        <Heading size="md" mb="4">
          Progresso das Tarefas
        </Heading>
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
                colorScheme={task.color}
                borderRadius="full"
                size="sm"
              />
            </Box>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};

const AdminDashboard = ({ userName = 'Administrador' }) => {
  const bgColor = useColorModeValue('green.50', 'gray.900');
  const headingColor = useColorModeValue('green.800', 'white');

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
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing="6"
        >
          <StatCard
            title="Usuários Ativos"
            value="1,257"
            increase={12}
            icon={FiUsers}
            description="Total de usuários ativos no sistema"
          />
          <StatCard
            title="Receita Mensal"
            value="R$ 45.750"
            increase={8}
            icon={FiDollarSign}
            description="Receita total do mês atual"
          />
          <StatCard
            title="Taxa de Conversão"
            value="64%"
            increase={-3}
            icon={FiTrendingUp}
            description="Taxa de conversão de visitantes"
          />
          <StatCard
            title="Jogos Ativos"
            value="28"
            increase={15}
            icon={FiActivity}
            description="Total de jogos ativos na plataforma"
          />
        </SimpleGrid>

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
