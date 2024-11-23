// src/app/components/dashboard/Admin/AdminEditModal.jsx

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
  Select,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const AdminEditModal = ({ isOpen, onClose, admin, refreshList }) => {
  const [formData, setFormData] = useState({
    adm_id: admin.adm_id,
    adm_nome: admin.adm_nome,
    adm_email: admin.adm_email,
    adm_status: admin.adm_status,
    adm_role: admin.adm_role,
    adm_password: '',
  });

  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token'); // Ou onde você armazena o token

      const response = await axios.put('/api/admin/update', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Administrador atualizado.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      refreshList();
      onClose();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: 'Erro ao atualizar administrador.',
        description: error.response?.data?.error || 'Algo deu errado.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Administrador</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={3}>
            <FormLabel>Nome</FormLabel>
            <Input
              name="adm_nome"
              value={formData.adm_nome}
              onChange={handleChange}
              placeholder="Nome"
            />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Email</FormLabel>
            <Input
              name="adm_email"
              type="email"
              value={formData.adm_email}
              onChange={handleChange}
              placeholder="Email"
            />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Status</FormLabel>
            <Select
              name="adm_status"
              value={formData.adm_status}
              onChange={handleChange}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </Select>
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Função</FormLabel>
            <Select
              name="adm_role"
              value={formData.adm_role}
              onChange={handleChange}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </Select>
          </FormControl>
          <FormControl mb={3}>
            <FormLabel>Senha (deixe em branco para não alterar)</FormLabel>
            <Input
              name="adm_password"
              type="password"
              value={formData.adm_password}
              onChange={handleChange}
              placeholder="Senha"
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
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

export default AdminEditModal;
