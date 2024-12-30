// src/app/components/dashboard/Admin/GameEditModal.jsx

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
        ? jogo.jog_numeros.split(",").map((a) => a.trim())
        : []
    );
  }, [jogo, isOpen]);

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
            const generatedNumbers = generateUniqueNumbers(count, 1, 60); // Ajustado para máximo 60
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
      // Resetar campos relacionados quando o tipo de jogo muda
      handleGameTypeChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
      jog_valorpremio_est: "",
    }));
    setSelectedAnimals([]);
    setGenerateNumbers(false);
    setAutoGenerate(false);
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
  const isSlugUnique = async (slug, currentJogId = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/jogos/list?slug=${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.jogos.length === 0) return true;
      if (currentJogId) {
        return response.data.jogos.every(
          (j) => j.jog_id === currentJogId
        );
      }
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
    while (!(await isSlugUnique(uniqueSlug, jogo.jog_id))) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    return uniqueSlug;
  };

  const handleSubmit = async () => {
    try {
      // Validações adicionais no frontend
      if (generateNumbers && !formData.jog_numeros) {
        toast({
          title: "Números/Animais são obrigatórios.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (formData.jog_tipodojogo !== "JOGO_DO_BICHO" && generateNumbers && formData.jog_numeros) {
        const { jog_tipodojogo, jog_quantidade_minima, jog_quantidade_maxima } = formData;
        const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
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
        const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
        if (!numerosValidos) {
          toast({
            title: "Os números devem conter apenas dígitos.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      if (formData.jog_tipodojogo === "JOGO_DO_BICHO" && generateNumbers && formData.jog_numeros) {
        const { jog_quantidade_minima, jog_quantidade_maxima } = formData;
        const animalsArray = formData.jog_numeros.split(',').map(a => a.trim());
        if (
          animalsArray.length < parseInt(jog_quantidade_minima, 10) ||
          animalsArray.length > parseInt(jog_quantidade_maxima, 10)
        ) {
          toast({
            title: `A quantidade de animais deve estar entre ${jog_quantidade_minima} e ${jog_quantidade_maxima}.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        const validAnimals = animalOptions;
        const animaisValidos = animalsArray.every(animal => validAnimals.includes(animal));
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
        if (!(await isSlugUnique(finalSlug, jogo.jog_id))) {
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

      // Validação do Valor do Prêmio Estimado
      if (
        formData.jog_valorpremio_est &&
        (isNaN(formData.jog_valorpremio_est) ||
          Number(formData.jog_valorpremio_est) < 0)
      ) {
        toast({
          title: "Valor do Prêmio Estimado inválido.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Obter informações do colaborador (criador do jogo)
      const token = localStorage.getItem("token");
      const decodedToken = parseJwt(token);
      if (!decodedToken) {
        toast({
          title: "Token inválido.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      const colaboradorId = decodedToken.col_id;
      const colaboradorRole = decodedToken.role;

      // Adicionar informações do criador ao payload
      payload.jog_creator_id = colaboradorId;
      payload.jog_creator_role = colaboradorRole;

      // Enviar dados para backend
      await axios.put(`/api/jogos/${jogo.slug}`, payload, {
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

      // Resetar formulário
      setFormData({
        jog_nome: "",
        slug: "",
        visibleInConcursos: true,
        jog_status: "open",
        jog_tipodojogo: "",
        jog_valorjogo: "",
        jog_valorpremio_est: "",
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
      console.error('Erro ao atualizar o jogo:', error);
      toast({
        title: "Erro ao atualizar o jogo.",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Função para decodificar o JWT
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visibleInConcursos: e.target.checked,
                  }))
                }
                colorScheme="green"
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
                {Object.keys(gameTypeOptions).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Valor do Jogo */}
            <FormControl isRequired>
              <FormLabel>Valor do Jogo (R$)</FormLabel>
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

            {/* Valor do Prêmio Estimado */}
            <FormControl>
              <FormLabel>Valor do Prêmio Estimado (R$)</FormLabel>
              <NumberInput
                name="jog_valorpremio_est"
                value={formData.jog_valorpremio_est}
                onChange={(valueString, valueNumber) =>
                  setFormData((prev) => ({
                    ...prev,
                    jog_valorpremio_est: valueNumber,
                  }))
                }
                min={0}
              >
                <NumberInputField placeholder="Valor do prêmio estimado" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>Opcional. Será calculado automaticamente.</FormHelperText>
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
                  placeholder="Ex: 01,02,03,04,05,06"
                />
              ) : (
                <Select
                  multiple
                  name="jog_numeros"
                  value={selectedAnimals}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                    setSelectedAnimals(selectedOptions);
                    setFormData((prev) => ({ ...prev, jog_numeros: selectedOptions.join(",") }));
                  }}
                >
                  {animalOptions.map((animal) => (
                    <option key={animal} value={animal}>
                      {animal}
                    </option>
                  ))}
                </Select>
              )}
              <FormHelperText>
                {formData.jog_tipodojogo !== "JOGO_DO_BICHO"
                  ? `Insira entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima} números.`
                  : `Selecione entre ${formData.jog_quantidade_minima} e ${formData.jog_quantidade_maxima} animais.`}
              </FormHelperText>
            </FormControl>

            {/* Gerar Automático */}
            {generateNumbers && (
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
                colorScheme="green"
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
