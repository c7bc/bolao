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

        console.log('Tipos de Jogos Recebidos:', response.data.gameTypes); // Log de Depuração
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

  // Função para verificar unicidade do slug
  const isSlugUnique = async (slug) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jogos/list?slug=${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.jogos.length === 0) return true;
      return false;
    } catch (error) {
      console.error('Erro ao verificar unicidade do slug:', error);
      return false;
    }
  };

  // Função para gerar um slug único baseado no nome
  const generateUniqueSlug = async (name) => {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (!(await isSlugUnique(uniqueSlug))) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    return uniqueSlug;
  };

  const handleSubmit = async () => {
    try {
      // Validações adicionais no frontend
      if (!formData.name || !formData.slug || !formData.game_type_id || !formData.data_fim) {
        toast({
          title: 'Campos obrigatórios faltando.',
          description: 'Por favor, preencha todos os campos obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Verificar se o slug é único
      let finalSlug = formData.slug;
      if (!(await isSlugUnique(finalSlug))) {
        finalSlug = await generateUniqueSlug(formData.name);
        toast({
          title: 'Slug duplicado.',
          description: `O slug foi atualizado para ${finalSlug}.`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }

      // Preparar payload
      const payload = {
        name: formData.name,
        slug: finalSlug,
        visibleInConcursos: formData.visibleInConcursos,
        game_type_id: formData.game_type_id,
        data_fim: formData.data_fim,
      };

      // Enviar dados para backend
      const token = localStorage.getItem('token');
      await axios.post('/api/jogos/create', payload, {
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

      // Resetar formulário
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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setFormData({
          name: '',
          slug: '',
          visibleInConcursos: true,
          game_type_id: '',
          data_fim: '',
        });
        onClose();
      }}
    >
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
                {gameTypes.length > 0 ? (
                  gameTypes.map((type) => (
                    <option key={type.game_type_id} value={type.game_type_id}>
                      {type.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Carregando tipos de jogos...</option>
                )}
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
          <Button
            variant="ghost"
            onClick={() => {
              setFormData({
                name: '',
                slug: '',
                visibleInConcursos: true,
                game_type_id: '',
                data_fim: '',
              });
              onClose();
            }}
          >
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameFormModal;

/**
 * Função para embaralhar um array usando o algoritmo de Fisher-Yates.
 * @param {Array} array - Array a ser embaralhado.
 * @returns {Array} - Array embaralhado.
 */
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
