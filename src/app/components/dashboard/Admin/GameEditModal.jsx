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
