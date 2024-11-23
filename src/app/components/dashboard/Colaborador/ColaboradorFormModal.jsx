// src/app/components/dashboard/Colaborador/ColaboradorFormModal.jsx

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

const ColaboradorFormModal = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    col_nome: '',
    col_documento: '',
    col_email: '',
    col_telefone: '',
    col_rua: '',
    col_numero: '',
    col_bairro: '',
    col_cidade: '',
    col_estado: '',
    col_cep: '',
    col_password: '',
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
      await axios.post('/api/colaborador/register', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Colaborador cadastrado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      refreshList();
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar colaborador.',
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
        <ModalHeader>Cadastrar Colaborador</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="col_nome" mb={4}>
            <FormLabel>Nome</FormLabel>
            <Input
              name="col_nome"
              value={formData.col_nome}
              onChange={handleChange}
              placeholder="Digite o nome do colaborador"
            />
          </FormControl>
          <FormControl id="col_documento" mb={4}>
            <FormLabel>Documento</FormLabel>
            <Input
              name="col_documento"
              value={formData.col_documento}
              onChange={handleChange}
              placeholder="Digite o documento"
            />
          </FormControl>
          <FormControl id="col_email" mb={4}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="col_email"
              value={formData.col_email}
              onChange={handleChange}
              placeholder="Digite o email"
            />
          </FormControl>
          <FormControl id="col_telefone" mb={4}>
            <FormLabel>Telefone</FormLabel>
            <Input
              name="col_telefone"
              value={formData.col_telefone}
              onChange={handleChange}
              placeholder="Digite o telefone"
            />
          </FormControl>
          <FormControl id="col_rua" mb={4}>
            <FormLabel>Rua</FormLabel>
            <Input
              name="col_rua"
              value={formData.col_rua}
              onChange={handleChange}
              placeholder="Digite a rua"
            />
          </FormControl>
          <FormControl id="col_numero" mb={4}>
            <FormLabel>Número</FormLabel>
            <Input
              name="col_numero"
              value={formData.col_numero}
              onChange={handleChange}
              placeholder="Digite o número"
            />
          </FormControl>
          <FormControl id="col_bairro" mb={4}>
            <FormLabel>Bairro</FormLabel>
            <Input
              name="col_bairro"
              value={formData.col_bairro}
              onChange={handleChange}
              placeholder="Digite o bairro"
            />
          </FormControl>
          <FormControl id="col_cidade" mb={4}>
            <FormLabel>Cidade</FormLabel>
            <Input
              name="col_cidade"
              value={formData.col_cidade}
              onChange={handleChange}
              placeholder="Digite a cidade"
            />
          </FormControl>
          <FormControl id="col_estado" mb={4}>
            <FormLabel>Estado</FormLabel>
            <Input
              name="col_estado"
              value={formData.col_estado}
              onChange={handleChange}
              placeholder="Digite o estado"
            />
          </FormControl>
          <FormControl id="col_cep" mb={4}>
            <FormLabel>CEP</FormLabel>
            <Input
              name="col_cep"
              value={formData.col_cep}
              onChange={handleChange}
              placeholder="Digite o CEP"
            />
          </FormControl>
          <FormControl id="col_password" mb={4}>
            <FormLabel>Senha</FormLabel>
            <Input
              type="password"
              name="col_password"
              value={formData.col_password}
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

export default ColaboradorFormModal;
