"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const API_URL = 'http://localhost:3001';

const NumberSelector = ({
  availableNumbers,
  numeroPalpites,
  selectedNumbers,
  onNumberSelect,
}) => {
  return (
    <SimpleGrid columns={10} spacing={2} mt={4}>
      {availableNumbers.map((number) => (
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

const PoolDetailsCard = ({ pool }) => {
  const [showBetModal, setShowBetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [tickets, setTickets] = useState([{ selectedNumbers: [] }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(pool?.participants || 0);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentId, setPaymentId] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle payment status from URL parameters on component mount
  useEffect(() => {
    const status = searchParams.get('status');
    const payment_id = searchParams.get('payment_id');
    
    if (status && payment_id) {
      handlePaymentReturn(status, payment_id);
    }
  }, [searchParams]);

  const handlePaymentReturn = async (status, payment_id) => {
    if (!paymentId) {
      // If we don't have a paymentId in state, the user might have refreshed the page
      // We can either show a message or redirect them to start over
      toast({
        title: "Sessão expirada",
        description: "Por favor, inicie uma nova aposta.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    switch (status.toLowerCase()) {
      case 'success':
      case 'approved':
        setPaymentStatus("success");
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        setTotalParticipants((prev) => prev + quantity);
        break;
      case 'pending':
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
          description: "O pagamento não foi aprovado. Por favor, tente novamente.",
          status: "error",
          duration: 5000,
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
  };

  useEffect(() => {
    let intervalId;

    const checkPaymentStatus = async () => {
      if (paymentId && paymentStatus === "processing") {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Token não encontrado");
          }

          const response = await axios.get(
            `${API_URL}/api/pagamentos/${paymentId}/status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.status === "confirmado") {
            setPaymentStatus("success");
            clearInterval(intervalId);
            setShowPaymentModal(false);
            setShowSuccessModal(true);
            setTotalParticipants((prev) => prev + quantity);
            
            // Fecha a aba de pagamento se ainda estiver aberta
            if (window.paymentWindow && !window.paymentWindow.closed) {
              window.paymentWindow.close();
            }
          } else if (response.data.status === "falha") {
            setPaymentStatus("failed");
            clearInterval(intervalId);
            toast({
              title: "Falha no pagamento",
              description: "O pagamento não foi aprovado. Tente novamente.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || "Erro ao verificar status do pagamento";
          setError(errorMessage);
          toast({
            title: "Erro na verificação",
            description: errorMessage,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    if (paymentStatus === "processing") {
      intervalId = setInterval(checkPaymentStatus, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paymentId, paymentStatus, quantity, toast]);

  const handleQuantityChange = (value) => {
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
  };

  const handleNumberSelect = (ticketIndex, number) => {
    setTickets((prevTickets) => {
      const newTickets = [...prevTickets];
      if (number === "generate") {
        const available = [...pool.availableNumbers];
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
  };

  const generateRandomNumbers = () => {
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
  };

  const validateForm = () => {
    if (!pool.numeroPalpites) {
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
      if (ticket.selectedNumbers.length !== pool.numeroPalpites) {
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
  };

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
      // Get the current URL to use as the base for return URLs
      const currentUrl = window.location.href.split('?')[0]; // Remove any existing query parameters

      const response = await axios.post(
        `${API_URL}/api/apostas/criar-aposta`,
        {
          jogo_id: pool.jog_id,
          bilhetes: tickets.map((ticket) => ({
            palpite_numbers: ticket.selectedNumbers,
          })),
          valor_total: parseFloat(pool.entryValue) * quantity,
          return_url: currentUrl, // Send the return URL to the backend
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.checkout_url && response.data.pagamentoId) {
        setPaymentId(response.data.pagamentoId);
        setCheckoutUrl(response.data.checkout_url);
        setPaymentStatus("processing");
        setShowBetModal(false);
        setShowPaymentModal(true);
        
        // Abre o Mercado Pago em uma nova aba
        window.paymentWindow = window.open(response.data.checkout_url, '_blank');
      } else {
        throw new Error("Resposta inválida da API");
      }
    } catch (error) {
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details ||
                          error.message ||
                          "Erro ao processar aposta";
      
      setError(errorMessage);
      toast({
        title: "Erro na Aposta",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowSuccessModal(false);
    setPaymentStatus("pending");
    setPaymentId(null);
    setCheckoutUrl(null);
    setTickets([{ selectedNumbers: [] }]);
    setQuantity(1);
  };

  const handleViewDetails = () => {
    router.push("/dashboard");
  };

  const getStatusColor = (status) => {
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
  };

  const getStatusText = (status) => {
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
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const reopenPaymentWindow = () => {
    if (checkoutUrl) {
      window.paymentWindow = window.open(checkoutUrl, '_blank');
    }
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

          {/* Datas e Regras */}
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
                {/* Formulário de Aposta */}
                <Stack spacing={4}>
                  {/* Quantidade de Bilhetes */}
                  <FormControl isRequired>
                    <FormLabel>Quantidade de Bilhetes</FormLabel>
                    <NumberInput
                      min={1}
                      max={10}
                      value={quantity}
                      onChange={handleQuantityChange}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  {/* Lista de Bilhetes */}
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
                          />
                        </Tooltip>
                      </Flex>

                      {/* Seleção de Números */}
                      <NumberSelector
                        availableNumbers={pool.availableNumbers}
                        numeroPalpites={pool.numeroPalpites}
                        selectedNumbers={ticket.selectedNumbers}
                        onNumberSelect={(number) => handleNumberSelect(index, number)}
                      />

                      {/* Exibir números selecionados */}
                      {ticket.selectedNumbers.length > 0 && (
                        <Box mt={2}>
                          <Text fontWeight="bold">Números selecionados:</Text>
                          <Text>{ticket.selectedNumbers.join(", ")}</Text>
                        </Box>
                      )}
                    </Box>
                  ))}

                  {/* Botão para Gerar Números Aleatórios para Todos os Bilhetes */}
                  <Button
                    leftIcon={<RefreshCw size={20} />}
                    onClick={generateRandomNumbers}
                    colorScheme="purple"
                    variant="outline"
                  >
                    Gerar Números Aleatórios para Todos
                  </Button>
                </Stack>

                {/* Resumo da Aposta */}
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

                {/* Exibição de Erro */}
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

        {/* Modal de Processamento do Pagamento */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          closeOnOverlayClick={false}
          closeOnEsc={false}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Processando Pagamento</ModalHeader>
            <ModalBody>
              <VStack spacing={6} align="center">
                {paymentStatus === "processing" && (
                  <>
                    <CircularProgress isIndeterminate color="green.300" />
                    <Text align="center" fontWeight="bold">
                      Aguardando confirmação do pagamento...
                    </Text>
                    <Text fontSize="sm" color="gray.600" align="center">
                      Uma nova aba foi aberta para realizar o pagamento via Mercado Pago.
                      Esta tela atualizará automaticamente quando o pagamento for confirmado.
                    </Text>
                    <Text fontSize="sm" color="gray.500" align="center">
                      Caso a aba tenha sido fechada acidentalmente, você pode reabri-la
                      clicando no botão abaixo:
                    </Text>
                    {checkoutUrl && (
                      <Button
                        colorScheme="blue"
                        onClick={reopenPaymentWindow}
                        size="lg"
                        width="full"
                      >
                        Reabrir Página de Pagamento
                      </Button>
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
                      Por favor, tente novamente.
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
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal de Sucesso */}
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
                    Parabéns! Seus {quantity} bilhete(s) foram confirmados e registrados no sistema.
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
                      window.location.reload();
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
  );
};

export default PoolDetailsCard;