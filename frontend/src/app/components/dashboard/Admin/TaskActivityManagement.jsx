// src/app/components/dashboard/Admin/TaskActivityManagement.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';

const TaskActivityManagement = () => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');

  const [activityType, setActivityType] = useState('');
  const [activityDescription, setActivityDescription] = useState('');

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleCreateTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tasks', {
        type: 'task',
        data: {
          title: taskTitle,
          description: taskDescription,
          deadline: taskDeadline,
          assignedTo: taskAssignedTo,
          priority: taskPriority
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Tarefa criada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Limpar os campos após a criação
      setTaskTitle('');
      setTaskDescription('');
      setTaskDeadline('');
      setTaskAssignedTo('');
      setTaskPriority('medium');
    } catch (error) {
      toast({
        title: 'Erro ao criar tarefa.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tasks', {
        type: 'activity',
        data: {
          activityType: activityType,
          description: activityDescription
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Atividade criada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Limpar os campos após a criação
      setActivityType('');
      setActivityDescription('');
    } catch (error) {
      toast({
        title: 'Erro ao criar atividade.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg={bgColor} p={6} borderRadius="md" boxShadow="md">
      <Heading size="lg" mb={6}>Gerenciamento de Tarefas e Atividades</Heading>
      
      <VStack spacing={6} alignItems="stretch">
        {/* Formulário de Criação de Tarefa */}
        <Box>
          <Heading size="md" mb={4}>Criar Nova Tarefa</Heading>
          <FormControl id="taskTitle" mb={4}>
            <FormLabel>Título</FormLabel>
            <Input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          </FormControl>
          <FormControl id="taskDescription" mb={4}>
            <FormLabel>Descrição</FormLabel>
            <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
          </FormControl>
          <FormControl id="taskDeadline" mb={4}>
            <FormLabel>Prazo</FormLabel>
            <Input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} />
          </FormControl>
          <FormControl id="taskAssignedTo" mb={4}>
            <FormLabel>Atribuído a</FormLabel>
            <Input type="text" value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)} />
          </FormControl>
          <FormControl id="taskPriority" mb={4}>
            <FormLabel>Prioridade</FormLabel>
            <Select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </Select>
          </FormControl>
          <Button colorScheme="green" onClick={handleCreateTask}>Criar Tarefa</Button>
        </Box>

        {/* Formulário de Criação de Atividade */}
        <Box>
          <Heading size="md" mb={4}>Criar Nova Atividade</Heading>
          <FormControl id="activityType" mb={4}>
            <FormLabel>Tipo de Atividade</FormLabel>
            <Input type="text" value={activityType} onChange={(e) => setActivityType(e.target.value)} />
          </FormControl>
          <FormControl id="activityDescription" mb={4}>
            <FormLabel>Descrição</FormLabel>
            <Textarea value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
          </FormControl>
          <Button colorScheme="blue" onClick={handleCreateActivity}>Criar Atividade</Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default TaskActivityManagement;
