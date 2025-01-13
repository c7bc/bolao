// src/app/components/dashboard/Admin/GameTypeEditModal.jsx

'use client';

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
  Textarea,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const GameTypeEditModal = ({ isOpen, onClose, gameType, refreshList }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const toast = useToast();

  useEffect(() => {
    if (gameType) {
      setFormData({
        name: gameType.name || '',
        description: gameType.description || '',
      });
    }
  }, [gameType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, preencha todos os campos.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado',
          description: 'Por favor, faça login novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.put(
        `/api/game-types/${gameType.game_type_id}`,
        {
          name: formData.name,
          description: formData.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Sucesso',
        description: 'Tipo de jogo atualizado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      refreshList();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar tipo de jogo:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Não foi possível atualizar o tipo de jogo.',
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
        <ModalHeader>Editar Tipo de Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mb={4}>
            <FormLabel>Nome do Tipo de Jogo</FormLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Mega-Sena"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Descrição</FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição do tipo de jogo"
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

export default GameTypeEditModal;
