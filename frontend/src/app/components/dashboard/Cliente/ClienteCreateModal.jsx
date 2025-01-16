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
  FormHelperText,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FaUser, FaEnvelope, FaPhoneAlt, FaLock } from 'react-icons/fa';
import axios from 'axios';

const ClienteCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    cli_nome: '',
    cli_email: '',
    cli_telefone: '',
    cli_password: '',
  });

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      cli_nome: '',
      cli_email: '',
      cli_telefone: '',
      cli_password: '',
    });
  };

  const handleSubmit = async () => {
    // Validação básica
    const { cli_nome, cli_email, cli_telefone, cli_password } = formData;
    if (!cli_nome || !cli_email || !cli_telefone || !cli_password) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/cliente/register', 
        {
          cli_nome: formData.cli_nome,
          cli_email: formData.cli_email,
          cli_telefone: formData.cli_telefone,
          cli_password: formData.cli_password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Cliente criado com sucesso',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        resetForm();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar cliente',
        description: error.response?.data?.error || 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="green.700">Cadastrar Novo Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="cli_nome" mb={4} isRequired>
            <FormLabel color="green.700">Nome Completo</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaUser color="green" />
              </InputLeftElement>
              <Input
                name="cli_nome"
                value={formData.cli_nome}
                onChange={handleChange}
                placeholder="Digite o nome completo"
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Digite o nome completo do cliente
            </FormHelperText>
          </FormControl>

          <FormControl id="cli_email" mb={4} isRequired>
            <FormLabel color="green.700">Email</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaEnvelope color="green" />
              </InputLeftElement>
              <Input
                type="email"
                name="cli_email"
                value={formData.cli_email}
                onChange={handleChange}
                placeholder="Digite o email"
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Digite um email válido
            </FormHelperText>
          </FormControl>

          <FormControl id="cli_telefone" mb={4} isRequired>
            <FormLabel color="green.700">Telefone</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaPhoneAlt color="green" />
              </InputLeftElement>
              <Input
                name="cli_telefone"
                value={formData.cli_telefone}
                onChange={handleChange}
                placeholder="(00) 0 0000-0000"
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Digite o número de telefone
            </FormHelperText>
          </FormControl>

          <FormControl id="cli_password" mb={4} isRequired>
            <FormLabel color="green.700">Senha</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaLock color="green" />
              </InputLeftElement>
              <Input
                type="password"
                name="cli_password"
                value={formData.cli_password}
                onChange={handleChange}
                placeholder="Digite a senha"
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Crie uma senha com pelo menos 6 caracteres
            </FormHelperText>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme="green" 
            mr={3} 
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!formData.cli_nome || !formData.cli_email || !formData.cli_telefone || !formData.cli_password}
          >
            Cadastrar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClienteCreateModal;