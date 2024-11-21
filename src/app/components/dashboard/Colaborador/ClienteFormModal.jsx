// app/components/Colaborador/ClienteFormModal.jsx

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

const ClienteFormModal = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    cli_nome: '',
    cli_email: '',
    cli_telefone: '',
    cli_password: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/colaborador/clientes', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Cliente cadastrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar cliente.',
        description: error.response.data.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cadastrar Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mb={3}>
            <FormLabel>Nome</FormLabel>
            <Input name="cli_nome" value={formData.cli_nome} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired mb={3}>
            <FormLabel>Email</FormLabel>
            <Input name="cli_email" type="email" value={formData.cli_email} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired mb={3}>
            <FormLabel>Telefone</FormLabel>
            <Input name="cli_telefone" value={formData.cli_telefone} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired mb={3}>
            <FormLabel>Senha</FormLabel>
            <Input name="cli_password" type="password" value={formData.cli_password} onChange={handleInputChange} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClienteFormModal;
