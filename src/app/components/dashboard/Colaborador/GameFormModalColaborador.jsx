// src/app/components/dashboard/Colaborador/GameFormModalColaborador.jsx

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

const GAME_TYPE_CONFIG = {
  MEGA: { min: 6, max: 60, valor: 30.0 },
  LOTOFACIL: { min: 15, max: 25, valor: 20.0 },
  JOGO_DO_BICHO: { min: 6, max: 25, valor: 15.0 },
};

const GameFormModalColaborador = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    jog_nome: "",
    slug: "",
    visibleInConcursos: true,
    jog_status: "upcoming",
    jog_tipodojogo: "",
    jog_valorjogo: "",
    jog_quantidade_minima: "",
    jog_quantidade_maxima: "",
    jog_numeros: "",
    jog_data_inicio: "",
    jog_data_fim: "",
  });

  const [gameTypes, setGameTypes] = useState([]);
  const toast = useToast();

  // Define os tipos de jogos ao carregar o componente
  useEffect(() => {
    setGameTypes(GAME_TYPE_CONFIG);
  }, []);

  // Atualiza os campos quando o tipo de jogo é selecionado
  const handleGameTypeChange = (e) => {
    const tipo = e.target.value;
    const config = GAME_TYPE_CONFIG[tipo];
    if (config) {
      setFormData((prev) => ({
        ...prev,
        jog_tipodojogo: tipo,
        jog_valorjogo: config.valor,
        jog_quantidade_minima: config.min,
        jog_quantidade_maxima: config.max,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "jog_tipodojogo") {
      handleGameTypeChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Verifica unicidade do slug
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

  // Gera um slug único baseado no nome
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
      // Validações básicas
      if (!formData.jog_tipodojogo || !formData.jog_nome || !formData.jog_data_inicio || !formData.jog_data_fim) {
        toast({
          title: 'Campos obrigatórios não preenchidos',
          description: 'Por favor, preencha todos os campos obrigatórios.',
          status: 'warning',
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
            title: "Slug já está em uso",
            description: "Por favor, escolha outro slug.",
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
      await axios.post("/api/colaborador/jogos/create", payload, {
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
        jog_status: "upcoming",
        jog_tipodojogo: "",
        jog_valorjogo: "",
        jog_quantidade_minima: "",
        jog_quantidade_maxima: "",
        jog_numeros: "",
        jog_data_inicio: "",
        jog_data_fim: "",
      });

      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao criar jogo",
        description: error.response?.data?.message || "Ocorreu um erro inesperado",
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
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="jog_nome"
                value={formData.jog_nome}
                onChange={handleInputChange}
                placeholder="Digite o nome do jogo"
              />
            </FormControl>

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

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="visibleInConcursos" mb="0">
                Visível em Concursos
              </FormLabel>
              <Switch
                id="visibleInConcursos"
                name="visibleInConcursos"
                isChecked={formData.visibleInConcursos}
                onChange={(e) => handleInputChange({
                  target: {
                    name: "visibleInConcursos",
                    type: "checkbox",
                    checked: e.target.checked
                  }
                })}
              />
            </FormControl>

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

            <FormControl isRequired>
              <FormLabel>Valor do Jogo</FormLabel>
              <NumberInput
                name="jog_valorjogo"
                value={formData.jog_valorjogo}
                onChange={(valueString) =>
                  setFormData((prev) => ({
                    ...prev,
                    jog_valorjogo: valueString,
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

            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Quantidade Mínima</FormLabel>
                <NumberInput
                  name="jog_quantidade_minima"
                  value={formData.jog_quantidade_minima}
                  onChange={(valueString) =>
                    setFormData((prev) => ({
                      ...prev,
                      jog_quantidade_minima: valueString,
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

              <FormControl isRequired>
                <FormLabel>Quantidade Máxima</FormLabel>
                <NumberInput
                  name="jog_quantidade_maxima"
                  value={formData.jog_quantidade_maxima}
                  onChange={(valueString) =>
                    setFormData((prev) => ({
                      ...prev,
                      jog_quantidade_maxima: valueString,
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
            </SimpleGrid>

            <FormControl isRequired>
              <FormLabel>Data de Início</FormLabel>
              <Input
                name="jog_data_inicio"
                type="datetime-local"
                value={formData.jog_data_inicio}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Data de Fim</FormLabel>
              <Input
                name="jog_data_fim"
                type="datetime-local"
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

export default GameFormModalColaborador;