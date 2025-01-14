"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Badge,
  SimpleGrid,
  Checkbox,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  FaTicketAlt,
  FaTrophy,
  FaClock,
  FaUsers,
  FaMoneyBill,
  FaDice,
} from "react-icons/fa";
import { RefreshCw } from "lucide-react";

const NumberSelector = ({
  numeroInicial,
  numeroFinal,
  numeroPalpites,
  selectedNumbers,
  onNumberSelect,
}) => {
  const numbers = Array.from(
    { length: numeroFinal - numeroInicial + 1 },
    (_, i) => i + numeroInicial
  );

  return (
    <SimpleGrid columns={10} spacing={2} mt={4}>
      {numbers.map((number) => (
        <Checkbox
          key={number}
          isChecked={selectedNumbers.includes(number)}
          onChange={() => onNumberSelect(number)}
          isDisabled={
            selectedNumbers.length >= numeroPalpites &&
            !selectedNumbers.includes(number)
          }
        >
          {number}
        </Checkbox>
      ))}
    </SimpleGrid>
  );
};

const PoolDetailsCard = ({ pool, onLogin, onRegister }) => {
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [betForm, setBetForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(pool.participants || 0);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userName: "",
    userType: "",
  });
  const toast = useToast();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          let name = "";

          switch (payload.role) {
            case "superadmin":
              name = payload.adm_nome || "Superadmin";
              break;
            case "admin":
              name = payload.adm_nome || "Admin";
              break;
            case "colaborador":
              name = payload.col_nome || "Colaborador";
              break;
            case "cliente":
              name = payload.cli_nome || "Cliente";
              break;
            default:
              name = "Usuário";
              break;
          }

          setAuthState({
            isLoggedIn: true,
            userName: name,
            userType: payload.role,
          });
          
          // Preencher o formulário com os dados do usuário
          setBetForm(prev => ({
            ...prev,
            name: name,
            email: payload.email || "",
          }));
          
        } catch (error) {
          console.error("Erro ao decodificar o token:", error);
          setAuthState({
            isLoggedIn: false,
            userName: "",
            userType: "",
          });
          localStorage.removeItem("token");
        }
      } else {
        setAuthState({
          isLoggedIn: false,
          userName: "",
          userType: "",
        });
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchTotalParticipants = async () => {
      try {
        const response = await axios.get(
          `/api/jogos/${pool.jog_id}/total-participantes`
        );
        if (response.data && response.data.totalParticipantes !== undefined) {
          setTotalParticipants(response.data.totalParticipantes);
        } else {
          setTotalParticipants(0);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setTotalParticipants(0);
        } else {
          console.error("Erro ao buscar total de participantes:", err);
          toast({
            title: "Erro",
            description: "Não foi possível carregar o número de participantes",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    if (pool?.jog_id) {
      fetchTotalParticipants();
    }
  }, [pool?.jog_id, toast]);

  const handleNumberSelect = (number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(number)) {
        return prev.filter((n) => n !== number);
      }
      if (prev.length < pool.numeroPalpites) {
        return [...prev, number].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  const generateRandomNumbers = () => {
    const available = Array.from(
      { length: pool.numeroFinal - pool.numeroInicial + 1 },
      (_, i) => i + pool.numeroInicial
    );
    const numbers = [];
    while (numbers.length < pool.numeroPalpites) {
      const randomIndex = Math.floor(Math.random() * available.length);
      numbers.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
  };

  const validateForm = () => {
    if (!betForm.name || !betForm.whatsapp || !betForm.email) {
      toast({
        title: "Campos Incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (selectedNumbers.length !== pool.numeroPalpites) {
      toast({
        title: "Seleção Incompleta",
        description: `Você deve selecionar ${pool.numeroPalpites} números.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const handleBetSubmit = async () => {
    if (!validateForm()) return;

    if (!authState.isLoggedIn) {
      toast({
        title: "Autenticação Necessária",
        description: "Por favor, faça login para realizar uma aposta.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/jogos/apostas",
        {
          jogo_id: pool.jog_id,
          palpite_numbers: selectedNumbers,
          valor_total: parseFloat(pool.entryValue) * quantity,
          metodo_pagamento: "mercado_pago",
          name: betForm.name,
          whatsapp: betForm.whatsapp,
          email: betForm.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        toast({
          title: "Sucesso",
          description: "Aposta registrada com sucesso!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setShowBetModal(false);
        setTotalParticipants((prev) => prev + 1);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Erro ao processar aposta";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "aberto":
        return "green";
      case "fechado":
        return "orange";
      case "encerrado":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "aberto":
        return "Aberto para apostas";
      case "fechado":
        return "Apostas encerradas";
      case "encerrado":
        return "Concurso finalizado";
      default:
        return "Status desconhecido";
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!pool) {
    return (
      <Card>
        <CardBody>
          <Text>Carregando dados do bolão...</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card boxShadow="xl" borderRadius="xl" bg="white">
      <CardHeader>
        <Heading size="xl" textAlign="center" color="green.600">
          {pool.title}
        </Heading>
        <Text mt={2} textAlign="center" color="gray.600">
          {pool.description}
        </Text>
      </CardHeader>

      <CardBody>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8}>
          {/* Informações do Bolão */}
          <Stack spacing={6}>
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <FaTicketAlt color="green" />
                <Text ml={2} fontWeight="bold">
                  Valor do Bilhete:
                </Text>
              </Flex>
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {formatCurrency(pool.entryValue)}
              </Text>
            </Flex>

            <Flex align="center" justify="space-between">
              <Flex align="center">
                <FaDice color="purple" />
                <Text ml={2} fontWeight="bold">
                  Pontos por Acerto:
                </Text>
              </Flex>
              <Text fontSize="xl" fontWeight="bold">
                {pool.pontosPorAcerto} pontos
              </Text>
            </Flex>

            <Flex align="center" justify="space-between">
              <Flex align="center">
                <FaUsers color="blue" />
                <Text ml={2} fontWeight="bold">
                  Participantes:
                </Text>
              </Flex>
              <Text fontSize="xl" fontWeight="bold">
                {totalParticipants}
              </Text>
            </Flex>

            <Flex align="center" justify="space-between">
              <Flex align="center">
                <FaClock color="red" />
                <Text ml={2} fontWeight="bold">
                  Status:
                </Text>
              </Flex>
              <Badge
                colorScheme={getStatusColor(pool.status)}
                fontSize="md"
                p={2}
                borderRadius="md"
              >
                {getStatusText(pool.status)}
              </Badge>
            </Flex>
          </Stack>

          {/* Datas e Regras */}
          <Stack spacing={6}>
            <Box>
              <Text fontWeight="bold" mb={2}>
                Período do Concurso:
              </Text>
              <Text>Início: {pool.startTime.toLocaleString()}</Text>
              <Text>Fim: {pool.endTime.toLocaleString()}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>
                Regras do Jogo:
              </Text>
              <Text>• Selecione {pool.numeroPalpites} números diferentes</Text>
              <Text>
                • Números disponíveis: {pool.numeroInicial} a {pool.numeroFinal}
              </Text>
              <Text>• {pool.pontosPorAcerto} pontos por acerto</Text>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>
                Formas de Pagamento:
              </Text>
              <Stack direction="row" spacing={4}>
                <Flex align="center" bg="gray.100" p={2} borderRadius="md">
                  <FaMoneyBill />
                  <Text ml={2}>Mercado Pago</Text>
                </Flex>
              </Stack>
            </Box>
          </Stack>
        </Grid>

        <Divider my={6} />

        {/* Botão de Apostar */}
        {pool.status === "aberto" && (
          <Button
            colorScheme="green"
            size="lg"
            width="full"
            onClick={() => setShowBetModal(true)}
            isDisabled={loading}
          >
            Fazer Aposta
          </Button>
        )}

        {/* Modal de Aposta */}
        <Modal
          isOpen={showBetModal}
          onClose={() => setShowBetModal(false)}
          size="xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Realizar Aposta</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={6}>
                {!authState.isLoggedIn ? (
                  <Box p={4} bg="yellow.50" borderRadius="md">
                    <Text mb={4}>
                      Para realizar uma aposta, você precisa estar logado.
                    </Text>
                    <Stack direction="row" spacing={4}>
                      <Button colorScheme="blue" onClick={onLogin}>
                        Fazer Login
                      </Button>
                      <Button variant="outline" onClick={onRegister}>
                        Criar Conta
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Box>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Text fontWeight="bold">
                          Selecione {pool.numeroPalpites} números:
                        </Text>
                        <Tooltip label="Gerar números aleatórios">
                          <IconButton
                            icon={<RefreshCw size={20} />}
                            onClick={generateRandomNumbers}
                            aria-label="Gerar números aleatórios"
                          />
                        </Tooltip>
                      </Flex>
                      <NumberSelector
                        numeroInicial={pool.numeroInicial}
                        numeroFinal={pool.numeroFinal}
                        numeroPalpites={pool.numeroPalpites}
                        selectedNumbers={selectedNumbers}
                        onNumberSelect={handleNumberSelect}
                      />
                    </Box>

                    <FormControl isRequired>
                      <FormLabel>Nome Completo</FormLabel>
                      <Input
                        value={betForm.name}
                        onChange={(e) =>
                          setBetForm({ ...betForm, name: e.target.value })
                        }
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>WhatsApp</FormLabel>
                      <Input
                        type="tel"
                        value={betForm.whatsapp}
                        onChange={(e) =>
                          setBetForm({ ...betForm, whatsapp: e.target.value })
                        }
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>E-mail</FormLabel>
                      <Input
                        type="email"
                        value={betForm.email}
                        onChange={(e) =>
                          setBetForm({ ...betForm, email: e.target.value })
                        }
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Quantidade de Bilhetes</FormLabel>
                      <NumberInput
                        min={1}
                        value={quantity}
                        onChange={(value) => setQuantity(parseInt(value) || 1)}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontWeight="bold" mb={2}>
                        Resumo da Aposta
                      </Text>
                      <Text>
                        Números selecionados:{" "}
                        {selectedNumbers.length > 0
                          ? selectedNumbers.join(", ")
                          : "Nenhum número selecionado"}
                      </Text>
                      <Text>
                        Valor total:{" "}
                        {formatCurrency(
                          parseFloat(pool.entryValue) * quantity
                        )}
                      </Text>
                    </Box>

                    {error && (
                      <Box bg="red.50" p={4} borderRadius="md">
                        <Text color="red.500">{error}</Text>
                      </Box>
                    )}
                  </>
                )}
              </Stack>
            </ModalBody>

            <ModalFooter>
              {authState.isLoggedIn && (
                <>
                  <Button
                    colorScheme="green"
                    mr={3}
                    onClick={handleBetSubmit}
                    isLoading={loading}
                    loadingText="Processando..."
                    isDisabled={
                      loading ||
                      selectedNumbers.length !== pool.numeroPalpites ||
                      !betForm.name ||
                      !betForm.whatsapp ||
                      !betForm.email
                    }
                  >
                    Confirmar e Pagar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowBetModal(false)}
                    isDisabled={loading}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
};

export default PoolDetailsCard;