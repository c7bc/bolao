// src/app/components/dashboard/Admin/GameFormModal.jsx

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
  Select,
  Stack,
  Switch,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import slugify from 'slugify';

const GameFormModal = ({ isOpen, onClose, refreshList }) => {
  const [gameTypes, setGameTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    visibleInConcursos: true,
    game_type_id: '',
    data_fim: '',
  });
  const toast = useToast();

  // Função para buscar tipos de jogos
  useEffect(() => {
    const fetchGameTypes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: 'Token não encontrado.',
            description: 'Por favor, faça login novamente.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const response = await axios.get('/api/game-types/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setGameTypes(response.data.gameTypes);
      } catch (error) {
        console.error('Erro ao buscar tipos de jogos:', error);
        toast({
          title: 'Erro ao buscar tipos de jogos.',
          description: error.response?.data?.error || 'Erro desconhecido.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (isOpen) {
      fetchGameTypes();
      // Resetar o formulário ao abrir o modal
      setFormData({
        name: '',
        slug: '',
        visibleInConcursos: true,
        game_type_id: '',
        data_fim: '',
      });
    }
  }, [isOpen, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    const { name, slug, visibleInConcursos, game_type_id, data_fim } = formData;

    // Validação básica
    if (!name || !slug || !game_type_id || !data_fim) {
      toast({
        title: 'Campos obrigatórios faltando.',
        description: 'Por favor, preencha todos os campos obrigatórios.',
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
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.post('/api/jogos/create', {
        name,
        slug,
        visibleInConcursos,
        game_type_id,
        data_fim,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Jogo criado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setFormData({
        name: '',
        slug: '',
        visibleInConcursos: true,
        game_type_id: '',
        data_fim: '',
      });

      refreshList();
      onClose();
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
      toast({
        title: 'Erro ao criar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {
      setFormData({
        name: '',
        slug: '',
        visibleInConcursos: true,
        game_type_id: '',
        data_fim: '',
      });
      onClose();
    }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cadastrar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {/* Nome do Jogo */}
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Mega-Sena"
              />
            </FormControl>
            {/* Slug */}
            <FormControl isRequired>
              <FormLabel>Slug</FormLabel>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="exemplo-slug"
              />
            </FormControl>
            {/* Visível em Concursos */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibleInConcursos" mb="0">
                Visível em Concursos?
              </FormLabel>
              <Switch
                id="visibleInConcursos"
                name="visibleInConcursos"
                isChecked={formData.visibleInConcursos}
                onChange={handleChange}
                colorScheme="green"
              />
            </FormControl>
            {/* Tipo do Jogo */}
            <FormControl isRequired>
              <FormLabel>Tipo do Jogo</FormLabel>
              <Select
                name="game_type_id"
                value={formData.game_type_id}
                onChange={handleChange}
                placeholder="Selecione o Tipo de Jogo"
              >
                {gameTypes.map((type) => (
                  <option key={type.game_type_id} value={type.slug}>
                    {type.jog_nome}
                  </option>
                ))}
              </Select>
            </FormControl>
            {/* Data de Fim */}
            <FormControl isRequired>
              <FormLabel>Data de Fim</FormLabel>
              <Input
                type="datetime-local"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
              />
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={() => {
            setFormData({
              name: '',
              slug: '',
              visibleInConcursos: true,
              game_type_id: '',
              data_fim: '',
            });
            onClose();
          }}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameFormModal;
