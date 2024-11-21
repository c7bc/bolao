// app/components/Admin/AdminFormModal.jsx

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

const AdminFormModal = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    adm_nome: '',
    adm_email: '',
    adm_password: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/admin/register', formData);
      toast({
        title: 'Administrador cadastrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar administrador.',
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
        <ModalHeader>Cadastrar Administrador</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mb={3}>
            <FormLabel>Nome</FormLabel>
            <Input name="adm_nome" value={formData.adm_nome} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired mb={3}>
            <FormLabel>Email</FormLabel>
            <Input name="adm_email" type="email" value={formData.adm_email} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired mb={3}>
            <FormLabel>Senha</FormLabel>
            <Input name="adm_password" type="password" value={formData.adm_password} onChange={handleInputChange} />
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

export default AdminFormModal;
