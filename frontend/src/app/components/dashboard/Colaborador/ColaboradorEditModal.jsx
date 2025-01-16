// src/app/components/dashboard/Colaborador/ColaboradorEditModal.jsx

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
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const ColaboradorEditModal = ({ isOpen, onClose, colaborador, refreshList }) => {
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
    col_status: 'active',
  });
  
  const toast = useToast();

  useEffect(() => {
    if (colaborador) {
      setFormData({
        col_nome: colaborador.col_nome || '',
        col_documento: colaborador.col_documento || '',
        col_email: colaborador.col_email || '',
        col_telefone: colaborador.col_telefone || '',
        col_rua: colaborador.col_rua || '',
        col_numero: colaborador.col_numero || '',
        col_bairro: colaborador.col_bairro || '',
        col_cidade: colaborador.col_cidade || '',
        col_estado: colaborador.col_estado || '',
        col_cep: colaborador.col_cep || '',
        col_status: colaborador.col_status || 'active',
      });
    }
  }, [colaborador]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/colaborador/edit/${colaborador.col_id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Colaborador atualizado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      refreshList();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar colaborador.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!colaborador) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Colaborador</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="col_nome" mb={4}>
            <FormLabel>Nome</FormLabel>
            <Input name="col_nome" value={formData.col_nome} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_documento" mb={4}>
            <FormLabel>Documento</FormLabel>
            <Input name="col_documento" value={formData.col_documento} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_email" mb={4}>
            <FormLabel>Email</FormLabel>
            <Input type="email" name="col_email" value={formData.col_email} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_telefone" mb={4}>
            <FormLabel>Telefone</FormLabel>
            <Input name="col_telefone" value={formData.col_telefone} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_rua" mb={4}>
            <FormLabel>Rua</FormLabel>
            <Input name="col_rua" value={formData.col_rua} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_numero" mb={4}>
            <FormLabel>Número</FormLabel>
            <Input name="col_numero" value={formData.col_numero} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_bairro" mb={4}>
            <FormLabel>Bairro</FormLabel>
            <Input name="col_bairro" value={formData.col_bairro} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_cidade" mb={4}>
            <FormLabel>Cidade</FormLabel>
            <Input name="col_cidade" value={formData.col_cidade} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_estado" mb={4}>
            <FormLabel>Estado</FormLabel>
            <Input name="col_estado" value={formData.col_estado} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_cep" mb={4}>
            <FormLabel>CEP</FormLabel>
            <Input name="col_cep" value={formData.col_cep} onChange={handleChange} />
          </FormControl>
          <FormControl id="col_status" mb={4}>
            <FormLabel>Status</FormLabel>
            <Select name="col_status" value={formData.col_status} onChange={handleChange}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ColaboradorEditModal;
