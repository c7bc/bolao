// src/app/components/dashboard/Admin/GameEditModal.jsx
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
  Switch,
  FormHelperText,
  useToast,
  Stack,
  HStack,
  Box,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
} from '@chakra-ui/react';
import axios from 'axios';
import slugify from 'slugify';

// Lista de animais para JOGO_DO_BICHO
const animalOptions = [
  'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
  'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
  'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
  'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
  'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
];

const GameEditModal = ({ isOpen, onClose, refreshList, jogo }) => {
  const [formData, setFormData] = useState({ ...jogo });
  const [generateNumbers, setGenerateNumbers] = useState(jogo.jog_numeros ? true : false);
  const [requirePoints, setRequirePoints] = useState(jogo.jog_pontos_necessarios ? true : false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState(
    jogo.jog_tipodojogo === 'JOGO_DO_BICHO' && jogo.jog_numeros
      ? jogo.jog_numeros.split(',').map(a => a.trim())
      : []
  );
  const toast = useToast();

  useEffect(() => {
    setFormData({ ...jogo });
    setGenerateNumbers(jogo.jog_numeros ? true : false);
    setRequirePoints(jogo.jog_pontos_necessarios ? true : false);
    setAutoGenerate(false);
    setSelectedAnimals(
      jogo.jog_tipodojogo === 'JOGO_DO_BICHO' && jogo.jog_numeros
        ? jogo.jog_numeros.split(',').map(a => a.trim())
        : []
    );
  }, [jogo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'generateNumbers') {
        setGenerateNumbers(checked);
        if (!checked) {
          setFormData(prev => ({ ...prev, jog_numeros: '' }));
          setSelectedAnimals([]);
        }
      }
      if (name === 'requirePoints') {
        setRequirePoints(checked);
        if (!checked) {
          setFormData(prev => ({ ...prev, jog_pontos_necessarios: '' }));
        }
      }
      if (name === 'autoGenerate') {
        setAutoGenerate(checked);
        if (checked) {
          // Gerar automaticamente números ou animais com base no tipo de jogo
          if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
            const min = parseInt(formData.jog_quantidade_minima, 10) || 6;
            const max = parseInt(formData.jog_quantidade_maxima, 10) || 15;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            const generatedNumbers = generateUniqueNumbers(count, 1, 60); // Ajustar limites conforme necessário
            setFormData(prev => ({ ...prev, jog_numeros: generatedNumbers.join(',') }));
          } else {
            const min = parseInt(formData.jog_quantidade_minima, 10) || 1;
            const max = parseInt(formData.jog_quantidade_maxima, 10) || 25;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            const generatedAnimals = generateUniqueAnimals(count);
            setSelectedAnimals(generatedAnimals);
            setFormData(prev => ({ ...prev, jog_numeros: generatedAnimals.join(',') }));
          }
        } else {
          setFormData(prev => ({ ...prev, jog_numeros: '' }));
          setSelectedAnimals([]);
        }
      }
    } else if (name === 'jog_tipodojogo') {
      // Atualizar tipo de jogo e resetar campos relacionados
      setFormData(prev => ({
        ...prev,
        [name]: value,
        jog_numeros: '',
      }));
      setSelectedAnimals([]);
      setGenerateNumbers(false);
      setAutoGenerate(false);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAnimalSelection = (selected) => {
    setSelectedAnimals(selected);
    setFormData(prev => ({ ...prev, jog_numeros: selected.join(',') }));
  };

  // Função para gerar números únicos
  const generateUniqueNumbers = (count, min, max) => {
    const numbers = new Set();
    while (numbers.size < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(num);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  };

  // Função para gerar animais únicos
  const generateUniqueAnimals = (count) => {
    const shuffled = [...animalOptions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleSubmit = async () => {
    try {
      // Validações adicionais no front-end
      if (generateNumbers && !autoGenerate && !formData.jog_numeros) {
        toast({
          title: 'Números/Animais são obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (generateNumbers && formData.jog_numeros) {
        if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
          const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
          if (
            numerosArray.length < parseInt(formData.jog_quantidade_minima, 10) ||
            numerosArray.length > parseInt(formData.jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de números deve estar entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima}.`,
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
          // Para JOGO_DO_BICHO
          const animalsArray = formData.jog_numeros.split(',').map(a => a.trim());
          if (
            animalsArray.length < parseInt(formData.jog_quantidade_minima, 10) ||
            animalsArray.length > parseInt(formData.jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de animais deve estar entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima}.`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const validAnimals = animalOptions;
          const animaisValidos = animalsArray.every(animal => validAnimals.includes(animal));
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
      }

      if (requirePoints && !formData.jog_pontos_necessarios) {
        toast({
          title: 'Pontos necessários são obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Geração do slug
      let finalSlug = '';
      if (formData.slug && formData.slug.trim() !== '') {
        finalSlug = slugify(formData.slug, { lower: true, strict: true });
      } else {
        finalSlug = slugify(formData.jog_nome, { lower: true, strict: true });
      }
      setFormData(prev => ({ ...prev, slug: finalSlug }));

      // Preparar jog_numeros de acordo com o tipo de jogo
      let preparedJogNumeros = formData.jog_numeros;
      if (formData.jog_tipodojogo !== 'JOGO_DO_BICHO') {
        if (formData.jog_numeros) {
          const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
          preparedJogNumeros = numerosArray.join(',');
        }
      } else {
        if (selectedAnimals.length > 0) {
          preparedJogNumeros = selectedAnimals.join(',');
        }
      }

      // Validação do Valor do Prêmio
      if (formData.jog_valorpremio && (isNaN(formData.jog_valorpremio) || Number(formData.jog_valorpremio) < 0)) {
        toast({
          title: 'Valor do Prêmio inválido.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Preparar os dados para envio
      const payload = {
        ...formData,
        slug: finalSlug,
        jog_numeros: preparedJogNumeros,
      };

      const token = localStorage.getItem('token');
      // Supondo que o endpoint de edição seja PUT /api/jogos/update/{id}
      await axios.put(`/api/jogos/update/${jogo.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Jogo atualizado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Resetar formulário e estados
      setFormData({
        jog_nome: '',
        slug: '',
        visibleInConcursos: true,
        jog_status: 'open',
        jog_tipodojogo: '',
        jog_valorjogo: '',
        jog_valorpremio: '',
        jog_quantidade_minima: '',
        jog_quantidade_maxima: '',
        jog_numeros: '',
        jog_pontos_necessarios: '',
        jog_data_inicio: '',
        jog_data_fim: '',
      });
      setGenerateNumbers(false);
      setRequirePoints(false);
      setAutoGenerate(false);
      setSelectedAnimals([]);
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar o jogo.',
        description: error.response?.data?.message || error.message,
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
        <ModalHeader>Editar Jogo</ModalHeader>
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
                URL amigável. Será gerado automaticamente se deixado em branco.
              </FormHelperText>
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibleInConcursos" mb="0">
                Visível na Concursos?
              </FormLabel>
              <Switch
                id="visibleInConcursos"
                name="visibleInConcursos"
                isChecked={formData.visibleInConcursos}
                onChange={(e) => setFormData(prev => ({ ...prev, visibleInConcursos: e.target.checked }))}
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
                Opcional. Deixe em branco se não quiser definir um valor.
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
                Opcional. Deixe em branco se não quiser definir um valor.
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
            {/* Opção para definir pontos necessários */}
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
            {/* Opção para gerar números ou animais */}
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
                          <SimpleGrid columns={[2, 3, 4]} spacing={2}>
                            {animalOptions.map((animal) => (
                              <Checkbox key={animal} value={animal}>
                                {animal}
                              </Checkbox>
                            ))}
                          </SimpleGrid>
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

export default GameEditModal;
