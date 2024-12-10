// src/app/components/dashboard/Colaborador/GameFormModalColaborador.jsx

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
  Switch,
  FormHelperText,
  useToast,
  Stack,
  HStack,
  Box,
  Checkbox,
  CheckboxGroup,
  SimpleGrid as Grid,
} from '@chakra-ui/react';
import axios from 'axios';
import slugify from 'slugify';

const GameFormModalColaborador = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    jog_status: 'open',
    jog_tipodojogo: '',
    jog_valorjogo: '',
    jog_valorpremio: '',
    jog_quantidade_minima: '',
    jog_quantidade_maxima: '',
    jog_numeros: '',
    jog_nome: '',
    jog_data_inicio: '',
    jog_data_fim: '',
    jog_pontos_necessarios: '',
    slug: '',
    visibleInConcursos: true,
  });

  const [generateNumbers, setGenerateNumbers] = useState(false);
  const [requirePoints, setRequirePoints] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState([]);

  const toast = useToast();

  const animalOptions = [
    'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
    'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
    'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
    'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
    'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'generateNumbers') {
        setGenerateNumbers(checked);
        if (!checked) {
          setFormData({ ...formData, jog_numeros: '' });
          setSelectedAnimals([]);
        }
      }
      if (name === 'requirePoints') {
        setRequirePoints(checked);
        if (!checked) {
          setFormData({ ...formData, jog_pontos_necessarios: '' });
        }
      }
      if (name === 'autoGenerate') {
        setAutoGenerate(checked);
        if (checked) {
          // Auto-gerar números ou animais com base no tipo de jogo
          if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
            const min = parseInt(formData.jog_quantidade_minima, 10) || 6;
            const max = parseInt(formData.jog_quantidade_maxima, 10) || 15;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            const generatedNumbers = generateUniqueNumbers(count, 1, 60);
            setFormData({ ...formData, jog_numeros: generatedNumbers.join(',') });
          } else {
            const min = parseInt(formData.jog_quantidade_minima, 10) || 1;
            const max = parseInt(formData.jog_quantidade_maxima, 10) || 25;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            const generatedAnimals = generateUniqueAnimals(count);
            setSelectedAnimals(generatedAnimals);
            setFormData({ ...formData, jog_numeros: generatedAnimals.join(',') });
          }
        } else {
          setFormData({ ...formData, jog_numeros: '' });
          setSelectedAnimals([]);
        }
      }
    } else if (name === 'jog_tipodojogo') {
      setFormData({ ...formData, [name]: value, jog_numeros: '' });
      setSelectedAnimals([]);
      setGenerateNumbers(false);
      setAutoGenerate(false);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAnimalSelection = (selected) => {
    setSelectedAnimals(selected);
    setFormData({ ...formData, jog_numeros: selected.join(',') });
  };

  const generateUniqueNumbers = (count, min, max) => {
    const numbers = new Set();
    while (numbers.size < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(num);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  const generateUniqueAnimals = (count) => {
    const shuffled = animalOptions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      // Validações
      if (!formData.jog_tipodojogo || !formData.jog_nome || !formData.jog_data_inicio || !formData.jog_data_fim) {
        toast({
          title: 'Faltam dados obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
        const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
        const min = parseInt(formData.jog_quantidade_minima, 10) || 6;
        const max = parseInt(formData.jog_quantidade_maxima, 10) || 15;

        if (numerosArray.length < min || numerosArray.length > max) {
          toast({
            title: `A quantidade de números deve estar entre ${min} e ${max}.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
        if (!numerosValidos) {
          toast({
            title: 'Os números devem conter apenas dígitos.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      } else {
        // Validações para JOGO_DO_BICHO
        const animaisArray = formData.jog_numeros.split(',').map(a => a.trim());
        const min = parseInt(formData.jog_quantidade_minima, 10) || 1;
        const max = parseInt(formData.jog_quantidade_maxima, 10) || 25;

        if (animaisArray.length < min || animaisArray.length > max) {
          toast({
            title: `A quantidade de animais deve estar entre ${min} e ${max}.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const validAnimals = animalOptions;
        const animaisValidos = animaisArray.every(animal => validAnimals.includes(animal));
        if (!animaisValidos) {
          toast({
            title: 'Os animais devem ser válidos e separados por vírgula.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      // Auto-gerar slug se não for fornecido
      let slug = formData.slug;
      if (!slug) {
        slug = slugify(formData.jog_nome, { lower: true, strict: true });
        setFormData({ ...formData, slug });
      }

      await axios.post('/api/colaborador/jogos', {
        ...formData,
        slug: slug || undefined,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Jogo cadastrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
      // Resetar formulário
      setFormData({
        jog_status: 'open',
        jog_tipodojogo: '',
        jog_valorjogo: '',
        jog_valorpremio: '',
        jog_quantidade_minima: '',
        jog_quantidade_maxima: '',
        jog_numeros: '',
        jog_nome: '',
        jog_data_inicio: '',
        jog_data_fim: '',
        jog_pontos_necessarios: '',
        slug: '',
        visibleInConcursos: true,
      });
      setGenerateNumbers(false);
      setRequirePoints(false);
      setAutoGenerate(false);
      setSelectedAnimals([]);
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar jogo.',
        description: error.response?.data?.error || error.message || 'Erro desconhecido.',
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
        <ModalHeader>Cadastrar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="jog_nome"
                value={formData.jog_nome}
                onChange={handleInputChange}
                placeholder="Ex: Mega Sena"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Slug</FormLabel>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Ex: mega-sena"
              />
              <FormHelperText>
                URL amigável. Deixe em branco para auto-gerar.
              </FormHelperText>
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibleInConcursos" mb="0">
                Visível em Concursos?
              </FormLabel>
              <Switch
                id="visibleInConcursos"
                name="visibleInConcursos"
                isChecked={formData.visibleInConcursos}
                onChange={(e) => setFormData({ ...formData, visibleInConcursos: e.target.checked })}
                colorScheme="green"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Status</FormLabel>
              <Select name="jog_status" value={formData.jog_status} onChange={handleInputChange}>
                <option value="open">Em Andamento</option>
                <option value="upcoming">Próximos</option>
                <option value="closed">Encerrados</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tipo de Jogo</FormLabel>
              <Select name="jog_tipodojogo" value={formData.jog_tipodojogo} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="MEGA">MEGA</option>
                <option value="LOTOFACIL">LOTOFACIL</option>
                <option value="JOGO_DO_BICHO">JOGO DO BICHO</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Valor do Ticket (R$)</FormLabel>
              <Input
                name="jog_valorjogo"
                type="number"
                value={formData.jog_valorjogo}
                onChange={handleInputChange}
                placeholder="Ex: 10.00"
                min="0"
              />
              <FormHelperText>
                Opcional.
              </FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Valor do Prêmio (R$)</FormLabel>
              <Input
                name="jog_valorpremio"
                type="number"
                value={formData.jog_valorpremio}
                onChange={handleInputChange}
                placeholder="Ex: 1000.00"
                min="0"
              />
              <FormHelperText>
                Opcional.
              </FormHelperText>
            </FormControl>
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Quantidade Mínima de Seleções</FormLabel>
                <Input
                  name="jog_quantidade_minima"
                  type="number"
                  value={formData.jog_quantidade_minima}
                  onChange={handleInputChange}
                  placeholder="Ex: 6"
                  min="1"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Quantidade Máxima de Seleções</FormLabel>
                <Input
                  name="jog_quantidade_maxima"
                  type="number"
                  value={formData.jog_quantidade_maxima}
                  onChange={handleInputChange}
                  placeholder="Ex: 15"
                  min="1"
                />
              </FormControl>
            </HStack>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="requirePoints" mb="0">
                Pontos Necessários?
              </FormLabel>
              <Switch
                id="requirePoints"
                name="requirePoints"
                isChecked={requirePoints}
                onChange={handleInputChange}
                colorScheme="green"
              />
            </FormControl>
            {requirePoints && (
              <FormControl>
                <FormLabel>Pontos Necessários</FormLabel>
                <Input
                  name="jog_pontos_necessarios"
                  type="number"
                  value={formData.jog_pontos_necessarios}
                  onChange={handleInputChange}
                  placeholder="Ex: 50"
                  min="0"
                />
              </FormControl>
            )}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="generateNumbers" mb="0">
                Gerar Seleções?
              </FormLabel>
              <Switch
                id="generateNumbers"
                name="generateNumbers"
                isChecked={generateNumbers}
                onChange={handleInputChange}
                colorScheme="blue"
              />
            </FormControl>
            {generateNumbers && (
              <>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="autoGenerate" mb="0">
                    Gerar Automaticamente?
                  </FormLabel>
                  <Switch
                    id="autoGenerate"
                    name="autoGenerate"
                    isChecked={autoGenerate}
                    onChange={handleInputChange}
                    colorScheme="purple"
                  />
                </FormControl>
                {!autoGenerate && (
                  <>
                    {formData.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (
                      <FormControl>
                        <FormLabel>Seleções (separadas por vírgula)</FormLabel>
                        <Input
                          name="jog_numeros"
                          value={formData.jog_numeros}
                          onChange={handleInputChange}
                          placeholder="Ex: 01,02,03,04,05,06"
                        />
                        <FormHelperText>
                          Insira entre {formData.jog_quantidade_minima} e {formData.jog_quantidade_maxima} números.
                        </FormHelperText>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <FormLabel>Animais (seleção múltipla)</FormLabel>
                        <CheckboxGroup
                          value={selectedAnimals}
                          onChange={handleAnimalSelection}
                        >
                          <Grid columns={[2, 3, 4]} spacing={2}>
                            {animalOptions.map((animal) => (
                              <Checkbox key={animal} value={animal}>
                                {animal}
                              </Checkbox>
                            ))}
                          </Grid>
                        </CheckboxGroup>
                        <FormHelperText>
                          Selecione entre {formData.jog_quantidade_minima} e {formData.jog_quantidade_maxima} animais.
                        </FormHelperText>
                      </FormControl>
                    )}
                  </>
                )}
                {autoGenerate && (
                  <>
                    {formData.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (
                      <Box>
                        <FormLabel>Seleções Geradas:</FormLabel>
                        <Input
                          value={formData.jog_numeros}
                          isReadOnly
                          bg="gray.100"
                        />
                      </Box>
                    ) : (
                      <Box>
                        <FormLabel>Animais Gerados:</FormLabel>
                        <Input
                          value={formData.jog_numeros}
                          isReadOnly
                          bg="gray.100"
                        />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
            <FormControl isRequired>
              <FormLabel>Data de Início</FormLabel>
              <Input
                name="jog_data_inicio"
                type="date"
                value={formData.jog_data_inicio}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Data de Fim</FormLabel>
              <Input
                name="jog_data_fim"
                type="date"
                value={formData.jog_data_fim}
                onChange={handleInputChange}
              />
            </FormControl>
          </Stack>
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

export default GameFormModalColaborador;
