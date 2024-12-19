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
