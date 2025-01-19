"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import axios from 'axios';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import Script from 'next/script';
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  VStack,
  HStack,
  CircularProgress,
} from "@chakra-ui/react";
import {
  FaTicketAlt,
  FaDice,
  FaUsers,
  FaMoneyBill,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'TEST-176fcf8a-9f5a-415b-ad11-4889e6686858';
const PAYMENT_CHECK_INTERVAL = 5000;
const MAX_PAYMENT_CHECKS = 60;

const initializeMercadoPago = async (retryCount = 0, maxRetries = 3) => {
  try {
    await initMercadoPago(MP_PUBLIC_KEY, {
      locale: 'pt-BR'
    });
    return true;
  } catch (error) {
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      return initializeMercadoPago(retryCount + 1, maxRetries);
    }
    return false;
  }
};

const NumberSelector = ({
  availableNumbers,
  numeroPalpites,
  selectedNumbers,
  onNumberSelect,
  disabled = false
}) => {
  return (
    <SimpleGrid columns={10} spacing={2} mt={4}>
      {availableNumbers.map((number) => (
        <Checkbox
          key={number}
          isChecked={selectedNumbers.includes(number)}
          onChange={() => onNumberSelect(number)}
          isDisabled={disabled || (selectedNumbers.length >= numeroPalpites && !selectedNumbers.includes(number))}
        >
          {number}
        </Checkbox>
      ))}
    </SimpleGrid>
  );
};

const PoolDetailsCard = ({ pool }) => {
  const [showBetModal, setShowBetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState([{ selectedNumbers: [] }]);
  const [quantity, setQuantity] = useState(1);
  const [submittedQuantity, setSubmittedQuantity] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(pool?.participants || 0);
  const [mpInitialized, setMpInitialized] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const init = async () => {
      if (!mpInitialized) {
        const success = await initializeMercadoPago();
        if (success) {
          setMpInitialized(true);
        } else {
          toast({
            title: "Erro na inicialização",
            description: "Não foi possível inicializar o sistema de pagamento. Tente recarregar a página.",
            status: "error",
            duration: 10000,
            isClosable: true,
          });
        }
      }
    };

    init();
  }, [mpInitialized, toast]);

  const handlePaymentReturn = useCallback((status, paymentId) => {
    setPaymentId(paymentId);

    switch (status.toLowerCase()) {
      case 'approved':
        setPaymentStatus("success");
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        setTotalParticipants((prev) => prev + submittedQuantity);
        break;
      case 'pending':
        setPaymentStatus("processing");
        setShowPaymentModal(true);
        toast({
          title: "Pagamento Pendente",
          description: "Seu pagamento está sendo processado. Você receberá uma confirmação em breve.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        break;
      case 'failure':
      case 'rejected':
        setPaymentStatus("failed");
        toast({
          title: "Falha no pagamento",
          description: "O pagamento não foi aprovado. Por favor, tente novamente com outro método de pagamento.",
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        break;
      default:
        toast({
          title: "Status desconhecido",
          description: "Por favor, verifique o status do seu pagamento no painel.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
    }
  }, [submittedQuantity, toast]);

  useEffect(() => {
    const status = searchParams.get('status');
    const payment_id = searchParams.get('payment_id');
    
    if (status && payment_id) {
      handlePaymentReturn(status, payment_id);
    }
  }, [searchParams, handlePaymentReturn]);

  useEffect(() => {
    let intervalId;

    const checkPaymentStatus = async () => {
      if (paymentId && paymentStatus === "processing" && checkCount < MAX_PAYMENT_CHECKS) {
        try {
          setIsProcessingPayment(true);
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Token não encontrado");
          }

          const response = await axios.get(
            `${API_URL}/pagamentos/${paymentId}/status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 10000,
            }
          );

          if (response.data.status === "confirmado") {
            setPaymentStatus("success");
            setShowPaymentModal(false);
            setShowSuccessModal(true);
            setTotalParticipants((prev) => prev + submittedQuantity);
          } else if (response.data.status === "falha") {
            setPaymentStatus("failed");
            throw new Error("Pagamento não aprovado");
          }

          setCheckCount(prev => prev + 1);
        } catch (error) {
          if (checkCount >= MAX_PAYMENT_CHECKS) {
            setPaymentStatus("timeout");
            toast({
              title: "Tempo limite excedido",
              description: "Não foi possível confirmar o status do pagamento. Verifique seu email ou entre em contato com o suporte.",
              status: "warning",
              duration: 10000,
              isClosable: true,
            });
          } else if (error.response?.status === 401) {
            toast({
              title: "Sessão expirada",
              description: "Por favor, faça login novamente.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            router.push("/login");
          } else {
            toast({
              title: "Erro na verificação",
              description: "Não foi possível verificar o status do pagamento. Tentando novamente...",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        } finally {
          setIsProcessingPayment(false);
        }
      }
    };

    if (paymentStatus === "processing" && !isProcessingPayment) {
      intervalId = setInterval(checkPaymentStatus, PAYMENT_CHECK_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paymentId, paymentStatus, checkCount, submittedQuantity, toast, router, isProcessingPayment]);

  const handleQuantityChange = useCallback((value) => {
    const qty = parseInt(value) || 1;
    setQuantity(qty);
    setTickets((prevTickets) => {
      const newTickets = [...prevTickets];
      if (qty > prevTickets.length) {
        for (let i = prevTickets.length; i < qty; i++) {
          newTickets.push({ selectedNumbers: [] });
        }
      } else if (qty < prevTickets.length) {
        newTickets.length = qty;
      }
      return newTickets;
    });
  }, []);

  const handleNumberSelect = useCallback((ticketIndex, number) => {
    if (!pool?.numeroPalpites) return;

    setTickets((prevTickets) => {
      const newTickets = [...prevTickets];
      if (number === "generate") {
        const available = [...(pool.availableNumbers || [])];
        const numbers = [];
        while (numbers.length < pool.numeroPalpites && available.length > 0) {
          const randomIndex = Math.floor(Math.random() * available.length);
          numbers.push(available[randomIndex]);
          available.splice(randomIndex, 1);
        }
        newTickets[ticketIndex].selectedNumbers = numbers.sort((a, b) => a - b);
      } else {
        const selectedNumbers = newTickets[ticketIndex].selectedNumbers;
        if (selectedNumbers.includes(number)) {
          newTickets[ticketIndex].selectedNumbers = selectedNumbers.filter(
            (n) => n !== number
          );
        } else {
          if (selectedNumbers.length < pool.numeroPalpites) {
            newTickets[ticketIndex].selectedNumbers = [
              ...selectedNumbers,
              number,
            ].sort((a, b) => a - b);
          }
        }
      }
      return newTickets;
    });
  }, [pool?.numeroPalpites, pool?.availableNumbers]);

  const generateRandomNumbers = useCallback(() => {
    if (!pool?.numeroPalpites || !pool?.availableNumbers) return;

    setTickets((prevTickets) =>
      prevTickets.map((ticket) => {
        const available = [...pool.availableNumbers];
        const numbers = [];
        while (numbers.length < pool.numeroPalpites && available.length > 0) {
          const randomIndex = Math.floor(Math.random() * available.length);
          numbers.push(available[randomIndex]);
          available.splice(randomIndex, 1);
        }
        return { ...ticket, selectedNumbers: numbers.sort((a, b) => a - b) };
      })
    );
  }, [pool?.numeroPalpites, pool?.availableNumbers]);

  const validateForm = useCallback(() => {
    if (!pool?.numeroPalpites) {
      toast({
        title: "Erro de configuração",
        description: "Número de palpites não definido no jogo",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (!ticket.selectedNumbers || ticket.selectedNumbers.length !== pool.numeroPalpites) {
        toast({
          title: "Seleção Incompleta",
          description: `O bilhete ${i + 1} deve ter exatamente ${pool.numeroPalpites} números selecionados.`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    }

    return true;
  }, [pool?.numeroPalpites, tickets, toast]);

  const handleBetSubmit = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Autenticação Necessária",
        description: "Por favor, faça login para realizar uma aposta.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const valorTotal = parseFloat(pool.entryValue) * quantity;
      if (isNaN(valorTotal) || valorTotal <= 0) {
        throw new Error("Valor total inválido");
      }

      const response = await axios.post(
        `${API_URL}/apostas/criar-aposta`,
        {
          jogo_id: pool.jog_id,
          bilhetes: tickets.map((ticket) => ({
            palpite_numbers: ticket.selectedNumbers,
          })),
          valor_total: valorTotal,
          return_url: `${window.location.origin}/bolao/${pool.slug}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      if (!response.data.preference_id || !response.data.pagamentoId) {
        throw new Error("Resposta inválida da API");
      }

      setSubmittedQuantity(quantity);
      setPaymentId(response.data.pagamentoId);
      setPreferenceId(response.data.preference_id);
      setPaymentStatus("processing");
      setShowBetModal(false);
      setShowPaymentModal(true);
      setCheckCount(0);

    } catch (error) {
      let errorMessage = "Erro ao processar aposta. Tente novamente.";
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data.details || error.response.data.error || "Dados inválidos na aposta";
            break;
          case 401:
            errorMessage = "Sessão expirada. Por favor, faça login novamente.";
            router.push("/login");
            break;
          case 403:
            errorMessage = "Você não tem permissão para realizar esta aposta.";
            break;
          case 404:
            errorMessage = "Jogo não encontrado ou não está mais disponível.";
            break;
          case 409:
            errorMessage = "Esta aposta já foi processada ou está em conflito.";
            break;
          case 422:
            errorMessage = "Dados inválidos ou incompletos na aposta.";
            break;
          case 429:
            errorMessage = "Muitas tentativas. Por favor, aguarde alguns minutos.";
            break;
          default:
            errorMessage = error.response.data.error || "Erro no servidor. Tente novamente.";
        }
      } else if (error.request) {
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão.";
      }

      setError(errorMessage);
      toast({
        title: "Erro na Aposta",
        description: errorMessage,
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    setShowSuccessModal(false);
    setPaymentStatus("pending");
    setPaymentId(null);
    setPreferenceId(null);
    setTickets([{ selectedNumbers: [] }]);
    setQuantity(1);
    setSubmittedQuantity(null);
    setCheckCount(0);
  }, []);

  const handleViewDetails = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "aberto":
        return "green";
      case "fechado":
        return "orange";
      case "encerrado":
        return "red";
      default:
        return "gray";
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "aberto":
        return "Aberto para apostas";
      case "fechado":
        return "Apostas encerradas";
      case "encerrado":
        return "Concurso finalizado";
      default:
        return "Status desconhecido";
    }
  }, []);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  if (!pool) {
    return (
      <Card>
        <CardBody>
          <Flex justify="center" align="center" p={8}>
            <CircularProgress isIndeterminate color="green.300" />
            <Text ml={4}>Carregando dados do bolão...</Text>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Script 
        src="https://sdk.mercadopago.com/js/v2" 
        strategy="lazyOnload"
        onLoad={() => {
          setMpInitialized(true);
        }}
        onError={(e) => {
          toast({
            title: "Erro no sistema de pagamento",
            description: "Não foi possível carregar o sistema de pagamento. Tente recarregar a página.",
            status: "error",
            duration: 8000,
            isClosable: true,
          });
        }}
      />

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
                  <FaDice color="gray" />
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

            <Stack spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Regras do Jogo:
                </Text>
                <Text>
                  • Selecione {pool.numeroPalpites} números diferentes
                </Text>
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

          {pool.status === "aberto" && (
            <Button
              colorScheme="green"
              size="lg"
              width="full"
              onClick={() => setShowBetModal(true)}
              isDisabled={loading || !mpInitialized}
            >
              {!mpInitialized ? "Carregando sistema de pagamento..." : "Fazer Aposta"}
            </Button>
          )}

          <Modal
            isOpen={showBetModal}
            onClose={() => !loading && setShowBetModal(false)}
            closeOnOverlayClick={!loading}
            closeOnEsc={!loading}
            size="xl"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Realizar Aposta</ModalHeader>
              {!loading && <ModalCloseButton />}
              <ModalBody>
                <Stack spacing={6}>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Quantidade de Bilhetes</FormLabel>
                      <NumberInput
                        min={1}
                        max={100}
                        value={quantity}
                        onChange={handleQuantityChange}
                        isDisabled={loading}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    {tickets.map((ticket, index) => (
                      <Box
                        key={index}
                        p={4}
                        bg="gray.50"
                        borderRadius="md"
                        border="1px"
                        borderColor="gray.200"
                      >
                        <Flex justify="space-between" align="center" mb={4}>
                          <Text fontWeight="bold">
                            Bilhete {index + 1}
                          </Text>
                          <Tooltip label="Gerar números aleatórios para este bilhete">
                            <IconButton
                              icon={<RefreshCw size={20} />}
                              onClick={() => handleNumberSelect(index, "generate")}
                              aria-label="Gerar números aleatórios"
                              isDisabled={loading}
                            />
                          </Tooltip>
                        </Flex>

                        <NumberSelector
                          availableNumbers={pool.availableNumbers}
                          numeroPalpites={pool.numeroPalpites}
                          selectedNumbers={ticket.selectedNumbers}
                          onNumberSelect={(number) => handleNumberSelect(index, number)}
                          disabled={loading}
                        />

                        {ticket.selectedNumbers.length > 0 && (
                          <Box mt={2}>
                            <Text fontWeight="bold">Números selecionados:</Text>
                            <Text>{ticket.selectedNumbers.join(", ")}</Text>
                          </Box>
                        )}
                      </Box>
                    ))}

                    <Button
                      leftIcon={<RefreshCw size={20} />}
                      onClick={generateRandomNumbers}
                      colorScheme="purple"
                      variant="outline"
                      isDisabled={loading}
                    >
                      Gerar Números Aleatórios para Todos
                    </Button>
                  </Stack>

                  <Box bg="gray.50" p={4} borderRadius="md" mt={6}>
                    <Text fontWeight="bold" mb={2}>
                      Resumo da Aposta
                    </Text>
                    <Text>
                      Quantidade de Bilhetes: {quantity}
                    </Text>
                    <Text>
                      Valor total: {formatCurrency(parseFloat(pool.entryValue) * quantity)}
                    </Text>
                  </Box>

                  {error && (
                    <Box bg="red.50" p={4} borderRadius="md" mt={4}>
                      <Text color="red.500">{error}</Text>
                    </Box>
                  )}
                </Stack>
              </ModalBody>

              <ModalFooter>
                <Button
                  colorScheme="green"
                  mr={3}
                  onClick={handleBetSubmit}
                  isLoading={loading}
                  loadingText="Processando..."
                  isDisabled={
                    loading ||
                    !mpInitialized ||
                    tickets.some(
                      (ticket) =>
                        ticket.selectedNumbers.length !== pool.numeroPalpites
                    )
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
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={showPaymentModal}
            onClose={() => paymentStatus !== "processing" && setShowPaymentModal(false)}
            closeOnOverlayClick={false}
            closeOnEsc={false}
            size="xl"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                {paymentStatus === "processing" 
                  ? "Processando Pagamento" 
                  : paymentStatus === "timeout"
                  ? "Tempo Limite Excedido"
                  : "Status do Pagamento"}
              </ModalHeader>
              <ModalBody>
                <VStack spacing={6} align="center">
                  {paymentStatus === "processing" && (
                    <>
                      <CircularProgress isIndeterminate color="green.300" />
                      <Text align="center" fontWeight="bold">
                        Aguardando confirmação do pagamento...
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Não feche esta janela até a confirmação do pagamento.
                      </Text>
                      {preferenceId && mpInitialized && (
                        <Box w="100%" id="wallet_container">
                          <Wallet 
                            initialization={{ preferenceId }}
                            customization={{
                              texts: {
                                action: 'buy',
                                valueProp: 'smart_option'
                              },
                              visual: {
                                buttonBackground: 'default',
                                borderRadius: '6px'
                              }
                            }}
                          />
                        </Box>
                      )}
                    </>
                  )}

                  {paymentStatus === "failed" && (
                    <>
                      <FaTimesCircle size={50} color="red" />
                      <Text fontWeight="bold" fontSize="xl">
                        Falha no pagamento
                      </Text>
                      <Text fontSize="md" color="gray.600" align="center">
                        Não foi possível confirmar seu pagamento.
                        Por favor, tente novamente com outro método de pagamento.
                      </Text>
                      <Button
                        colorScheme="red"
                        onClick={() => setShowPaymentModal(false)}
                        size="lg"
                        width="full"
                      >
                        Fechar
                      </Button>
                    </>
                  )}

                  {paymentStatus === "timeout" && (
                    <>
                      <FaTimesCircle size={50} color="orange" />
                      <Text fontWeight="bold" fontSize="xl">
                        Tempo Limite Excedido
                      </Text>
                      <Text fontSize="md" color="gray.600" align="center">
                        Não foi possível confirmar o status do seu pagamento no tempo esperado.
                        Você receberá uma confirmação por email assim que o pagamento for processado.
                      </Text>
                      <VStack spacing={4} width="full">
                        <Button
                          colorScheme="blue"
                          onClick={handleViewDetails}
                          size="lg"
                          width="full"
                        >
                          Ver Meus Bilhetes
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowPaymentModal(false);
                            setPaymentStatus("pending");
                          }}
                          size="lg"
                          width="full"
                        >
                          Fechar
                        </Button>
                      </VStack>
                    </>
                  )}
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={showSuccessModal}
            onClose={() => handlePaymentSuccess()}
            closeOnOverlayClick={false}
            closeOnEsc={false}
            size="lg"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Pagamento Confirmado!</ModalHeader>
              <ModalBody>
                <VStack spacing={8} align="center" py={6}>
                  <FaCheckCircle size={80} color="green" />
                  <VStack spacing={3}>
                    <Heading size="lg" textAlign="center" color="green.500">
                      Sua aposta foi registrada com sucesso!
                    </Heading>
                    <Text fontSize="md" textAlign="center" color="gray.600">
                      Parabéns! Seus {submittedQuantity} bilhete(s) foram confirmados e registrados no sistema.
                    </Text>
                    <Text fontSize="sm" textAlign="center" color="gray.500">
                      Você pode acompanhar seus bilhetes e resultados no painel do usuário.
                    </Text>
                  </VStack>
                  <HStack spacing={4}>
                    <Button
                      colorScheme="green"
                      size="lg"
                      onClick={() => {
                        handlePaymentSuccess();
                        window.location.href = `${window.location.origin}/bolao/${pool.slug}`;
                      }}
                    >
                      Fazer Nova Aposta
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="blue"
                      size="lg"
                      onClick={handleViewDetails}
                    >
                      Ver Meus Bilhetes
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </CardBody>
      </Card>
    </>
  );
};

export default PoolDetailsCard;