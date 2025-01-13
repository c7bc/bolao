// src/app/components/dashboard/Cliente/ClienteCreateModal.jsx

'use client';

import React, { useState } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const ClienteCreateModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    cli_nome: '',
    cli_email: '',
    cli_telefone: '',
    cli_password: '',
    cli_idcolaborador: '',
  });

  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    // Validação básica
    const { cli_nome, cli_email, cli_telefone, cli_password } = formData;
    if (!cli_nome || !cli_email || !cli_telefone || !cli_password) {
      toast({
        title: 'Erro de validação.',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cliente/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Cliente criado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: 'Erro ao criar cliente.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cadastrar Novo Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="cli_nome" mb={4} isRequired>
            <FormLabel>Nome</FormLabel>
            <Input
              name="cli_nome"
              value={formData.cli_nome}
              onChange={handleChange}
              placeholder="Digite o nome do cliente"
            />
          </FormControl>
          <FormControl id="cli_email" mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="cli_email"
              value={formData.cli_email}
              onChange={handleChange}
              placeholder="Digite o email"
            />
          </FormControl>
          <FormControl id="cli_telefone" mb={4} isRequired>
            <FormLabel>Telefone</FormLabel>
            <Input
              name="cli_telefone"
              value={formData.cli_telefone}
              onChange={handleChange}
              placeholder="Digite o telefone"
            />
          </FormControl>
          <FormControl id="cli_password" mb={4} isRequired>
            <FormLabel>Senha</FormLabel>
            <Input
              type="password"
              name="cli_password"
              value={formData.cli_password}
              onChange={handleChange}
              placeholder="Digite a senha"
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleSubmit}>
            Cadastrar
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClienteCreateModal;
