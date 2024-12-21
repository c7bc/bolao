// Arquivos combinados - Grupo 2
// Data de geração: 2024-12-20T20:59:27.520Z

// Caminho: src\app\components\dashboard\Admin\GameDetailsModal.jsx
// src/app/components/dashboard/Admin/GameDetailsModal.jsx
'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Stack,
} from '@chakra-ui/react';

const GameDetailsModal = ({ isOpen, onClose, jogo }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {jogo.jog_nome}</Text>
            <Text><strong>Status:</strong> {jogo.jog_status === 'open' ? 'Em andamento' : 
                                          jogo.jog_status === 'closed' ? 'Encerrado' : 'Próximos'}</Text>
            <Text><strong>Tipo:</strong> {jogo.jog_tipodojogo}</Text>
            <Text><strong>Valor do Ticket:</strong> {jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Text>
            <Text><strong>Valor do Prêmio:</strong> {jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Text>
            <Text><strong>Quantidade Mínima de Seleções:</strong> {jogo.jog_quantidade_minima}</Text>
            <Text><strong>Quantidade Máxima de Seleções:</strong> {jogo.jog_quantidade_maxima}</Text>
            <Text><strong>Seleções:</strong> {jogo.jog_tipodojogo !== 'JOGO_DO_BICHO' ? (jogo.jog_numeros || 'N/A') : (jogo.jog_numeros || 'N/A')}</Text>
            <Text><strong>Pontos Necessários:</strong> {jogo.jog_pontos_necessarios || 'N/A'}</Text>
            <Text><strong>Data de Início:</strong> {new Date(jogo.jog_data_inicio).toLocaleDateString()}</Text>
            <Text><strong>Data de Fim:</strong> {new Date(jogo.jog_data_fim).toLocaleDateString()}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(jogo.jog_datacriacao).toLocaleString()}</Text>
            <Text><strong>Slug:</strong> {jogo.slug}</Text>
            <Text><strong>Visível na Concursos:</strong> {jogo.visibleInConcursos ? 'Sim' : 'Não'}</Text>
            {/* Exibição das premiações */}
            <Text><strong>Premiações:</strong></Text>
            {jogo.premiacoes ? (
              <Stack spacing={1} pl={4}>
                <Text>10 Pontos: {(jogo.premiacoes["10"] * 100).toFixed(2)}%</Text>
                <Text>9 Pontos: {(jogo.premiacoes["9"] * 100).toFixed(2)}%</Text>
                <Text>Menos Pontos: {(jogo.premiacoes["menos"] * 100).toFixed(2)}%</Text>
              </Stack>
            ) : (
              <Text>N/A</Text>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameDetailsModal;


// Caminho: src\app\components\dashboard\Admin\GameEditModal.jsx
"use client";

import React, { useState, useEffect } from "react";
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import axios from "axios";
import slugify from "slugify";

// Lista de animais para JOGO_DO_BICHO
const animalOptions = [
  "Avestruz",
  "Águia",
  "Burro",
  "Borboleta",
  "Cachorro",
  "Cabra",
  "Carneiro",
  "Camelo",
  "Cobra",
  "Coelho",
  "Cavalo",
  "Elefante",
  "Galo",
  "Gato",
  "Jacaré",
  "Leão",
  "Macaco",
  "Porco",
  "Pavão",
  "Peru",
  "Touro",
  "Tigre",
  "Urso",
  "Veado",
  "Vaca",
];

const gameTypeOptions = {
  MEGA: { min: 6, max: 60 },
  LOTOFACIL: { min: 15, max: 25 },
  JOGO_DO_BICHO: { min: 6, max: 25 },
};

const GameEditModal = ({ isOpen, onClose, refreshList, jogo }) => {
  const [formData, setFormData] = useState({ ...jogo });
  const [generateNumbers, setGenerateNumbers] = useState(
    jogo.jog_numeros ? true : false
  );
  const [requirePoints, setRequirePoints] = useState(
    jogo.jog_pontos_necessarios ? true : false
  );
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState(
    jogo.jog_tipodojogo === "JOGO_DO_BICHO" && jogo.jog_numeros
      ? jogo.jog_numeros.split(",").map((a) => a.trim())
      : []
  );
  const toast = useToast();

  useEffect(() => {
    setFormData({ ...jogo });
    setGenerateNumbers(jogo.jog_numeros ? true : false);
    setRequirePoints(jogo.jog_pontos_necessarios ? true : false);
    setAutoGenerate(false);
    setSelectedAnimals(
      jogo.jog_tipodojogo === "JOGO_DO_BICHO" && jogo.jog_numeros
        ? jog.jog_numeros.split(",").map((a) => a.trim())
        : []
    );
  }, [jogo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "generateNumbers") {
        setGenerateNumbers(checked);
        if (!checked) {
          setFormData((prev) => ({ ...prev, jog_numeros: "" }));
          setSelectedAnimals([]);
        }
      }
      if (name === "requirePoints") {
        setRequirePoints(checked);
        if (!checked) {
          setFormData((prev) => ({ ...prev, jog_pontos_necessarios: "" }));
        }
      }
      if (name === "autoGenerate") {
        setAutoGenerate(checked);
        if (checked) {
          const tipo = formData.jog_tipodojogo;
          if (!tipo) {
            toast({
              title: "Selecione o tipo de jogo primeiro.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            setAutoGenerate(false);
            return;
          }
          const { min, max } = gameTypeOptions[tipo];
          const count = Math.floor(Math.random() * (max - min + 1)) + min;
          if (tipo !== "JOGO_DO_BICHO") {
            const generatedNumbers = generateUniqueNumbers(count, 1, max);
            setFormData((prev) => ({
              ...prev,
              jog_numeros: generatedNumbers.join(","),
            }));
          } else {
            const generatedAnimals = generateUniqueAnimals(count);
            setSelectedAnimals(generatedAnimals);
            setFormData((prev) => ({
              ...prev,
              jog_numeros: generatedAnimals.join(","),
            }));
          }
        } else {
          setFormData((prev) => ({ ...prev, jog_numeros: "" }));
          setSelectedAnimals([]);
        }
      }
    } else if (name === "jog_tipodojogo") {
      // Reset jog_numeros e seleção quando o tipo de jogo muda
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        jog_numeros: "",
      }));
      setSelectedAnimals([]);
      setGenerateNumbers(false);
      setAutoGenerate(false);
      // Atualizar quantidade mínima e máxima com base no tipo
      const { min, max } = gameTypeOptions[value] || { min: 1, max: 60 };
      setFormData((prev) => ({
        ...prev,
        jog_quantidade_minima: min,
        jog_quantidade_maxima: max,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePremiacaoChange = (key, value) => {
    setFormData({
      ...formData,
      premiacoes: {
        ...formData.premiacoes,
        [key]: parseFloat(value) / 100, // Converter para decimal
      },
    });
  };

  const handleAnimalSelection = (selected) => {
    setSelectedAnimals(selected);
    setFormData((prev) => ({ ...prev, jog_numeros: selected.join(",") }));
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
      // Validar somatório das premiações
      const { premiacoes } = formData;
      const totalPercentage = Object.values(premiacoes).reduce(
        (acc, val) => acc + val,
        0
      );
      if (totalPercentage !== 1) {
        toast({
          title: "A soma das premiações deve ser igual a 100%.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validações adicionais no frontend
      if (generateNumbers && !autoGenerate && !formData.jog_numeros) {
        toast({
          title: "Números/Animais são obrigatórios.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (generateNumbers && formData.jog_numeros) {
        const { jog_tipodojogo, jog_quantidade_minima, jog_quantidade_maxima } =
          formData;
        if (jog_tipodojogo !== "JOGO_DO_BICHO") {
          const numerosArray = formData.jog_numeros
            .split(",")
            .map((num) => num.trim());
          if (
            numerosArray.length < parseInt(jog_quantidade_minima, 10) ||
            numerosArray.length > parseInt(jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de números deve estar entre ${jog_quantidade_minima} e ${jog_quantidade_maxima}.`,
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const numerosValidos = numerosArray.every((num) => /^\d+$/.test(num));
          if (!numerosValidos) {
            toast({
              title: "Os números devem conter apenas dígitos.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        } else {
          // Para JOGO_DO_BICHO
          const animalsArray = formData.jog_numeros
            .split(",")
            .map((a) => a.trim());
          if (
            animalsArray.length <
              parseInt(formData.jog_quantidade_minima, 10) ||
            animalsArray.length > parseInt(formData.jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de animais deve estar entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima}.`,
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const validAnimals = animalOptions;
          const animaisValidos = animalsArray.every((animal) =>
            validAnimals.includes(animal)
          );
          if (!animaisValidos) {
            toast({
              title: "Os animais devem ser válidos e separados por vírgula.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        }
      }

      if (requirePoints && !formData.jog_pontos_necessarios) {
        toast({
          title: "Pontos necessários são obrigatórios.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Manipular slug
      let finalSlug = "";
      if (formData.slug && formData.slug.trim() !== "") {
        finalSlug = slugify(formData.slug, { lower: true, strict: true });
      } else {
        finalSlug = slugify(formData.jog_nome, { lower: true, strict: true });
      }
      setFormData((prev) => ({ ...prev, slug: finalSlug }));

      // Validação do Valor do Prêmio
      if (
        formData.jog_valorpremio &&
        (isNaN(formData.jog_valorpremio) ||
          Number(formData.jog_valorpremio) < 0)
      ) {
        toast({
          title: "Valor do Prêmio inválido.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Preparar os dados para envio
      const payload = {
        ...formData,
        slug: finalSlug,
      };

      const token = localStorage.getItem("token");
      await axios.put(`/api/jogos/update/${jogo.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Jogo atualizado com sucesso!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Resetar formulário e estados
      setFormData({
        jog_nome: "",
        slug: "",
        visibleInConcursos: true,
        jog_status: "open",
        jog_tipodojogo: "",
        jog_valorjogo: "",
        jog_valorpremio: "",
        jog_quantidade_minima: "",
        jog_quantidade_maxima: "",
        jog_numeros: "",
        jog_pontos_necessarios: "",
        jog_data_inicio: "",
        jog_data_fim: "",
      });
      setGenerateNumbers(false);
      setRequirePoints(false);
      setAutoGenerate(false);
      setSelectedAnimals([]);
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar o jogo.",
        description: error.response?.data?.message || error.message,
        status: "error",
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visibleInConcursos: e.target.checked,
                  }))
                }
                colorScheme="green"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Status</FormLabel>
              <Select
                name="jog_status"
                value={formData.jog_status}
                onChange={handleInputChange}
              >
                <option value="open">Em Andamento</option>
                <option value="upcoming">Próximos</option>
                <option value="closed">Encerrados</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tipo de Jogo</FormLabel>
              <Select
                name="jog_tipodojogo"
                value={formData.jog_tipodojogo}
                onChange={handleInputChange}
              >
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
                    {formData.jog_tipodojogo !== "JOGO_DO_BICHO" ? (
                      <FormControl>
                        <FormLabel>Seleções (separadas por vírgula)</FormLabel>
                        <Input
                          name="jog_numeros"
                          value={formData.jog_numeros}
                          onChange={handleInputChange}
                          placeholder="Ex: 01,02,03,04,05,06"
                        />
                        <FormHelperText>
                          Insira entre {formData.jog_quantidade_minima} e{" "}
                          {formData.jog_quantidade_maxima} números.
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
                          Selecione entre {formData.jog_quantidade_minima} e{" "}
                          {formData.jog_quantidade_maxima} animais.
                        </FormHelperText>
                      </FormControl>
                    )}
                  </>
                )}
                {autoGenerate && (
                  <>
                    {formData.jog_tipodojogo !== "JOGO_DO_BICHO" ? (
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
              <FormLabel>Premiações</FormLabel>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>10 Pontos (%)</FormLabel>
                  <NumberInput
                    min={0}
                    max={100}
                    value={formData.premiacoes["10"] * 100}
                    onChange={(valueString) =>
                      handlePremiacaoChange("10", valueString)
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>9 Pontos (%)</FormLabel>
                  <NumberInput
                    min={0}
                    max={100}
                    value={formData.premiacoes["9"] * 100}
                    onChange={(valueString) =>
                      handlePremiacaoChange("9", valueString)
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Menos Pontos (%)</FormLabel>
                  <NumberInput
                    min={0}
                    max={100}
                    value={formData.premiacoes["menos"] * 100}
                    onChange={(valueString) =>
                      handlePremiacaoChange("menos", valueString)
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Stack>
              <FormHelperText>
                A soma das premiações deve ser igual a 100%.
              </FormHelperText>
            </FormControl>
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


// Caminho: src\app\components\dashboard\Admin\GameFormModal.jsx
// src/app/components/dashboard/Admin/GameFormModal.jsx

'use client';

import React, { useState, useEffect } from "react";
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import axios from "axios";
import slugify from "slugify";

// Lista de animais para JOGO_DO_BICHO
const animalOptions = [
  "Avestruz",
  "Águia",
  "Burro",
  "Borboleta",
  "Cachorro",
  "Cabra",
  "Carneiro",
  "Camelo",
  "Cobra",
  "Coelho",
  "Cavalo",
  "Elefante",
  "Galo",
  "Gato",
  "Jacaré",
  "Leão",
  "Macaco",
  "Porco",
  "Pavão",
  "Peru",
  "Touro",
  "Tigre",
  "Urso",
  "Veado",
  "Vaca",
];

const gameTypeOptions = {
  MEGA: { min: 6, max: 60, valor: 30.0 },
  LOTOFACIL: { min: 15, max: 25, valor: 20.0 },
  JOGO_DO_BICHO: { min: 6, max: 25, valor: 15.0 },
};

const GameFormModal = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    jog_nome: "",
    slug: "",
    visibleInConcursos: true,
    jog_status: "open",
    jog_tipodojogo: "",
    jog_valorjogo: "",
    jog_quantidade_minima: "",
    jog_quantidade_maxima: "",
    jog_numeros: "",
    jog_pontos_necessarios: "",
    jog_data_inicio: "",
    jog_data_fim: "",
    premiacoes: {
      "10": 0.53, // 53%
      "9": 0.1, // 10%
      "menos": 0.07, // 7%
      "comissao_colaborador": 0.005, // 0.5%
      "administracao": 0.3, // 30%
    },
  });
  const [generateNumbers, setGenerateNumbers] = useState(false);
  const [requirePoints, setRequirePoints] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const toast = useToast();

  // Define os tipos de jogos e seus valores de bilhete
  useEffect(() => {
    setGameTypes(gameTypeOptions);
  }, []);

  // Atualiza os campos quando o tipo de jogo é selecionado
  const handleGameTypeChange = (e) => {
    const tipo = e.target.value;
    const config = gameTypeOptions[tipo];
    setFormData((prev) => ({
      ...prev,
      jog_tipodojogo: tipo,
      jog_valorjogo: config.valor,
      jog_quantidade_minima: config.min,
      jog_quantidade_maxima: config.max,
      jog_numeros: "",
    }));
    setSelectedAnimals([]);
    setGenerateNumbers(false);
    setAutoGenerate(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "generateNumbers") {
        setGenerateNumbers(checked);
        if (!checked) {
          setFormData((prev) => ({ ...prev, jog_numeros: "" }));
          setSelectedAnimals([]);
        }
      }
      if (name === "requirePoints") {
        setRequirePoints(checked);
        if (!checked) {
          setFormData((prev) => ({ ...prev, jog_pontos_necessarios: "" }));
        }
      }
      if (name === "autoGenerate") {
        setAutoGenerate(checked);
        if (checked) {
          const tipo = formData.jog_tipodojogo;
          if (!tipo) {
            toast({
              title: "Selecione o tipo de jogo primeiro.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            setAutoGenerate(false);
            return;
          }
          const { min, max } = gameTypeOptions[tipo];
          const count = min; // Definindo como mínimo
          if (tipo !== "JOGO_DO_BICHO") {
            const generatedNumbers = generateUniqueNumbers(count, 1, max);
            setFormData((prev) => ({
              ...prev,
              jog_numeros: generatedNumbers.join(","),
            }));
          } else {
            const generatedAnimals = generateUniqueAnimals(count);
            setSelectedAnimals(generatedAnimals);
            setFormData((prev) => ({
              ...prev,
              jog_numeros: generatedAnimals.join(","),
            }));
          }
        } else {
          setFormData((prev) => ({ ...prev, jog_numeros: "" }));
          setSelectedAnimals([]);
        }
      }
    } else if (name === "jog_tipodojogo") {
      // Reseta campos relacionados quando o tipo de jogo muda
      handleGameTypeChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePremiacaoChange = (key, value) => {
    setFormData({
      ...formData,
      premiacoes: {
        ...formData.premiacoes,
        [key]: parseFloat(value) / 100, // Converter para decimal
      },
    });
  };

  const handleAnimalSelection = (selected) => {
    setSelectedAnimals(selected);
    setFormData((prev) => ({ ...prev, jog_numeros: selected.join(",") }));
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

  // Função para verificar unicidade do slug
  const isSlugUnique = async (slug) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/jogos/list?slug=${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.jogos.length === 0;
    } catch (error) {
      console.error("Error checking slug uniqueness:", error);
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
      // Validar soma das premiações
      const { premiacoes } = formData;
      const totalPercentage = Object.values(premiacoes).reduce(
        (acc, val) => acc + val,
        0
      );
      if (totalPercentage !== 1) {
        toast({
          title: "A soma das premiações deve ser igual a 100%.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validações adicionais
      if (generateNumbers && !formData.jog_numeros) {
        toast({
          title: "Números/Animais são obrigatórios.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (generateNumbers && formData.jog_numeros) {
        const { jog_tipodojogo, jog_quantidade_minima, jog_quantidade_maxima } = formData;
        if (jog_tipodojogo !== "JOGO_DO_BICHO") {
          const numerosArray = formData.jog_numeros.split(",").map((num) => num.trim());
          if (
            numerosArray.length < parseInt(jog_quantidade_minima, 10) ||
            numerosArray.length > parseInt(jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de números deve estar entre ${jog_quantidade_minima} e ${jog_quantidade_maxima}.`,
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const numerosValidos = numerosArray.every((num) => /^\d+$/.test(num));
          if (!numerosValidos) {
            toast({
              title: "Os números devem conter apenas dígitos.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        } else {
          // Para JOGO_DO_BICHO
          const animalsArray = formData.jog_numeros.split(",").map((a) => a.trim());
          if (
            animalsArray.length < parseInt(formData.jog_quantidade_minima, 10) ||
            animalsArray.length > parseInt(formData.jog_quantidade_maxima, 10)
          ) {
            toast({
              title: `A quantidade de animais deve estar entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima}.`,
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          const validAnimals = animalOptions;
          const animaisValidos = animalsArray.every((animal) =>
            validAnimals.includes(animal)
          );
          if (!animaisValidos) {
            toast({
              title: "Os animais devem ser válidos e separados por vírgula.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        }
      }

      if (requirePoints && !formData.jog_pontos_necessarios) {
        toast({
          title: "Pontos necessários são obrigatórios.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Manipular slug
      let finalSlug = formData.slug;
      if (!finalSlug) {
        finalSlug = await generateUniqueSlug(formData.jog_nome);
      } else {
        finalSlug = slugify(finalSlug, { lower: true, strict: true });
        if (!(await isSlugUnique(finalSlug))) {
          toast({
            title: "Slug já está em uso. Por favor, escolha outro.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      // Preparar payload
      const payload = {
        ...formData,
        slug: finalSlug,
      };

      // Enviar dados para backend
      const token = localStorage.getItem("token");
      await axios.post("/api/jogos/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Jogo criado com sucesso!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Resetar formulário
      setFormData({
        jog_nome: "",
        slug: "",
        visibleInConcursos: true,
        jog_status: "open",
        jog_tipodojogo: "",
        jog_valorjogo: "",
        jog_quantidade_minima: "",
        jog_quantidade_maxima: "",
        jog_numeros: "",
        jog_pontos_necessarios: "",
        jog_data_inicio: "",
        jog_data_fim: "",
        premiacoes: {
          "10": 0.53,
          "9": 0.1,
          "menos": 0.07,
          "comissao_colaborador": 0.005,
          "administracao": 0.3,
        },
      });
      setGenerateNumbers(false);
      setRequirePoints(false);
      setAutoGenerate(false);
      setSelectedAnimals([]);
      refreshList();
      onClose();
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Erro ao criar o jogo.",
        description: error.response?.data?.message || "Ocorreu um erro inesperado.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Criar Novo Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {/* Nome do Jogo */}
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="jog_nome"
                value={formData.jog_nome}
                onChange={handleInputChange}
                placeholder="Digite o nome do jogo"
              />
            </FormControl>

            {/* Slug */}
            <FormControl>
              <FormLabel>Slug</FormLabel>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Digite o slug (opcional)"
              />
              <FormHelperText>O slug deve ser único e sem espaços.</FormHelperText>
            </FormControl>

            {/* Visível em Concursos */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibleInConcursos" mb="0">
                Visível em Concursos
              </FormLabel>
              <Switch
                id="visibleInConcursos"
                name="visibleInConcursos"
                isChecked={formData.visibleInConcursos}
                onChange={handleInputChange}
              />
            </FormControl>

            {/* Status do Jogo */}
            <FormControl isRequired>
              <FormLabel>Status do Jogo</FormLabel>
              <Select
                name="jog_status"
                value={formData.jog_status}
                onChange={handleInputChange}
              >
                <option value="open">Aberto</option>
                <option value="closed">Fechado</option>
                <option value="ended">Encerrado</option>
              </Select>
            </FormControl>

            {/* Tipo de Jogo */}
            <FormControl isRequired>
              <FormLabel>Tipo de Jogo</FormLabel>
              <Select
                name="jog_tipodojogo"
                value={formData.jog_tipodojogo}
                onChange={handleInputChange}
                placeholder="Selecione o tipo de jogo"
              >
                {Object.keys(gameTypes).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Valor do Jogo */}
            <FormControl isRequired>
              <FormLabel>Valor do Jogo</FormLabel>
              <NumberInput
                name="jog_valorjogo"
                value={formData.jog_valorjogo}
                onChange={(valueString, valueNumber) =>
                  setFormData((prev) => ({
                    ...prev,
                    jog_valorjogo: valueNumber,
                  }))
                }
                min={0}
              >
                <NumberInputField placeholder="Valor do jogo" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Quantidade Mínima */}
            <FormControl isRequired>
              <FormLabel>Quantidade Mínima</FormLabel>
              <NumberInput
                name="jog_quantidade_minima"
                value={formData.jog_quantidade_minima}
                onChange={(valueString, valueNumber) =>
                  setFormData((prev) => ({
                    ...prev,
                    jog_quantidade_minima: valueNumber,
                  }))
                }
                min={1}
              >
                <NumberInputField placeholder="Quantidade Mínima" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Quantidade Máxima */}
            <FormControl isRequired>
              <FormLabel>Quantidade Máxima</FormLabel>
              <NumberInput
                name="jog_quantidade_maxima"
                value={formData.jog_quantidade_maxima}
                onChange={(valueString, valueNumber) =>
                  setFormData((prev) => ({
                    ...prev,
                    jog_quantidade_maxima: valueNumber,
                  }))
                }
                min={1}
              >
                <NumberInputField placeholder="Quantidade Máxima" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Números/Animais */}
            <FormControl isRequired={generateNumbers}>
              <FormLabel>
                {formData.jog_tipodojogo === "JOGO_DO_BICHO"
                  ? "Animais"
                  : "Números"}
              </FormLabel>
              {formData.jog_tipodojogo !== "JOGO_DO_BICHO" ? (
                <Input
                  name="jog_numeros"
                  value={formData.jog_numeros}
                  onChange={handleInputChange}
                  placeholder="Digite os números separados por vírgula"
                />
              ) : (
                <CheckboxGroup
                  colorScheme="green"
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
              )}
            </FormControl>

            {/* Gerar Números/Animais */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="generateNumbers" mb="0">
                Gerar Números/Animais Automaticamente
              </FormLabel>
              <Switch
                id="generateNumbers"
                name="generateNumbers"
                isChecked={generateNumbers}
                onChange={handleInputChange}
              />
            </FormControl>

            {/* Gerar Automático */}
            {generateNumbers && (
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="autoGenerate" mb="0">
                  Gerar Automáticamente
                </FormLabel>
                <Switch
                  id="autoGenerate"
                  name="autoGenerate"
                  isChecked={autoGenerate}
                  onChange={handleInputChange}
                />
              </FormControl>
            )}

            {/* Pontos Necessários */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="requirePoints" mb="0">
                Exigir Pontos Necessários
              </FormLabel>
              <Switch
                id="requirePoints"
                name="requirePoints"
                isChecked={requirePoints}
                onChange={handleInputChange}
              />
            </FormControl>

            {requirePoints && (
              <FormControl isRequired>
                <FormLabel>Pontos Necessários</FormLabel>
                <NumberInput
                  name="jog_pontos_necessarios"
                  value={formData.jog_pontos_necessarios}
                  onChange={(valueString, valueNumber) =>
                    setFormData((prev) => ({
                      ...prev,
                      jog_pontos_necessarios: valueNumber,
                    }))
                  }
                  min={0}
                >
                  <NumberInputField placeholder="Pontos Necessários" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}

            {/* Data de Início */}
            <FormControl isRequired>
              <FormLabel>Data de Início</FormLabel>
              <Input
                type="datetime-local"
                name="jog_data_inicio"
                value={formData.jog_data_inicio}
                onChange={handleInputChange}
              />
            </FormControl>

            {/* Data de Fim */}
            <FormControl isRequired>
              <FormLabel>Data de Fim</FormLabel>
              <Input
                type="datetime-local"
                name="jog_data_fim"
                value={formData.jog_data_fim}
                onChange={handleInputChange}
              />
            </FormControl>

            {/* Premiações */}
            <Box>
              <FormLabel>Premiações (%)</FormLabel>
              <Stack spacing={4}>
                <HStack>
                  <FormControl isRequired>
                    <FormLabel>10 Acertos</FormLabel>
                    <NumberInput
                      value={formData.premiacoes["10"] * 100}
                      onChange={(valueString, valueNumber) =>
                        handlePremiacaoChange("10", valueNumber)
                      }
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>9 Acertos</FormLabel>
                    <NumberInput
                      value={formData.premiacoes["9"] * 100}
                      onChange={(valueString, valueNumber) =>
                        handlePremiacaoChange("9", valueNumber)
                      }
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>
                <HStack>
                  <FormControl isRequired>
                    <FormLabel>Menos Acertos</FormLabel>
                    <NumberInput
                      value={formData.premiacoes["menos"] * 100}
                      onChange={(valueString, valueNumber) =>
                        handlePremiacaoChange("menos", valueNumber)
                      }
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Comissão Colaborador</FormLabel>
                    <NumberInput
                      value={formData.premiacoes["comissao_colaborador"] * 100}
                      onChange={(valueString, valueNumber) =>
                        handlePremiacaoChange("comissao_colaborador", valueNumber)
                      }
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Administração</FormLabel>
                    <NumberInput
                      value={formData.premiacoes["administracao"] * 100}
                      onChange={(valueString, valueNumber) =>
                        handlePremiacaoChange("administracao", valueNumber)
                      }
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>
              </Stack>
            </Box>
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

export default GameFormModal;


// Caminho: src\app\components\dashboard\Admin\GameManagement.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  IconButton,
  Tooltip,
  Badge,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { EditIcon, ViewIcon, DeleteIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';
import GameFormModal from './GameFormModal';
import GameEditModal from './GameEditModal';
import GameDetailsModal from './GameDetailsModal';
import ResultadosManagement from './ResultadosManagement'; // Novo componente
import { useToast } from '@chakra-ui/react';

const GameManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [nomeFilter, setNomeFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGame, setSelectedGame] = useState(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const fetchJogos = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (nomeFilter) params.nome = nomeFilter;

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
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/jogos/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: 'Erro ao buscar jogos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, nomeFilter, toast]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  const handleEdit = (jogo) => {
    setSelectedGame(jogo);
    onEditOpen();
  };

  const handleViewDetails = (jogo) => {
    setSelectedGame(jogo);
    onDetailsOpen();
  };

  const handleToggleVisibility = async (jogo) => {
    try {
      const updatedVisibility = !jogo.visibleInConcursos;
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

      await axios.put(`/api/jogos/${jogo.slug}`, { visibleInConcursos: updatedVisibility }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: `Visibilidade atualizada para ${updatedVisibility ? 'Visível' : 'Oculto'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: 'Erro ao atualizar visibilidade.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (jogo) => {
    const confirmDelete = confirm(`Tem certeza que deseja deletar o bolão "${jogo.jog_nome}"? Esta ação é irreversível.`);
    if (!confirmDelete) return;

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

      await axios.delete(`/api/jogos/${jogo.slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Jogo deletado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      console.error('Erro ao deletar jogo:', error);
      toast({
        title: 'Erro ao deletar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Jogos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Jogo
      </Button>
      <GameFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchJogos} />
      {selectedGame && (
        <>
          <GameEditModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            refreshList={fetchJogos}
            jogo={selectedGame}
          />
          <GameDetailsModal
            isOpen={isDetailsOpen}
            onClose={onDetailsClose}
            jogo={selectedGame}
          />
        </>
      )}
      <Box mb={4} display="flex" gap={4}>
        <Select
          placeholder="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          width="200px"
        >
          <option value="open">Em Andamento</option>
          <option value="upcoming">Próximos</option>
          <option value="closed">Finalizados</option>
        </Select>
        <Input
          placeholder="Filtrar por Nome"
          value={nomeFilter}
          onChange={(e) => setNomeFilter(e.target.value)}
          width="200px"
        />
        <Button onClick={fetchJogos} colorScheme="blue">
          Filtrar
        </Button>
      </Box>
      {loading ? (
        <Flex justify="center" align="center" mt="10">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Table variant="striped" colorScheme="green">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Status</Th>
              <Th>Valor do Ticket (R$)</Th>
              <Th>Prêmio (R$)</Th>
              <Th>Pontos Necessários</Th>
              <Th>Visível na Concursos</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {jogos.map((jogo) => (
              <Tr key={jogo.jog_id}>
                <Td>{jogo.jog_nome}</Td>
                <Td>
                  <Badge
                    colorScheme={jogo.jog_status === 'open' ? 'green' : jogo.jog_status === 'closed' ? 'red' : 'yellow'}
                  >
                    {jogo.jog_status === 'open' ? 'Em andamento' : 
                     jogo.jog_status === 'closed' ? 'Encerrado' : 'Próximos'}
                  </Badge>
                </Td>
                <Td>{jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Td>
                <Td>{jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Td>
                <Td>{jogo.jog_pontos_necessarios || 'N/A'}</Td>
                <Td>
                  <Badge
                    colorScheme={jogo.visibleInConcursos ? 'green' : 'red'}
                  >
                    {jogo.visibleInConcursos ? 'Sim' : 'Não'}
                  </Badge>
                </Td>
                <Td>
                  <Tooltip label="Editar Jogo">
                    <IconButton
                      aria-label="Editar"
                      icon={<EditIcon />}
                      mr={2}
                      onClick={() => handleEdit(jogo)}
                    />
                  </Tooltip>
                  <Tooltip label="Ver Detalhes">
                    <IconButton
                      aria-label="Detalhes"
                      icon={<ViewIcon />}
                      mr={2}
                      onClick={() => handleViewDetails(jogo)}
                    />
                  </Tooltip>
                  <Tooltip label={jogo.visibleInConcursos ? "Ocultar na Concursos" : "Mostrar na Concursos"}>
                    <IconButton
                      aria-label="Toggle Visibilidade"
                      icon={jogo.visibleInConcursos ? <ViewOffIcon /> : <ViewIcon />}
                      mr={2}
                      onClick={() => handleToggleVisibility(jogo)}
                    />
                  </Tooltip>
                  <Tooltip label="Deletar Jogo">
                    <IconButton
                      aria-label="Deletar"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDelete(jogo)}
                    />
                  </Tooltip>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {/* Novo Componente para Gerenciar Resultados */}
      <ResultadosManagement />
    </Box>
  );
};

export default GameManagement;


// Caminho: src\app\components\dashboard\Admin\JogosConfig.jsx
// src/app/components/dashboard/Admin/JogosConfig.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  useToast,
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';

const JogosConfig = () => {
  const [valorDeposito, setValorDeposito] = useState('');
  const [valores, setValores] = useState([]);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Função para buscar os valores de depósito
  const fetchValores = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/config/jogos/valores', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.valores && response.data.valores.length > 0) {
        setValores(response.data.valores);
        setHasData(true);
      } else {
        setValores([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar valores:', error);
      toast({
        title: 'Erro ao carregar valores.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setValores([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchValores();
  }, [fetchValores]);

  // Função para adicionar um novo valor de depósito
  const handleAddValor = async () => {
    if (!valorDeposito || isNaN(valorDeposito) || Number(valorDeposito) < 0) {
      toast({
        title: 'Valor inválido.',
        description: 'Por favor, insira um valor válido.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/jogos/valores', { valor: parseFloat(valorDeposito) }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Valor adicionado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setValorDeposito('');
      fetchValores();
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      toast({
        title: 'Erro ao adicionar valor.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl mb={3}>
        <FormLabel>Valor de Depósito do Jogo (R$)</FormLabel>
        <Input
          type="number"
          value={valorDeposito}
          onChange={(e) => setValorDeposito(e.target.value)}
          placeholder="Insira o valor"
          min="0"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddValor} mb={4}>
        Adicionar
      </Button>
      {loading ? (
        <Flex justify="center" align="center">
          <Spinner />
        </Flex>
      ) : hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Valor (R$)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {valores.map((item) => (
              <Tr key={item.id}>
                <Td>R$ {item.valor.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default JogosConfig;


// Caminho: src\app\components\dashboard\Admin\PorcentagensConfig.jsx
// src/app/components/dashboard/Admin/PorcentagensConfig.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Select
} from '@chakra-ui/react';
import axios from 'axios';

const PorcentagensConfig = () => {
  const [porcentagens, setPorcentagens] = useState([]);
  const [formData, setFormData] = useState({
    perfil: '',
    colaboradorId: '',
    porcentagem: '',
    descricao: '',
  });
  const [hasData, setHasData] = useState(false);
  const toast = useToast();

  // Função para buscar as porcentagens
  const fetchPorcentagens = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/config/porcentagens', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.porcentagens && response.data.porcentagens.length > 0) {
        setPorcentagens(response.data.porcentagens);
        setHasData(true);
      } else {
        setPorcentagens([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar porcentagens:', error);
      toast({
        title: 'Erro ao carregar porcentagens.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setPorcentagens([]);
      setHasData(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPorcentagens();
  }, [fetchPorcentagens]);

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para adicionar uma nova porcentagem
  const handleAddPorcentagem = async () => {
    const { perfil, colaboradorId, porcentagem, descricao } = formData;
    if (!perfil || (perfil === 'colaborador' && !colaboradorId) || !porcentagem) {
      toast({
        title: 'Por favor, preencha todos os campos obrigatórios.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (isNaN(porcentagem) || Number(porcentagem) < 0 || Number(porcentagem) > 100) {
      toast({
        title: 'Porcentagem inválida.',
        description: 'Por favor, insira uma porcentagem entre 0 e 100.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/porcentagens', {
        perfil: formData.perfil,
        colaboradorId: formData.perfil === 'colaborador' ? formData.colaboradorId : null,
        porcentagem: parseFloat(porcentagem) / 100, // Armazena como decimal
        descricao: formData.descricao,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Porcentagem adicionada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({
        perfil: '',
        colaboradorId: '',
        porcentagem: '',
        descricao: '',
      });
      fetchPorcentagens();
    } catch (error) {
      console.error('Erro ao adicionar porcentagem:', error);
      toast({
        title: 'Erro ao adicionar porcentagem.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl isRequired mb={3}>
        <FormLabel>Perfil</FormLabel>
        <Select name="perfil" value={formData.perfil} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="jogos">Jogos</option>
          <option value="colaborador">Colaborador</option>
        </Select>
      </FormControl>
      {formData.perfil === 'colaborador' && (
        <FormControl isRequired mb={3}>
          <FormLabel>Colaborador ID</FormLabel>
          <Input
            name="colaboradorId"
            value={formData.colaboradorId}
            onChange={handleInputChange}
            placeholder="ID do colaborador"
          />
        </FormControl>
      )}
      <FormControl isRequired mb={3}>
        <FormLabel>Porcentagem (%)</FormLabel>
        <NumberInput
          min={0}
          max={100}
          value={formData.porcentagem}
          onChange={(valueString) => setFormData({ ...formData, porcentagem: valueString })}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Descrição</FormLabel>
        <Input
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
          placeholder="Descrição opcional"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddPorcentagem} mb={4}>
        Adicionar
      </Button>
      {hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Perfil</Th>
              <Th>Colaborador ID</Th>
              <Th>Porcentagem (%)</Th>
              <Th>Descrição</Th>
            </Tr>
          </Thead>
          <Tbody>
            {porcentagens.map((item) => (
              <Tr key={item.id}>
                <Td>{item.perfil.charAt(0).toUpperCase() + item.perfil.slice(1)}</Td>
                <Td>{item.colaboradorId || 'N/A'}</Td>
                <Td>{(item.porcentagem * 100).toFixed(2)}%</Td>
                <Td>{item.descricao || 'N/A'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default PorcentagensConfig;


// Caminho: src\app\components\dashboard\Admin\RecebimentoConfig.jsx
// src/app/components/dashboard/Admin/RecebimentoConfig.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { Flex } from '@chakra-ui/react';

const RecebimentoConfig = () => {
  const [recebimentos, setRecebimentos] = useState([]);
  const [formData, setFormData] = useState({
    tipo: '',
    nome_titular: '',
    chave_pix: '',
    tipo_chave: '',
    status: 'ativo',
    agencia: '',
    conta: '',
    banco: '',
  });
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Função para buscar os recebimentos
  const fetchRecebimentos = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/config/recebimentos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.recebimentos && response.data.recebimentos.length > 0) {
        setRecebimentos(response.data.recebimentos);
        setHasData(true);
      } else {
        setRecebimentos([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('Erro ao buscar recebimentos:', error);
      toast({
        title: 'Erro ao carregar recebimentos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setRecebimentos([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecebimentos();
  }, [fetchRecebimentos]);

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para adicionar um novo recebimento
  const handleAddRecebimento = async () => {
    const { tipo, nome_titular, chave_pix, tipo_chave } = formData;
    if (!tipo || !nome_titular || !chave_pix || !tipo_chave) {
      toast({
        title: 'Campos obrigatórios faltando.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/config/recebimentos', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Recebimento adicionado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({
        tipo: '',
        nome_titular: '',
        chave_pix: '',
        tipo_chave: '',
        status: 'ativo',
        agencia: '',
        conta: '',
        banco: '',
      });
      fetchRecebimentos();
    } catch (error) {
      console.error('Erro ao adicionar recebimento:', error);
      toast({
        title: 'Erro ao adicionar recebimento.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl isRequired mb={3}>
        <FormLabel>Tipo</FormLabel>
        <Select name="tipo" value={formData.tipo} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="pix">PIX</option>
          <option value="banco">Banco</option>
        </Select>
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Nome do Titular</FormLabel>
        <Input
          name="nome_titular"
          value={formData.nome_titular}
          onChange={handleInputChange}
          placeholder="Nome completo"
        />
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Chave PIX</FormLabel>
        <Input
          name="chave_pix"
          value={formData.chave_pix}
          onChange={handleInputChange}
          placeholder="Chave PIX"
        />
      </FormControl>
      <FormControl isRequired mb={3}>
        <FormLabel>Tipo da Chave</FormLabel>
        <Select name="tipo_chave" value={formData.tipo_chave} onChange={handleInputChange}>
          <option value="">Selecione</option>
          <option value="cpf">CPF</option>
          <option value="telefone">Telefone</option>
          <option value="email">Email</option>
        </Select>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Status</FormLabel>
        <Select name="status" value={formData.status} onChange={handleInputChange}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Agência</FormLabel>
        <Input
          name="agencia"
          value={formData.agencia}
          onChange={handleInputChange}
          placeholder="Agência"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Conta</FormLabel>
        <Input
          name="conta"
          value={formData.conta}
          onChange={handleInputChange}
          placeholder="Conta"
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel>Banco</FormLabel>
        <Input
          name="banco"
          value={formData.banco}
          onChange={handleInputChange}
          placeholder="Banco"
        />
      </FormControl>
      <Button colorScheme="green" onClick={handleAddRecebimento} mb={4}>
        Adicionar
      </Button>
      {loading ? (
        <Flex justify="center" align="center">
          <Spinner />
        </Flex>
      ) : hasData ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Tipo</Th>
              <Th>Nome do Titular</Th>
              <Th>Status</Th>
              <Th>Agência</Th>
              <Th>Conta</Th>
              <Th>Banco</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recebimentos.map((item) => (
              <Tr key={item.id}>
                <Td>{item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</Td>
                <Td>{item.nome_titular}</Td>
                <Td>
                  <Badge
                    colorScheme={item.status === 'ativo' ? 'green' : 'red'}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </Td>
                <Td>{item.agencia || 'N/A'}</Td>
                <Td>{item.conta || 'N/A'}</Td>
                <Td>{item.banco || 'N/A'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma informação disponível.</Text>
      )}
    </Box>
  );
};

export default RecebimentoConfig;


