// Caminho: src\app\components\dashboard\Admin\AdminDashboard.jsx
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


// Caminho: 
// src/app/components/dashboard/Admin/Configuracoes.jsx

import React from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import JogosConfig from './JogosConfig';
import RecebimentoConfig from './RecebimentoConfig';
import PorcentagensConfig from './PorcentagensConfig';

const Configuracoes = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Configurações
      </Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Jogos</Tab>
          <Tab>Recebimento</Tab>
          <Tab>Porcentagens</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <JogosConfig />
          </TabPanel>
          <TabPanel>
            <RecebimentoConfig />
          </TabPanel>
          <TabPanel>
            <PorcentagensConfig />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Configuracoes;


// Caminho: 
// src/app/components/dashboard/Admin/Financeiro.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import axios from 'axios';

const Financeiro = () => {
  const [resumo, setResumo] = useState({
    totalRecebido: 0,
    totalComissaoColaborador: 0,
    totalPago: 0,
  });
  const [comissoesColaboradores, setComissoesColaboradores] = useState([]);
  const [comissoesClientes, setComissoesClientes] = useState([]);

  const fetchFinanceiro = async () => {
    try {
      const resumoResponse = await axios.get('/api/financeiro/resumo');
      const colaboradoresResponse = await axios.get('/api/financeiro/colaboradores');
      const clientesResponse = await axios.get('/api/financeiro/clientes');

      setResumo(resumoResponse.data);
      setComissoesColaboradores(colaboradoresResponse.data.comissoes);
      setComissoesClientes(clientesResponse.data.comissoes);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    }
  };

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Financeiro
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Stat>
          <StatLabel>Total Recebido</StatLabel>
          <StatNumber>R$ {resumo.totalRecebido.toFixed(2)}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Comissão Colaboradores</StatLabel>
          <StatNumber>R$ {resumo.totalComissaoColaborador.toFixed(2)}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Pago</StatLabel>
          <StatNumber>R$ {resumo.totalPago.toFixed(2)}</StatNumber>
          <StatHelpText>Até o momento</StatHelpText>
        </Stat>
      </SimpleGrid>
      <Heading size="md" mb={2}>
        Comissão dos Colaboradores
      </Heading>
      <Table variant="simple" mb={6}>
        <Thead>
          <Tr>
            <Th>Colaborador</Th>
            <Th>Comissão (R$)</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {comissoesColaboradores.map((item) => (
            <Tr key={item.colaboradorId}>
              <Td>{item.nomeColaborador}</Td>
              <Td>R$ {item.comissao.toFixed(2)}</Td>
              <Td>
                <Badge colorScheme={item.status === 'pago' ? 'green' : 'yellow'}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Heading size="md" mb={2}>
        Comissão dos Clientes
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Cliente</Th>
            <Th>Comissão (R$)</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {comissoesClientes.map((item) => (
            <Tr key={item.clienteId}>
              <Td>{item.nomeCliente}</Td>
              <Td>R$ {item.comissao.toFixed(2)}</Td>
              <Td>
                <Badge colorScheme={item.status === 'pago' ? 'green' : 'yellow'}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Financeiro;


// Caminho: 
// src/app/components/dashboard/Admin/GameDetailsModal.jsx

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Stack,
  Badge,
} from '@chakra-ui/react';

const GameDetailsModal = ({ isOpen, onClose, jogo }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {jogo.jog_nome}</Text>
            <Text><strong>Status:</strong> {jogo.jog_status === 'open' ? 'Em andamento' : 
                                          jogo.jog_status === 'closed' ? 'Encerrado' : 'Em breve'}</Text>
            <Text><strong>Tipo:</strong> {jogo.jog_tipodojogo}</Text>
            <Text><strong>Valor do Ticket:</strong> {jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Text>
            <Text><strong>Valor do Prêmio:</strong> {jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Text>
            <Text><strong>Quantidade Mínima de Seleções:</strong> {jogo.jog_quantidade_minima}</Text>
            <Text><strong>Quantidade Máxima de Seleções:</strong> {jogo.jog_quantidade_maxima}</Text>
            <Text><strong>Seleções:</strong> {jogo.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (jogo.jog_numeros || 'N/A') : (jogo.jog_numeros || 'N/A')}</Text>
            <Text><strong>Pontos Necessários:</strong> {jogo.jog_pontos_necessarios || 'N/A'}</Text>
            <Text><strong>Data de Início:</strong> {new Date(jogo.jog_data_inicio).toLocaleDateString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(jogo.jog_data_fim).toLocaleDateString()}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(jogo.jog_datacriacao).toLocaleString()}</Text>
            <Text><strong>Slug:</strong> {jogo.slug}</Text>
            <Text><strong>Visível na Concursos:</strong> {jogo.visibleInConcursos ? 'Sim' : 'Não'}</Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameDetailsModal;


// Caminho: 
// src/app/components/dashboard/Admin/GameEditModal.jsx

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  FormHelperText,
  useToast,
  Stack,
  HStack,
  Box,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
} from '@chakra-ui/react';
import axios from 'axios';
import slugify from 'slugify';

// List of animals for JOGO_DO_BICHO
const animalOptions = [
  'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
  'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
  'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
  'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
  'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
];

const GameEditModal = ({ isOpen, onClose, refreshList, jogo }) => {
  const [formData, setFormData] = useState({ ...jogo });
  const [generateNumbers, setGenerateNumbers] = useState(jogo.jog_numeros ? true : false);
  const [requirePoints, setRequirePoints] = useState(jogo.jog_pontos_necessarios ? true : false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState(jogo.jog_tipodojogo === 'JOGO_DO_BICHO' && jogo.jog_numeros ? jogo.jog_numeros.split(',').map(a => a.trim()) : []);

  const toast = useToast();

  useEffect(() => {
    setFormData({ ...jogo });
    setGenerateNumbers(jogo.jog_numeros ? true : false);
    setRequirePoints(jogo.jog_pontos_necessarios ? true : false);
    setAutoGenerate(false);
    setSelectedAnimals(jogo.jog_tipodojogo === 'JOGO_DO_BICHO' && jogo.jog_numeros ? jogo.jog_numeros.split(',').map(a => a.trim()) : []);
  }, [jogo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'generateNumbers') {
        setGenerateNumbers(checked);
        if (!checked) {
          setFormData({ ...formData, jog_numeros: '' });
          setSelectedAnimals([]);
        }
      }
      if (name === 'requirePoints') {
        setRequirePoints(checked);
        if (!checked) {
          setFormData({ ...formData, jog_pontos_necessarios: '' });
        }
      }
      if (name === 'autoGenerate') {
        setAutoGenerate(checked);
        if (checked) {
          // Auto-generate numbers or animals based on game type
          if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
            const min = parseInt(formData.jog_quantidade_minima, 10) || 6;
            const max = parseInt(formData.jog_quantidade_maxima, 10) || 15;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            const generatedNumbers = generateUniqueNumbers(count, 1, 60); // Adjust limits as needed
            setFormData({ ...formData, jog_numeros: generatedNumbers.join(',') });
          } else {
            const min = parseInt(formData.jog_quantidade_minima, 10) || 1;
            const max = parseInt(formData.jog_quantidade_maxima, 10) || 25;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            const generatedAnimals = generateUniqueAnimals(count);
            setSelectedAnimals(generatedAnimals);
            setFormData({ ...formData, jog_numeros: generatedAnimals.join(',') });
          }
        } else {
          setFormData({ ...formData, jog_numeros: '' });
          setSelectedAnimals([]);
        }
      }
    } else if (name === 'jog_tipodojogo') {
      setFormData({ ...formData, [name]: value });
      // Reset jog_numeros and selection when game type changes
      setFormData({ ...formData, [name]: value, jog_numeros: '' });
      setSelectedAnimals([]);
      setGenerateNumbers(false);
      setAutoGenerate(false);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAnimalSelection = (selected) => {
    setSelectedAnimals(selected);
    setFormData({ ...formData, jog_numeros: selected.join(',') });
  };

  // Function to generate unique numbers
  const generateUniqueNumbers = (count, min, max) => {
    const numbers = new Set();
    while (numbers.size < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(num);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  // Function to generate unique animals
  const generateUniqueAnimals = (count) => {
    const shuffled = animalOptions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleSubmit = async () => {
    try {
      // Additional front-end validations
      if (generateNumbers && !autoGenerate && !formData.jog_numeros) {
        toast({
          title: 'Números/Animais são obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (generateNumbers && formData.jog_numeros) {
        if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
          const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
          if (
            numerosArray.length < parseInt(formData.jog_quantidade_minima, 10) ||
            numerosArray.length > parseInt(formData.jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de números deve estar entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima}.`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
          if (!numerosValidos) {
            toast({
              title: 'Os números devem conter apenas dígitos.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        } else {
          // For JOGO_DO_BICHO
          const animalsArray = formData.jog_numeros.split(',').map(a => a.trim());
          if (
            animalsArray.length < parseInt(formData.jog_quantidade_minima, 10) ||
            animalsArray.length > parseInt(formData.jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de animais deve estar entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima}.`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const validAnimals = animalOptions;
          const animaisValidos = animalsArray.every(animal => validAnimals.includes(animal));
          if (!animaisValidos) {
            toast({
              title: 'Os animais devem ser válidos e separados por vírgula.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        }
      }

      if (requirePoints && !formData.jog_pontos_necessarios) {
        toast({
          title: 'Pontos necessários são obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (formData.slug && formData.slug !== '') {
        const slugified = slugify(formData.slug, { lower: true, strict: true });
        setFormData({ ...formData, slug: slugified });
      }

      // If jog_tipodojogo is not 'JOGO_DO_BICHO', set jog_numeros accordingly
      if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
        // Ensure jog_numeros is a comma-separated string of numbers
        if (formData.jog_numeros) {
          const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
          setFormData({ ...formData, jog_numeros: numerosArray.join(',') });
        }
      } else {
        // For JOGO_DO_BICHO, jog_numeros should be a comma-separated string of animals
        if (selectedAnimals.length > 0) {
          setFormData({ ...formData, jog_numeros: selectedAnimals.join(',') });
        }
      }

      // Handle jog_valorpremio (Valor do Prêmio)
      if (formData.jog_valorpremio && (isNaN(formData.jog_valorpremio) || Number(formData.jog_valorpremio) < 0)) {
        toast({
          title: 'Valor do Prêmio inválido.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const token = localStorage.getItem('token');
      await axios.put(`/api/jogos/${jogo.slug}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Jogo atualizado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="jog_nome"
                value={formData.jog_nome}
                onChange={handleInputChange}
                placeholder="Ex: Mega Sena"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Slug</FormLabel>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Ex: mega-sena"
              />
              <FormHelperText>
                URL amigável.
              </FormHelperText>
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibleInConcursos" mb="0">
                Visível na Concursos?
              </FormLabel>
              <Switch
                id="visibleInConcursos"
                name="visibleInConcursos"
                isChecked={formData.visibleInConcursos}
                onChange={(e) => setFormData({ ...formData, visibleInConcursos: e.target.checked })}
                colorScheme="green"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Status</FormLabel>
              <Select name="jog_status" value={formData.jog_status} onChange={handleInputChange}>
                <option value="open">Em Andamento</option>
                <option value="upcoming">Próximos</option>
                <option value="closed">Encerrados</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tipo de Jogo</FormLabel>
              <Select name="jog_tipodojogo" value={formData.jog_tipodojogo} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="MEGA">MEGA</option>
                <option value="LOTOFACIL">LOTOFACIL</option>
                <option value="JOGO_DO_BICHO">JOGO DO BICHO</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Valor do Ticket (R$)</FormLabel>
              <Input
                name="jog_valorjogo"
                type="number"
                value={formData.jog_valorjogo}
                onChange={handleInputChange}
                placeholder="Ex: 10.00"
                min="0"
              />
              <FormHelperText>
                Opcional. Deixe em branco se não quiser definir um valor.
              </FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Valor do Prêmio (R$)</FormLabel>
              <Input
                name="jog_valorpremio"
                type="number"
                value={formData.jog_valorpremio}
                onChange={handleInputChange}
                placeholder="Ex: 1000.00"
                min="0"
              />
              <FormHelperText>
                Opcional. Deixe em branco se não quiser definir um valor.
              </FormHelperText>
            </FormControl>
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Quantidade Mínima de Seleções</FormLabel>
                <Input
                  name="jog_quantidade_minima"
                  type="number"
                  value={formData.jog_quantidade_minima}
                  onChange={handleInputChange}
                  placeholder="Ex: 6"
                  min="1"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Quantidade Máxima de Seleções</FormLabel>
                <Input
                  name="jog_quantidade_maxima"
                  type="number"
                  value={formData.jog_quantidade_maxima}
                  onChange={handleInputChange}
                  placeholder="Ex: 15"
                  min="1"
                />
              </FormControl>
            </HStack>
            {/* Option to define required points */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="requirePoints" mb="0">
                Pontos Necessários?
              </FormLabel>
              <Switch
                id="requirePoints"
                name="requirePoints"
                isChecked={requirePoints}
                onChange={handleInputChange}
                colorScheme="green"
              />
            </FormControl>
            {requirePoints && (
              <FormControl>
                <FormLabel>Pontos Necessários</FormLabel>
                <Input
                  name="jog_pontos_necessarios"
                  type="number"
                  value={formData.jog_pontos_necessarios}
                  onChange={handleInputChange}
                  placeholder="Ex: 50"
                  min="0"
                />
              </FormControl>
            )}
            {/* Option to generate numbers or animals */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="generateNumbers" mb="0">
                Gerar Seleções?
              </FormLabel>
              <Switch
                id="generateNumbers"
                name="generateNumbers"
                isChecked={generateNumbers}
                onChange={handleInputChange}
                colorScheme="blue"
              />
            </FormControl>
            {generateNumbers && (
              <>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="autoGenerate" mb="0">
                    Gerar Automaticamente?
                  </FormLabel>
                  <Switch
                    id="autoGenerate"
                    name="autoGenerate"
                    isChecked={autoGenerate}
                    onChange={handleInputChange}
                    colorScheme="purple"
                  />
                </FormControl>
                {!autoGenerate && (
                  <>
                    {formData.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (
                      <FormControl>
                        <FormLabel>Seleções (separadas por vírgula)</FormLabel>
                        <Input
                          name="jog_numeros"
                          value={formData.jog_numeros}
                          onChange={handleInputChange}
                          placeholder="Ex: 01,02,03,04,05,06"
                        />
                        <FormHelperText>
                          Insira entre {formData.jog_quantidade_minima} e {formData.jog_quantidade_maxima} números.
                        </FormHelperText>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <FormLabel>Animais (seleção múltipla)</FormLabel>
                        <CheckboxGroup
                          value={selectedAnimals}
                          onChange={handleAnimalSelection}
                        >
                          <SimpleGrid columns={[2, 3, 4]} spacing={2}>
                            {animalOptions.map((animal) => (
                              <Checkbox key={animal} value={animal}>
                                {animal}
                              </Checkbox>
                            ))}
                          </SimpleGrid>
                        </CheckboxGroup>
                        <FormHelperText>
                          Selecione entre {formData.jog_quantidade_minima} e {formData.jog_quantidade_maxima} animais.
                        </FormHelperText>
                      </FormControl>
                    )}
                  </>
                )}
                {autoGenerate && (
                  <>
                    {formData.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (
                      <Box>
                        <FormLabel>Seleções Geradas:</FormLabel>
                        <Input
                          value={formData.jog_numeros}
                          isReadOnly
                          bg="gray.100"
                        />
                      </Box>
                    ) : (
                      <Box>
                        <FormLabel>Animais Gerados:</FormLabel>
                        <Input
                          value={formData.jog_numeros}
                          isReadOnly
                          bg="gray.100"
                        />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
            <FormControl isRequired>
              <FormLabel>Data de Início</FormLabel>
              <Input
                name="jog_data_inicio"
                type="date"
                value={formData.jog_data_inicio}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Data de Fim</FormLabel>
              <Input
                name="jog_data_fim"
                type="date"
                value={formData.jog_data_fim}
                onChange={handleInputChange}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameEditModal;


// Caminho: 
// src/app/components/dashboard/Admin/GameManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  IconButton,
  Tooltip,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { EditIcon, ViewIcon, DeleteIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameFormModal from './GameFormModal';
import GameEditModal from './GameEditModal';
import GameDetailsModal from './GameDetailsModal';
import { useToast } from '@chakra-ui/react';

const GameManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [nomeFilter, setNomeFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGame, setSelectedGame] = useState(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();
  const toast = useToast();

  const fetchJogos = useCallback(async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (nomeFilter) params.nome = nomeFilter;

    try {
      const response = await axios.get('/api/jogos/list', { params });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: 'Erro ao buscar jogos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [statusFilter, nomeFilter, toast]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  const handleEdit = (jogo) => {
    setSelectedGame(jogo);
    onEditOpen();
  };

  const handleViewDetails = (jogo) => {
    setSelectedGame(jogo);
    onDetailsOpen();
  };

  const handleToggleVisibility = async (jogo) => {
    try {
      const updatedVisibility = !jogo.visibleInConcursos;
      await axios.put(`/api/jogos/${jogo.slug}`, { visibleInConcursos: updatedVisibility }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast({
        title: `Visibilidade atualizada para ${updatedVisibility ? 'Visível' : 'Oculto'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: 'Erro ao atualizar visibilidade.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (jogo) => {
    const confirmDelete = confirm(`Tem certeza que deseja deletar o bolão "${jogo.jog_nome}"? Esta ação é irreversível.`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/jogos/${jogo.slug}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast({
        title: 'Jogo deletado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      console.error('Erro ao deletar jogo:', error);
      toast({
        title: 'Erro ao deletar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Jogos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Jogo
      </Button>
      <GameFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchJogos} />
      {selectedGame && (
        <>
          <GameEditModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            refreshList={fetchJogos}
            jogo={selectedGame}
          />
          <GameDetailsModal
            isOpen={isDetailsOpen}
            onClose={onDetailsClose}
            jogo={selectedGame}
          />
        </>
      )}
      <Box mb={4} display="flex" gap={4}>
        <Select
          placeholder="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          width="200px"
        >
          <option value="open">Em Andamento</option>
          <option value="upcoming">Próximos</option>
          <option value="closed">Finalizados</option>
        </Select>
        <Input
          placeholder="Filtrar por Nome"
          value={nomeFilter}
          onChange={(e) => setNomeFilter(e.target.value)}
          width="200px"
        />
        <Button onClick={fetchJogos} colorScheme="blue">
          Filtrar
        </Button>
      </Box>
      <Table variant="striped" colorScheme="green">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Status</Th>
            <Th>Valor do Ticket (R$)</Th>
            <Th>Prêmio (R$)</Th>
            <Th>Pontos Necessários</Th>
            <Th>Visível na Concursos</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {jogos.map((jogo) => (
            <Tr key={jogo.jog_id}>
              <Td>{jogo.jog_nome}</Td>
              <Td>
                <Badge
                  colorScheme={jogo.jog_status === 'open' ? 'green' : jogo.jog_status === 'closed' ? 'red' : 'yellow'}
                >
                  {jogo.jog_status === 'open' ? 'Em andamento' : 
                   jogo.jog_status === 'closed' ? 'Encerrado' : 'Em breve'}
                </Badge>
              </Td>
              <Td>{jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Td>
              <Td>{jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Td>
              <Td>{jogo.jog_pontos_necessarios || 'N/A'}</Td>
              <Td>
                <Badge
                  colorScheme={jogo.visibleInConcursos ? 'green' : 'red'}
                >
                  {jogo.visibleInConcursos ? 'Sim' : 'Não'}
                </Badge>
              </Td>
              <Td>
                <Tooltip label="Editar Jogo">
                  <IconButton
                    aria-label="Editar"
                    icon={<EditIcon />}
                    mr={2}
                    onClick={() => handleEdit(jogo)}
                  />
                </Tooltip>
                <Tooltip label="Ver Detalhes">
                  <IconButton
                    aria-label="Detalhes"
                    icon={<ViewIcon />}
                    mr={2}
                    onClick={() => handleViewDetails(jogo)}
                  />
                </Tooltip>
                <Tooltip label={jogo.visibleInConcursos ? "Ocultar na Concursos" : "Mostrar na Concursos"}>
                  <IconButton
                    aria-label="Toggle Visibilidade"
                    icon={jogo.visibleInConcursos ? <ViewOffIcon /> : <ViewIcon />}
                    mr={2}
                    onClick={() => handleToggleVisibility(jogo)}
                  />
                </Tooltip>
                <Tooltip label="Deletar Jogo">
                  <IconButton
                    aria-label="Deletar"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    onClick={() => handleDelete(jogo)}
                  />
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default GameManagement;


// Caminho: 
// src/app/components/dashboard/Admin/JogosConfig.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
} from '@chakra-ui/react';
import axios from '../../../utils/axios'; // Ajuste o caminho conforme necessário

const JogosConfig = () => {
  const [valorDeposito, setValorDeposito] = useState('');
  const [valores, setValores] = useState([]);
  const [hasData, setHasData] = useState(false);

  // Função para buscar os valores de depósito
  const fetchValores = useCallback(async () => {
    try {
      const response = await axios.get('/api/config/jogos/valores');
      if (response.data.valores && response.data.valores.length > 0) {
        setValores(response.data.valores);
        setHasData(true);
      } else {
        setValores([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar valores:', error);
      setValores([]);
      setHasData(false);
    }
  }, []);

  useEffect(() => {
    fetchValores();
  }, [fetchValores]);

  // Função para adicionar um novo valor de depósito
  const handleAddValor = async () => {
    if (!valorDeposito) {
      alert('Por favor, insira um valor válido.');
      return;
    }
    try {
      await axios.post('/api/config/jogos/valores', { valor: parseFloat(valorDeposito) });
      alert('Valor adicionado com sucesso!');
      setValorDeposito('');
      fetchValores();
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      alert('Erro ao adicionar valor. Por favor, tente novamente.');
    }
  };

  return (
    <Box>
      <FormControl mb={3}>
        <FormLabel>Valor de Depósito do Jogo (R$)</FormLabel>
        <Input
          type="number"
          value={valorDeposito}
          onChange={(e) => setValorDeposito(e.target.value)}
          placeholder="Insira o valor"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddValor} mb={4}>
        Adicionar
      </Button>
      {hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Valor (R$)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {valores.map((item) => (
              <Tr key={item.id}>
                <Td>R$ {item.valor.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default JogosConfig;


// Caminho: 
// src/app/components/dashboard/Admin/PorcentagensConfig.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
} from '@chakra-ui/react';
import axios from '../../../utils/axios'; // Ajuste o caminho conforme necessário

const PorcentagensConfig = () => {
  const [porcentagens, setPorcentagens] = useState([]);
  const [formData, setFormData] = useState({
    perfil: '',
    colaboradorId: '',
    porcentagem: '',
    descricao: '',
  });
  const [hasData, setHasData] = useState(false);

  // Função para buscar as porcentagens
  const fetchPorcentagens = useCallback(async () => {
    try {
      const response = await axios.get('/api/config/porcentagens');
      if (response.data.porcentagens && response.data.porcentagens.length > 0) {
        setPorcentagens(response.data.porcentagens);
        setHasData(true);
      } else {
        setPorcentagens([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar porcentagens:', error);
      setPorcentagens([]);
      setHasData(false);
    }
  }, []);

  useEffect(() => {
    fetchPorcentagens();
  }, [fetchPorcentagens]);

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para adicionar uma nova porcentagem
  const handleAddPorcentagem = async () => {
    const { perfil, colaboradorId, porcentagem } = formData;
    if (!perfil || (perfil === 'colaborador' && !colaboradorId) || !porcentagem) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    try {
      await axios.post('/api/config/porcentagens', {
        perfil: formData.perfil,
        colaboradorId: formData.perfil === 'colaborador' ? formData.colaboradorId : null,
        porcentagem: parseFloat(formData.porcentagem),
        descricao: formData.descricao,
      });
      alert('Porcentagem adicionada com sucesso!');
      setFormData({
        perfil: '',
        colaboradorId: '',
        porcentagem: '',
        descricao: '',
      });
      fetchPorcentagens();
    } catch (error) {
      console.error('Erro ao adicionar porcentagem:', error);
      alert('Erro ao adicionar porcentagem. Por favor, tente novamente.');
    }
  };

  return (
    <Box>
      <FormControl isRequired mb={3}>
        <FormLabel>Perfil</FormLabel>
        <Select name="perfil" value={formData.perfil} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="jogos">Jogos</option>
          <option value="colaborador">Colaborador</option>
        </Select>
      </FormControl>
      {formData.perfil === 'colaborador' && (
        <FormControl isRequired mb={3}>
          <FormLabel>Colaborador</FormLabel>
          <Input
            name="colaboradorId"
            value={formData.colaboradorId}
            onChange={handleInputChange}
            placeholder="ID do colaborador"
          />
        </FormControl>
      )}
      <FormControl isRequired mb={3}>
        <FormLabel>Porcentagem (%)</FormLabel>
        <Input
          type="number"
          name="porcentagem"
          value={formData.porcentagem}
          onChange={handleInputChange}
          placeholder="Insira a porcentagem"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Descrição</FormLabel>
        <Input
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
          placeholder="Descrição opcional"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddPorcentagem} mb={4}>
        Adicionar
      </Button>
      {hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Perfil</Th>
              <Th>Colaborador</Th>
              <Th>Porcentagem (%)</Th>
              <Th>Descrição</Th>
            </Tr>
          </Thead>
          <Tbody>
            {porcentagens.map((item) => (
              <Tr key={item.id}>
                <Td>{item.perfil.charAt(0).toUpperCase() + item.perfil.slice(1)}</Td>
                <Td>{item.colaboradorId || 'N/A'}</Td>
                <Td>{item.porcentagem}%</Td>
                <Td>{item.descricao || 'N/A'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default PorcentagensConfig;


// Caminho: 
// src/app/components/dashboard/Admin/RecebimentoConfig.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
} from '@chakra-ui/react';
import axios from '../../../utils/axios'; // Ajuste o caminho conforme necessário

const RecebimentoConfig = () => {
  const [recebimentos, setRecebimentos] = useState([]);
  const [formData, setFormData] = useState({
    tipo: '',
    nome_titular: '',
    chave_pix: '',
    tipo_chave: '',
    status: 'ativo',
    agencia: '',
    conta: '',
    banco: '',
  });
  const [hasData, setHasData] = useState(false);

  // Função para buscar os recebimentos
  const fetchRecebimentos = useCallback(async () => {
    try {
      const response = await axios.get('/api/config/recebimentos');
      if (response.data.recebimentos && response.data.recebimentos.length > 0) {
        setRecebimentos(response.data.recebimentos);
        setHasData(true);
      } else {
        setRecebimentos([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar recebimentos:', error);
      setRecebimentos([]);
      setHasData(false);
    }
  }, []);

  useEffect(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para adicionar um novo recebimento
  const handleAddRecebimento = async () => {
    const { tipo, nome_titular, chave_pix, tipo_chave } = formData;
    if (!tipo || !nome_titular || !chave_pix || !tipo_chave) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    try {
      await axios.post('/api/config/recebimentos', formData);
      alert('Recebimento adicionado com sucesso!');
      setFormData({
        tipo: '',
        nome_titular: '',
        chave_pix: '',
        tipo_chave: '',
        status: 'ativo',
        agencia: '',
        conta: '',
        banco: '',
      });
      fetchRecebimentos();
    } catch (error) {
      console.error('Erro ao adicionar recebimento:', error);
      alert('Erro ao adicionar recebimento. Por favor, tente novamente.');
    }
  };

  return (
    <Box>
      <FormControl isRequired mb={3}>
        <FormLabel>Tipo</FormLabel>
        <Select name="tipo" value={formData.tipo} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="pix">PIX</option>
          <option value="banco">Banco</option>
        </Select>
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Nome do Titular</FormLabel>
        <Input
          name="nome_titular"
          value={formData.nome_titular}
          onChange={handleInputChange}
          placeholder="Nome completo"
        />
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Chave PIX</FormLabel>
        <Input
          name="chave_pix"
          value={formData.chave_pix}
          onChange={handleInputChange}
          placeholder="Chave PIX"
        />
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Tipo da Chave</FormLabel>
        <Select name="tipo_chave" value={formData.tipo_chave} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="cpf">CPF</option>
          <option value="telefone">Telefone</option>
          <option value="email">Email</option>
        </Select>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Status</FormLabel>
        <Select name="status" value={formData.status} onChange={handleInputChange}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Agência</FormLabel>
        <Input
          name="agencia"
          value={formData.agencia}
          onChange={handleInputChange}
          placeholder="Agência"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Conta</FormLabel>
        <Input
          name="conta"
          value={formData.conta}
          onChange={handleInputChange}
          placeholder="Conta"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Banco</FormLabel>
        <Input
          name="banco"
          value={formData.banco}
          onChange={handleInputChange}
          placeholder="Banco"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddRecebimento} mb={4}>
        Adicionar
      </Button>
      {hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Tipo</Th>
              <Th>Nome do Titular</Th>
              <Th>Status</Th>
              <Th>Agência</Th>
              <Th>Conta</Th>
              <Th>Banco</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recebimentos.map((item) => (
              <Tr key={item.id}>
                <Td>{item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</Td>
                <Td>{item.nome_titular}</Td>
                <Td>
                  <Badge colorScheme={item.status === 'ativo' ? 'green' : 'red'}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </Td>
                <Td>{item.agencia || 'N/A'}</Td>
                <Td>{item.conta || 'N/A'}</Td>
                <Td>{item.banco || 'N/A'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default RecebimentoConfig;


