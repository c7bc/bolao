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
  FormHelperText,
  Input,
  Select,
  Stack,
  Switch,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import slugify from 'slugify';

const GameEditModal = ({ isOpen, onClose, refreshList, jogo }) => {
  const [gameTypes, setGameTypes] = useState([]);
  const [formData, setFormData] = useState({
    jog_nome: '',
    slug: '',
    visibleInConcursos: true,
    jog_tipodojogo: '',
    data_fim: '',
  });
  const toast = useToast();

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

        const response = await axios.get('/api/game-types/list', { // Atualizado para '/api/game-types/list'
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
      setFormData({
        jog_nome: jogo.jog_nome || '',
        slug: jogo.slug || '',
        visibleInConcursos: jogo.visibleInConcursos || false,
        jog_tipodojogo: jogo.game_type_id || '',
        data_fim: jogo.jog_data_fim ? jogo.jog_data_fim.substring(0, 16) : '',
      });
    }
  }, [isOpen, jogo, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const isSlugUnique = async (slug) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jogos/list?slug=${slug}`, { // Usando /api/jogos/list para verificar unicidade
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.jogos.length === 0) return true;
      // Verificar se o jogo encontrado é o mesmo que está sendo editado
      return response.data.jogos.every(j => j.jog_id === jogo.jog_id);
    } catch (error) {
      console.error('Erro ao verificar unicidade do slug:', error);
      return false;
    }
  };

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
      if (!formData.jog_nome || !formData.jog_tipodojogo || !formData.data_fim) {
        toast({
          title: 'Campos obrigatórios faltando.',
          description: 'Por favor, preencha todos os campos obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      let finalSlug = formData.slug;
      if (finalSlug) {
        finalSlug = slugify(finalSlug, { lower: true, strict: true });
        const slugIsUnique = await isSlugUnique(finalSlug);
        if (!slugIsUnique) {
          finalSlug = await generateUniqueSlug(formData.jog_nome);
          toast({
            title: 'Slug duplicado.',
            description: `O slug foi atualizado para ${finalSlug}.`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        finalSlug = await generateUniqueSlug(formData.jog_nome);
      }

      const payload = {
        jog_nome: formData.jog_nome,
        slug: finalSlug,
        visibleInConcursos: formData.visibleInConcursos,
        game_type_id: formData.jog_tipodojogo,
        data_fim: formData.data_fim,
      };

      const token = localStorage.getItem('token');
      await axios.put(`/api/game-types/${jogo.game_type_id}`, payload, { // Atualizado para '/api/game-types/[id]'
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Jogo atualizado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setFormData({
        jog_nome: '',
        slug: '',
        visibleInConcursos: true,
        jog_tipodojogo: '',
        data_fim: '',
      });

      refreshList();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar jogo:', error);
      toast({
        title: 'Erro ao atualizar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {
      setFormData({ ...jogo });
      onClose();
    }} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="jog_nome"
                value={formData.jog_nome}
                onChange={handleChange}
                placeholder="Ex: Mega-Sena"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Slug</FormLabel>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="exemplo-slug"
              />
              <FormHelperText>O slug deve ser único e sem espaços.</FormHelperText>
            </FormControl>
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
            <FormControl isRequired>
              <FormLabel>Tipo do Jogo</FormLabel>
              <Select
                name="jog_tipodojogo"
                value={formData.jog_tipodojogo}
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
                jog_nome: jogo.jog_nome || '',
                slug: jogo.slug || '',
                visibleInConcursos: jogo.visibleInConcursos || false,
                jog_tipodojogo: jogo.game_type_id || '',
                data_fim: jogo.jog_data_fim ? jogo.jog_data_fim.substring(0, 16) : '',
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

export default GameEditModal;
