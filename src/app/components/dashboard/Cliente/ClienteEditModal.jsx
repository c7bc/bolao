// src/app/components/dashboard/Cliente/ClienteEditModal.jsx

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

const ClienteEditModal = ({ isOpen, onClose, cliente }) => {
  const [formData, setFormData] = useState({
    cli_status: cliente.cli_status || 'active',
    cli_nome: cliente.cli_nome || '',
    cli_email: cliente.cli_email || '',
    cli_telefone: cliente.cli_telefone || '',
    cli_idcolaborador: cliente.cli_idcolaborador || '',
  });
  
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/cliente/edit/${cliente.cli_id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Cliente atualizado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: 'Erro ao atualizar cliente.',
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
        <ModalHeader>Editar Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="cli_status" mb={4}>
            <FormLabel>Status</FormLabel>
            <Input
              name="cli_status"
              value={formData.cli_status}
              onChange={handleChange}
              placeholder="Ativo/Inativo"
            />
          </FormControl>
          <FormControl id="cli_nome" mb={4}>
            <FormLabel>Nome</FormLabel>
            <Input
              name="cli_nome"
              value={formData.cli_nome}
              onChange={handleChange}
              placeholder="Digite o nome do cliente"
            />
          </FormControl>
          <FormControl id="cli_email" mb={4}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="cli_email"
              value={formData.cli_email}
              onChange={handleChange}
              placeholder="Digite o email"
            />
          </FormControl>
          <FormControl id="cli_telefone" mb={4}>
            <FormLabel>Telefone</FormLabel>
            <Input
              name="cli_telefone"
              value={formData.cli_telefone}
              onChange={handleChange}
              placeholder="Digite o telefone"
            />
          </FormControl>
          <FormControl id="cli_idcolaborador" mb={4}>
            <FormLabel>ID do Colaborador</FormLabel>
            <Input
              name="cli_idcolaborador"
              value={formData.cli_idcolaborador}
              onChange={handleChange}
              placeholder="ID do Colaborador"
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClienteEditModal;
