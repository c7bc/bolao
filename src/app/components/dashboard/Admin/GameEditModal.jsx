// Caminho: src/app/components/dashboard/Admin/GameEditModal.jsx

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
  NumberInput,
  NumberInputField,
  Textarea,
  HStack,
} from '@chakra-ui/react';
import axios from 'axios';
import slugify from 'slugify';

const GameEditModal = ({ isOpen, onClose, refreshList, jogo }) => {
  const [gameTypes, setGameTypes] = useState([]);
  const [formData, setFormData] = useState({
    jog_nome: '',
    slug: '',
    visibleInConcursos: true,
    ativo: true,
    descricao: '',
    jog_tipodojogo: '',
    data_inicio: '',
    data_fim: '',
    valorBilhete: '',
    numeroInicial: '',
    numeroFinal: '',
    quantidadeNumeros: '',
    pontosPorAcerto: '',
    numeroPalpites: '',
    status: 'aberto',
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
      setFormData({
        jog_nome: jogo.jog_nome || '',
        slug: jogo.slug || '',
        visibleInConcursos: jogo.visibleInConcursos || false,
        ativo: jogo.ativo || false,
        descricao: jogo.descricao || '',
        jog_tipodojogo: jogo.game_type_id || '',
        data_inicio: jogo.jog_data_inicio ? jogo.jog_data_inicio.substring(0, 16) : '',
        data_fim: jogo.jog_data_fim ? jogo.jog_data_fim.substring(0, 16) : '',
        valorBilhete: jogo.valorBilhete || '',
        numeroInicial: jogo.numeroInicial || '',
        numeroFinal: jogo.numeroFinal || '',
        quantidadeNumeros: jogo.quantidadeNumeros ? jogo.quantidadeNumeros.toString() : '',
        pontosPorAcerto: jogo.pontosPorAcerto ? jogo.pontosPorAcerto.toString() : '',
        numeroPalpites: jogo.numeroPalpites ? jogo.numeroPalpites.toString() : '',
        status: jogo.jog_status || 'aberto',
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
      const response = await axios.get(`/api/jogos/list?slug=${slug}`, {
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
      // Validações adicionais no frontend
      const requiredFields = [
        'jog_nome',
        'jog_tipodojogo',
        'data_inicio',
        'data_fim',
        'valorBilhete',
        'descricao',
        'numeroInicial',
        'numeroFinal',
        'quantidadeNumeros',
        'pontosPorAcerto',
        'numeroPalpites',
      ];

      for (const field of requiredFields) {
        if (!formData[field]) {
          toast({
            title: 'Campos obrigatórios faltando.',
            description: 'Por favor, preencha todos os campos obrigatórios.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      let finalSlug = formData.slug ? slugify(formData.slug, { lower: true, strict: true }) : slugify(formData.jog_nome, { lower: true, strict: true });
      if (!(await isSlugUnique(finalSlug))) {
        finalSlug = await generateUniqueSlug(formData.jog_nome);
        toast({
          title: 'Slug duplicado.',
          description: `O slug foi atualizado para ${finalSlug}.`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }

      const payload = {
        jog_nome: formData.jog_nome,
        slug: finalSlug,
        visibleInConcursos: formData.visibleInConcursos,
        ativo: formData.ativo,
        descricao: formData.descricao,
        jog_tipodojogo: formData.jog_tipodojogo,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        valorBilhete: parseFloat(formData.valorBilhete),
        numeroInicial: formData.numeroInicial,
        numeroFinal: formData.numeroFinal,
        quantidadeNumeros: parseInt(formData.quantidadeNumeros, 10),
        pontosPorAcerto: parseInt(formData.pontosPorAcerto, 10),
        numeroPalpites: parseInt(formData.numeroPalpites, 10),
        status: formData.status,
      };

      const token = localStorage.getItem('token');
      await axios.put(`/api/jogos/${jogo.slug}`, payload, {
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
        ativo: true,
        descricao: '',
        jog_tipodojogo: '',
        data_inicio: '',
        data_fim: '',
        valorBilhete: '',
        numeroInicial: '',
        numeroFinal: '',
        quantidadeNumeros: '',
        pontosPorAcerto: '',
        numeroPalpites: '',
        status: 'aberto',
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
      setFormData({
        jog_nome: '',
        slug: '',
        visibleInConcursos: true,
        ativo: true,
        descricao: '',
        jog_tipodojogo: '',
        data_inicio: '',
        data_fim: '',
        valorBilhete: '',
        numeroInicial: '',
        numeroFinal: '',
        quantidadeNumeros: '',
        pontosPorAcerto: '',
        numeroPalpites: '',
        status: 'aberto',
      });
      onClose();
    }} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {/* Nome do Jogo */}
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="jog_nome"
                value={formData.jog_nome}
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
              <FormHelperText>O slug deve ser único e sem espaços.</FormHelperText>
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
            {/* Ativo */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="ativo" mb="0">
                Ativo?
              </FormLabel>
              <Switch
                id="ativo"
                name="ativo"
                isChecked={formData.ativo}
                onChange={handleChange}
                colorScheme="blue"
              />
            </FormControl>
            {/* Descrição */}
            <FormControl isRequired>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição do jogo"
              />
            </FormControl>
            {/* Tipo do Jogo */}
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
            {/* Data de Início */}
            <FormControl isRequired>
              <FormLabel>Data de Início</FormLabel>
              <Input
                type="datetime-local"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
              />
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
            {/* Valor do Bilhete */}
            <FormControl isRequired>
              <FormLabel>Valor do Bilhete (R$)</FormLabel>
              <NumberInput precision={2} step={0.01}>
                <NumberInputField
                  name="valorBilhete"
                  value={formData.valorBilhete}
                  onChange={handleChange}
                  placeholder="Ex: 5.00"
                />
              </NumberInput>
            </FormControl>
            {/* Número Inicial e Final */}
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Número Inicial</FormLabel>
                <Input
                  name="numeroInicial"
                  value={formData.numeroInicial}
                  onChange={handleChange}
                  placeholder="Ex: 01"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Número Final</FormLabel>
                <Input
                  name="numeroFinal"
                  value={formData.numeroFinal}
                  onChange={handleChange}
                  placeholder="Ex: 60"
                />
              </FormControl>
            </HStack>
            {/* Quantidade de Números */}
            <FormControl isRequired>
              <FormLabel>Quantidade de Números</FormLabel>
              <NumberInput min={1}>
                <NumberInputField
                  name="quantidadeNumeros"
                  value={formData.quantidadeNumeros}
                  onChange={handleChange}
                  placeholder="Ex: 6"
                />
              </NumberInput>
            </FormControl>
            {/* Pontos por Acerto */}
            <FormControl isRequired>
              <FormLabel>Pontos por Acerto</FormLabel>
              <NumberInput min={1}>
                <NumberInputField
                  name="pontosPorAcerto"
                  value={formData.pontosPorAcerto}
                  onChange={handleChange}
                  placeholder="Ex: 10"
                />
              </NumberInput>
            </FormControl>
            {/* Número de Palpites */}
            <FormControl isRequired>
              <FormLabel>Número de Palpites</FormLabel>
              <NumberInput min={1}>
                <NumberInputField
                  name="numeroPalpites"
                  value={formData.numeroPalpites}
                  onChange={handleChange}
                  placeholder="Ex: 1000"
                />
              </NumberInput>
            </FormControl>
            {/* Status */}
            <FormControl isRequired>
              <FormLabel>Status</FormLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="aberto">Aberto</option>
                <option value="fechado">Fechado</option>
                <option value="encerrado">Encerrado</option>
              </Select>
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
                jog_nome: '',
                slug: '',
                visibleInConcursos: true,
                ativo: true,
                descricao: '',
                jog_tipodojogo: '',
                data_inicio: '',
                data_fim: '',
                valorBilhete: '',
                numeroInicial: '',
                numeroFinal: '',
                quantidadeNumeros: '',
                pontosPorAcerto: '',
                numeroPalpites: '',
                status: 'aberto',
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
