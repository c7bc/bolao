// Caminho: src/app/components/dashboard/Admin/GameFormModal.jsx
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
  });
  const [generateNumbers, setGenerateNumbers] = useState(false);
  const [requirePoints, setRequirePoints] = useState(false);
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
    } else if (name === "jog_tipodojogo") {
      // Reseta campos relacionados quando o tipo de jogo muda
      handleGameTypeChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAnimalSelection = (selected) => {
    setSelectedAnimals(selected);
    setFormData((prev) => ({ ...prev, jog_numeros: selected.join(",") }));
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

      // Validação específica para Mega-Sena
      if (formData.jog_tipodojogo === 'MEGA') {
        const numerosArray = formData.jog_numeros.split(',').map(num => num.trim());
        if (numerosArray.length !== 6) {
          toast({
            title: "A Mega-Sena requer exatamente 6 números.",
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
      });
      setGenerateNumbers(false);
      setRequirePoints(false);
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
                <SimpleGrid columns={[3, 3, 6]} spacing={4}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <NumberInput
                      key={num}
                      min={1}
                      max={60}
                      value={formData.jog_numeros.split(',')[num - 1] || ''}
                      onChange={handleInputChange}
                    >
                      <NumberInputField name={`numero_${num}`} placeholder={`N° ${num}`} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  ))}
                </SimpleGrid>
              ) : (
                <Select
                  multiple
                  name="jog_numeros"
                  value={formData.jog_numeros.split(',').map(a => a.trim())}
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
            </FormControl>

            {/* Gerar Automático */}
            {/* Removido: Botão de "Gerar Seleções Automaticamente" */}

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
