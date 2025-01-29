"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Stack,
  VStack,
  useBreakpointValue,
  Container,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { EditIcon, ViewIcon, DeleteIcon, ViewOffIcon } from "@chakra-ui/icons";
import axios from "axios";
import GameFormModal from "./GameFormModal";
import GameEditModal from "./GameEditModal";
import GameDetailsModal from "./GameDetailsModal";
import LotteryForm from "./LotteryForm";
import { useToast } from "@chakra-ui/react";
import PrizeCalculation from "./PrizeCalculation";
import ManualBetRegistration from "./ManualBetRegistration";
import { ChakraProvider } from "@chakra-ui/react";

const GameManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [selectedGameType, setSelectedGameType] = useState("");
  const [dataFimFilter, setDataFimFilter] = useState("");
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

  // Responsive breakpoints ajustados para telas menores
  const isMobile = useBreakpointValue({ base: true, sm: true, md: false });
  const tableDisplay = useBreakpointValue({ base: "none", lg: "table" });
  const cardDisplay = useBreakpointValue({ base: "block", lg: "none" });
  const containerPadding = useBreakpointValue({ base: 2, sm: 3, md: 4 });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });
  const stackSpacing = useBreakpointValue({ base: 2, md: 4 });

  // Função para verificar e atualizar o status dos jogos
  const checkGameStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const updatedJogos = await Promise.all(
        jogos.map(async (jogo) => {
          try {
            const response = await axios.post(
              "/api/jogos/update-status",
              { jog_id: jogo.jog_id },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (
              response.data.status &&
              response.data.status !== jogo.jog_status
            ) {
              return { ...jogo, jog_status: response.data.status };
            }
            return jogo;
          } catch (error) {
            return jogo;
          }
        })
      );

      const hasChanges = updatedJogos.some(
        (updatedJogo, index) =>
          updatedJogo.jog_status !== jogos[index].jog_status
      );

      if (hasChanges) {
        setJogos(updatedJogos);
      }
    } catch (error) {
      console.error("Error checking game statuses:", error);
    }
  }, [jogos]);

  // Função para buscar tipos de jogos
  const fetchGameTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado.",
          description: "Por favor, faça login novamente.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.get("/api/game-types/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setGameTypes(response.data.gameTypes);
    } catch (error) {
      toast({
        title: "Erro ao buscar tipos de jogos.",
        description: error.response?.data?.error || "Erro desconhecido.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Função para buscar jogos
  const fetchJogos = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado.",
          description: "Por favor, faça login novamente.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const params = {};
      if (selectedGameType) params.game_type_id = selectedGameType;
      if (dataFimFilter) params.data_fim = dataFimFilter;

      const response = await axios.get("/api/jogos/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setJogos(response.data.jogos);
    } catch (error) {
      toast({
        title: "Erro ao buscar jogos.",
        description: error.response?.data?.error || "Erro desconhecido.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedGameType, dataFimFilter, toast]);

  useEffect(() => {
    if (jogos.length > 0) {
      checkGameStatuses();
    }
  }, [checkGameStatuses, jogos.length]);

  useEffect(() => {
    fetchGameTypes();
    fetchJogos();
  }, [fetchGameTypes, fetchJogos]);

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
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado.",
          description: "Por favor, faça login novamente.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await axios.put(
        `/api/jogos/${jogo.slug}/visibility`,
        { visibleInConcursos: updatedVisibility },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: `Visibilidade atualizada para ${
          updatedVisibility ? "Visível" : "Oculto"
        }.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      toast({
        title: "Erro ao atualizar visibilidade.",
        description: error.response?.data?.error || "Erro desconhecido.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (jogo) => {
    const confirmDelete = confirm(
      `Tem certeza que deseja deletar o jogo "${jogo.jog_nome}"? Esta ação é irreversível.`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado.",
          description: "Por favor, faça login novamente.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (jogo.slug) {
        await axios.delete(`/api/jogos/${jogo.slug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.delete("/api/jogos/delete", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { jog_id: jogo.jog_id },
        });
      }

      toast({
        title: "Jogo deletado com sucesso.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      fetchJogos();
    } catch (error) {
      toast({
        title: "Erro ao deletar jogo.",
        description: error.response?.data?.error || "Erro desconhecido.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Filtra jogos com status 'fechado' para a aba 'Sorteio'
  const jogosFechados = jogos.filter((jogo) => jogo.jog_status === "fechado");

  const GameCard = ({ jogo }) => (
    <Card mb={2} variant="outlined" size="sm">
      <CardBody p={2}>
        <VStack align="start" spacing={1}>
          <Heading size="sm" noOfLines={1}>
            {jogo.jog_nome}
          </Heading>
          <Text fontSize="sm">
            <strong>Tipo:</strong>{" "}
            {gameTypes.find((type) => type.game_type_id === jogo.jog_tipodojogo)
              ?.name || jogo.jog_tipodojogo}
          </Text>
          <Badge
            size="sm"
            colorScheme={
              jogo.jog_status === "aberto"
                ? "green"
                : jogo.jog_status === "fechado"
                ? "yellow"
                : "red"
            }
          >
            {jogo.jog_status === "aberto"
              ? "Aberto"
              : jogo.jog_status === "fechado"
              ? "Fechado"
              : "Encerrado"}
          </Badge>
          <Text fontSize="xs">
            <strong>Início:</strong>{" "}
            {new Date(jogo.data_inicio).toLocaleString()}
          </Text>
          <Text fontSize="xs">
            <strong>Fim:</strong> {new Date(jogo.data_fim).toLocaleString()}
          </Text>
          <Badge
            size="sm"
            colorScheme={jogo.visibleInConcursos ? "green" : "red"}
          >
            {jogo.visibleInConcursos ? "Visível" : "Oculto"}
          </Badge>
          <Flex gap={1} mt={1}>
            <IconButton
              aria-label="Editar"
              icon={<EditIcon />}
              onClick={() => handleEdit(jogo)}
              size="xs"
            />
            <IconButton
              aria-label="Detalhes"
              icon={<ViewIcon />}
              onClick={() => handleViewDetails(jogo)}
              size="xs"
            />
            <IconButton
              aria-label="Toggle Visibilidade"
              icon={jogo.visibleInConcursos ? <ViewOffIcon /> : <ViewIcon />}
              onClick={() => handleToggleVisibility(jogo)}
              size="xs"
            />
            <IconButton
              aria-label="Deletar"
              icon={<DeleteIcon />}
              colorScheme="red"
              onClick={() => handleDelete(jogo)}
              size="xs"
            />
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <ChakraProvider>
      <Container maxW="container.xl" p={containerPadding}>
        <VStack spacing={stackSpacing} align="stretch">
          <Heading size={headingSize}>Gerenciamento de Jogos</Heading>

          <Button
            colorScheme="green"
            onClick={onOpen}
            size={buttonSize}
            width="full"
          >
            Cadastrar Jogo
          </Button>

          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={stackSpacing}
            mb={stackSpacing}
          >
            <Select
              placeholder="Filtrar por Tipo"
              value={selectedGameType}
              onChange={(e) => setSelectedGameType(e.target.value)}
              size={buttonSize}
            >
              {gameTypes.map((type) => (
                <option key={type.game_type_id} value={type.game_type_id}>
                  {type.name}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              placeholder="Data de Fim"
              value={dataFimFilter}
              onChange={(e) => setDataFimFilter(e.target.value)}
              size={buttonSize}
            />
            <Button
              onClick={fetchJogos}
              colorScheme="blue"
              width="full"
              size={buttonSize}
            >
              Filtrar
            </Button>
          </Stack>

          {loading ? (
            <Flex justify="center" align="center" p={4}>
              <Spinner size={buttonSize} color="green.500" />
            </Flex>
          ) : (
            <Tabs variant="enclosed" colorScheme="green" size={buttonSize}>
              <TabList overflowX="auto" css={{ scrollbarWidth: "none" }}>
                <Tab fontSize={{ base: "sm", md: "md" }}>Geral</Tab>
                <Tab fontSize={{ base: "sm", md: "md" }}>
                  Calcular Premiação
                </Tab>
                <Tab fontSize={{ base: "sm", md: "md" }}>Sorteio</Tab>
                <Tab fontSize={{ base: "sm", md: "md" }}>Registro Manual</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={2}>
                  {/* Desktop View */}
                  <Box display={tableDisplay}>
                    <Table
                      variant="striped"
                      colorScheme="green"
                      size={buttonSize}
                    >
                      <Thead>
                        <Tr>
                          <Th>Nome</Th>
                          <Th>Tipo de Jogo</Th>
                          <Th>Status</Th>
                          <Th>Data de Início</Th>
                          <Th>Data de Fim</Th>
                          <Th>Visível nos Concursos</Th>
                          <Th>Ações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {jogos.map((jogo) => (
                          <Tr
                            key={jogo.jog_id}
                            onClick={() => setSelectedGame(jogo)}
                            cursor="pointer"
                            _hover={{ bg: "gray.50" }}
                          >
                            <Td>{jogo.jog_nome}</Td>
                            <Td>
                              {gameTypes.find(
                                (type) =>
                                  type.game_type_id === jogo.jog_tipodojogo
                              )?.name || jogo.jog_tipodojogo}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  jogo.jog_status === "aberto"
                                    ? "green"
                                    : jogo.jog_status === "fechado"
                                    ? "yellow"
                                    : "red"
                                }
                              >
                                {jogo.jog_status === "aberto"
                                  ? "Aberto"
                                  : jogo.jog_status === "fechado"
                                  ? "Fechado"
                                  : "Encerrado"}
                              </Badge>
                            </Td>
                            <Td>
                              {new Date(jogo.data_inicio).toLocaleString()}
                            </Td>
                            <Td>{new Date(jogo.data_fim).toLocaleString()}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  jogo.visibleInConcursos ? "green" : "red"
                                }
                              >
                                {jogo.visibleInConcursos ? "Sim" : "Não"}
                              </Badge>
                            </Td>
                            <Td>
                              <Flex gap={1}>
                                <IconButton
                                  aria-label="Editar"
                                  icon={<EditIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(jogo);
                                  }}
                                  size="xs"
                                />
                                <IconButton
                                  aria-label="Detalhes"
                                  icon={<ViewIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(jogo);
                                  }}
                                  size="xs"
                                />
                                <IconButton
                                  aria-label="Toggle Visibilidade"
                                  icon={
                                    jogo.visibleInConcursos ? (
                                      <ViewOffIcon />
                                    ) : (
                                      <ViewIcon />
                                    )
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleVisibility(jogo);
                                  }}
                                  size="xs"
                                />
                                <IconButton
                                  aria-label="Deletar"
                                  icon={<DeleteIcon />}
                                  colorScheme="red"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(jogo);
                                  }}
                                  size="xs"
                                />
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>

                  {/* Mobile View */}
                  <Box display={cardDisplay}>
                    <VStack spacing={2} align="stretch">
                      {jogos.map((jogo) => (
                        <GameCard key={jogo.jog_id} jogo={jogo} />
                      ))}
                    </VStack>
                  </Box>
                </TabPanel>

                <TabPanel p={2}>
                  <Box>
                    <PrizeCalculation selectedGame={selectedGame} />
                  </Box>
                </TabPanel>

                <TabPanel p={2}>
                  <VStack spacing={2} align="stretch">
                    <Box>
                      <Text
                        fontSize={{ base: "sm", md: "lg" }}
                        mb={2}
                        fontWeight="semibold"
                      >
                        Selecionar Jogo para Sorteio
                      </Text>
                      {jogosFechados.length > 0 ? (
                        <Select
                          placeholder="Selecionar Jogo Fechado"
                          value={selectedGame ? selectedGame.jog_id : ""}
                          onChange={(e) => {
                            const jogoSelecionado = jogosFechados.find(
                              (jogo) => jogo.jog_id === e.target.value
                            );
                            setSelectedGame(jogoSelecionado);
                          }}
                          size={buttonSize}
                        >
                          {jogosFechados.map((jogo) => (
                            <option key={jogo.jog_id} value={jogo.jog_id}>
                              {jogo.jog_nome}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Nenhum jogo com status &quot;Fechado&quot; disponível
                          para sorteio.
                        </Text>
                      )}
                    </Box>
                    {selectedGame && (
                      <Box mt={2}>
                        <LotteryForm
                          jogo={selectedGame}
                          refreshList={fetchJogos}
                        />
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                <TabPanel p={2}>
                  <VStack spacing={2} align="stretch">
                    <Box>
                      <Text
                        fontSize={{ base: "sm", md: "lg" }}
                        mb={2}
                        fontWeight="semibold"
                      >
                        Registro Manual de Apostas
                      </Text>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Use esta área para registrar apostas manualmente para
                        clientes específicos.
                      </Text>
                      <Box mt={2}>
                        <ManualBetRegistration />
                      </Box>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}

          {/* Modals */}
          <GameFormModal
            isOpen={isOpen}
            onClose={onClose}
            refreshList={fetchJogos}
          />

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
                gameTypes={gameTypes}
                refreshList={fetchJogos}
              />
            </>
          )}
        </VStack>
      </Container>
    </ChakraProvider>
  );
};

export default GameManagement;
