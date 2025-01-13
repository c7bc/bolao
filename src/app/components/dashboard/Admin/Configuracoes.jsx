// src/app/components/dashboard/Admin/Configuracoes.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useToast,
  Spinner,
  Text,
  Grid,
  GridItem,
  VStack,
  Stack,
  Textarea,
  IconButton,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Input,
} from "@chakra-ui/react";
import axios from "axios";
import GameFormModal from "./GameFormModal";
import GameTypeEditModal from "./GameTypeEditModal";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";

const Configuracoes = () => {
  const [rateio, setRateio] = useState({
    rateio_10_pontos: "",
    rateio_9_pontos: "",
    rateio_menos_pontos: "",
    custos_administrativos: "",
  });
  const [gameTypes, setGameTypes] = useState([]);
  const [newGameType, setNewGameType] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Estados para edição de tipo de jogo
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [gameTypeToEdit, setGameTypeToEdit] = useState(null);

  // Estados para deleção de tipo de jogo
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [gameTypeToDelete, setGameTypeToDelete] = useState(null);
  const cancelRef = React.useRef();

  const fetchRateio = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const [configResponse, gameTypesResponse] = await Promise.all([
        axios.get("/api/configuracoes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get("/api/game-types/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (configResponse.data.configuracoes) {
        setRateio({
          rateio_10_pontos:
            parseFloat(configResponse.data.configuracoes.rateio_10_pontos) ||
            "",
          rateio_9_pontos:
            parseFloat(configResponse.data.configuracoes.rateio_9_pontos) || "",
          rateio_menos_pontos:
            parseFloat(configResponse.data.configuracoes.rateio_menos_pontos) ||
            "",
          custos_administrativos:
            parseFloat(
              configResponse.data.configuracoes.custos_administrativos
            ) || "",
        });
      } else {
        setRateio({
          rateio_10_pontos: "",
          rateio_9_pontos: "",
          rateio_menos_pontos: "",
          custos_administrativos: "",
        });
      }

      setGameTypes(gameTypesResponse.data.gameTypes);
    } catch (error) {
      console.error("Erro ao buscar configurações de rateio:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.error ||
          "Não foi possível carregar as configurações de rateio.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRateio();
  }, [fetchRateio]);

  const handleRateioChange = (name, value) => {
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      setRateio((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    } else {
      setRateio((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRateioSubmit = async () => {
    const total = Object.values(rateio).reduce(
      (acc, val) => acc + (parseFloat(val) || 0),
      0
    );
    if (total !== 100) {
      toast({
        title: "Erro de Validação",
        description: "A soma das porcentagens deve ser 100%.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.put(
        "/api/configuracoes",
        {
          rateio_10_pontos: rateio.rateio_10_pontos,
          rateio_9_pontos: rateio.rateio_9_pontos,
          rateio_menos_pontos: rateio.rateio_menos_pontos,
          custos_administrativos: rateio.custos_administrativos,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: "Sucesso",
        description: "Configurações de rateio atualizadas com sucesso.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao atualizar configurações de rateio:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.error ||
          "Não foi possível atualizar as configurações de rateio.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Funções para gerenciar tipos de jogos
  const handleGameTypeChange = (e) => {
    const { name, value } = e.target;
    setNewGameType({
      ...newGameType,
      [name]: value,
    });
  };

  const handleGameTypeSubmit = async () => {
    if (!newGameType.name || !newGameType.description) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos para o tipo de jogo.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.post(
        "/api/game-types/create",
        {
          name: newGameType.name,
          description: newGameType.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGameTypes([...gameTypes, response.data.gameType]);
      setNewGameType({ name: "", description: "" });

      toast({
        title: "Sucesso",
        description: "Tipo de jogo criado com sucesso.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao criar tipo de jogo:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.error ||
          "Não foi possível criar o tipo de jogo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Funções para editar tipo de jogo
  const handleEditGameType = (gameType) => {
    setGameTypeToEdit(gameType);
    onEditOpen();
  };

  const handleDeleteGameType = (gameType) => {
    setGameTypeToDelete(gameType);
    onDeleteOpen();
  };

  const confirmDeleteGameType = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        onDeleteClose();
        return;
      }

      await axios.delete(`/api/game-types/${gameTypeToDelete.game_type_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Sucesso",
        description: "Tipo de jogo deletado com sucesso.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Atualizar a lista de tipos de jogos
      setGameTypes(
        gameTypes.filter(
          (gt) => gt.game_type_id !== gameTypeToDelete.game_type_id
        )
      );
    } catch (error) {
      console.error("Erro ao deletar tipo de jogo:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.error ||
          "Não foi possível deletar o tipo de jogo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="green.500" />
        <Text mt={4}>Carregando configurações...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxWidth="1200px" mx="auto">
      <Heading as="h2" size="xl" mb={6} textAlign="center" color="green.600">
        Configurações de Rateio
      </Heading>
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        {/* Configurações de Rateio */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Porcentagem para 10 Pontos</FormLabel>
              <NumberInput
                value={rateio.rateio_10_pontos}
                onChange={(value) =>
                  handleRateioChange("rateio_10_pontos", value)
                }
                min={0}
                max={100}
                precision={2}
              >
                <NumberInputField placeholder="Ex: 40" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Porcentagem para 9 Pontos</FormLabel>
              <NumberInput
                value={rateio.rateio_9_pontos}
                onChange={(value) =>
                  handleRateioChange("rateio_9_pontos", value)
                }
                min={0}
                max={100}
                precision={2}
              >
                <NumberInputField placeholder="Ex: 30" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Porcentagem para Menos Pontos</FormLabel>
              <NumberInput
                value={rateio.rateio_menos_pontos}
                onChange={(value) =>
                  handleRateioChange("rateio_menos_pontos", value)
                }
                min={0}
                max={100}
                precision={2}
              >
                <NumberInputField placeholder="Ex: 20" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Custos Administrativos (%)</FormLabel>
              <NumberInput
                value={rateio.custos_administrativos}
                onChange={(value) =>
                  handleRateioChange("custos_administrativos", value)
                }
                min={0}
                max={100}
                precision={2}
              >
                <NumberInputField placeholder="Ex: 10" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <Button colorScheme="green" onClick={handleRateioSubmit}>
              Salvar Configurações
            </Button>

            <Box textAlign="center">
              <Text color="gray.500">
                Total:{" "}
                {Object.values(rateio).reduce(
                  (acc, val) => acc + (parseFloat(val) || 0),
                  0
                )}
                %
              </Text>
              {Object.values(rateio).reduce(
                (acc, val) => acc + (parseFloat(val) || 0),
                0
              ) !== 100 && (
                <Text color="red.500">
                  A soma das porcentagens deve ser igual a 100%.
                </Text>
              )}
            </Box>
          </VStack>
        </GridItem>

        {/* Gestão de Tipos de Jogos */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            <Heading as="h3" size="lg" color="green.600" textAlign="center">
              Gestão de Tipos de Jogos
            </Heading>
            {/* Lista de Tipos de Jogos */}
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={4}
              maxHeight="400px"
              overflowY="auto"
            >
              {gameTypes.length > 0 ? (
                gameTypes.map((type) => (
                  <Box
                    key={type.game_type_id}
                    mb={2}
                    p={2}
                    borderWidth="1px"
                    borderRadius="md"
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="bold">{type.name}</Text>
                        <Text>{type.description}</Text>
                      </Box>
                      <Box>
                        <Tooltip label="Editar Tipo de Jogo">
                          <IconButton
                            aria-label="Editar"
                            icon={<EditIcon />}
                            mr={2}
                            size="sm"
                            onClick={() => handleEditGameType(type)}
                          />
                        </Tooltip>
                        <Tooltip label="Deletar Tipo de Jogo">
                          <IconButton
                            aria-label="Deletar"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleDeleteGameType(type)}
                          />
                        </Tooltip>
                      </Box>
                    </Flex>
                  </Box>
                ))
              ) : (
                <Text>Nenhum tipo de jogo cadastrado.</Text>
              )}
            </Box>

            {/* Formulário para Adicionar Novo Tipo de Jogo */}
            <Stack spacing={3}>
              <FormControl isRequired>
                <FormLabel>Nome do Tipo de Jogo</FormLabel>
                <Input
                  name="name"
                  value={newGameType.name}
                  onChange={handleGameTypeChange}
                  placeholder="Ex: Mega-Sena"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Descrição</FormLabel>
                <Textarea
                  name="description"
                  value={newGameType.description}
                  onChange={handleGameTypeChange}
                  placeholder="Descrição do tipo de jogo"
                />
              </FormControl>
              <Button colorScheme="teal" onClick={handleGameTypeSubmit}>
                Adicionar Tipo de Jogo
              </Button>
            </Stack>
          </VStack>
        </GridItem>
      </Grid>

      {/* Modal para Editar Tipo de Jogo */}
      {gameTypeToEdit && (
        <GameTypeEditModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          gameType={gameTypeToEdit}
          refreshList={fetchRateio}
        />
      )}

      {/* AlertDialog para Deletar Tipo de Jogo */}
      {gameTypeToDelete && (
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Deletar Tipo de Jogo
              </AlertDialogHeader>

              <AlertDialogBody>
                Tem certeza que deseja deletar o tipo de jogo &quot;
                {gameTypeToDelete.name}&quot;? Esta ação é irreversível.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="red"
                  onClick={confirmDeleteGameType}
                  ml={3}
                >
                  Deletar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Box>
  );
};

export default Configuracoes;
