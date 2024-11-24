// src/app/components/dashboard/Admin/ColaboradorEditModal.jsx (Ensure unique and necessary code)

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
  useToast,
  Stack,
} from '@chakra-ui/react';
import axios from 'axios';

const ColaboradorEditModal = ({ isOpen, onClose, refreshList, colaborador }) => {
  const [formData, setFormData] = useState({ ...colaborador });
  const toast = useToast();

  useEffect(() => {
    setFormData({ ...colaborador });
  }, [colaborador]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/colaborador/${colaborador.col_id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Colaborador atualizado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Colaborador</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome</FormLabel>
              <Input name="col_nome" value={formData.col_nome} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Documento</FormLabel>
              <Input name="col_documento" value={formData.col_documento} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="col_email" value={formData.col_email} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Telefone</FormLabel>
              <Input name="col_telefone" value={formData.col_telefone} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Rua</FormLabel>
              <Input name="col_rua" value={formData.col_rua} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Número</FormLabel>
              <Input name="col_numero" value={formData.col_numero} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Bairro</FormLabel>
              <Input name="col_bairro" value={formData.col_bairro} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Cidade</FormLabel>
              <Input name="col_cidade" value={formData.col_cidade} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Estado</FormLabel>
              <Input name="col_estado" value={formData.col_estado} onChange={handleInputChange} />
            </FormControl>
            <FormControl>
              <FormLabel>CEP</FormLabel>
              <Input name="col_cep" value={formData.col_cep} onChange={handleInputChange} />
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

export default ColaboradorEditModal;
