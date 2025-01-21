"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Flex,
  Text,
  Stack,
  Container,
  useToast,
  Tooltip,
  IconButton,
  Select,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
} from "@chakra-ui/react";
import {
  CheckIcon,
  EmailIcon,
  ChatIcon,
} from "@chakra-ui/icons";

const Financeiro = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jogosEncerrados, setJogosEncerrados] = useState([]);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const [dadosFinanceiros, setDadosFinanceiros] = useState(null);
  const [dialogoConfirmacao, setDialogoConfirmacao] = useState({
    isOpen: false,
    dados: null,
  });
  const cancelRef = React.useRef();
  const toast = useToast();

  const handleSendEmail = async (premiado, categoria, email) => {
    try {
      const message = `Olá ${premiado.nome}, parabéns! Você foi premiado na categoria ${categoria.replace("_", " ")} no jogo ${selectedJogo.jog_nome}. Seu prêmio de R$ ${premiado.premio.toFixed(2)} está disponível.`;
  
      const response = await fetch(`/api/jogos/${selectedJogo.slug}/financeiro/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          tipoPremiacao: categoria,
          cli_id: premiado.cli_id,
          email: premiado.email,
        }),
      });
  
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Falha ao enviar e-mail.');
      }
  
      const result = await response.json();
  
      if (result.message === 'Notificação enviada com sucesso.') {
        toast({
          title: 'Sucesso',
          description: 'E-mail enviado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao enviar e-mail.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao enviar e-mail. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchJogosEncerrados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      const response = await fetch("/api/jogos/list?status=encerrado", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao carregar jogos encerrados"
        );
      }

      const data = await response.json();
      const jogosEncerrados = data.jogos.filter(
        (jogo) => jogo.jog_status === "encerrado"
      );

      setJogosEncerrados(jogosEncerrados);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Erro",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchDadosFinanceiros = async (slug) => {
    if (!slug) {
      setDadosFinanceiros(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      const response = await fetch(`/api/jogos/${slug}/financeiro`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao carregar dados financeiros"
        );
      }

      const data = await response.json();
      setDadosFinanceiros(data.financeiro);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Erro",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJogosEncerrados();
  }, [fetchJogosEncerrados]);

  const handleJogoChange = (e) => {
    const jogoSelecionado = jogosEncerrados.find(
      (jogo) => jogo.slug === e.target.value
    );
    setSelectedJogo(jogoSelecionado);
    fetchDadosFinanceiros(e.target.value);
  };

  const abrirConfirmacaoPagamento = (categoria, cli_id) => {
    if (!categoria || !cli_id) {
      toast({
        title: "Erro",
        description: "Dados inválidos para confirmar pagamento",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setDialogoConfirmacao({
      isOpen: true,
      dados: { categoria, cli_id },
    });
  };

  const fecharConfirmacaoPagamento = () => {
    setDialogoConfirmacao({ isOpen: false, dados: null });
  };

  const confirmarPagamento = async () => {
    if (!dialogoConfirmacao.dados || !selectedJogo) {
      fecharConfirmacaoPagamento();
      return;
    }

    try {
      const { categoria, cli_id } = dialogoConfirmacao.dados;

      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/jogos/${selectedJogo.slug}/financeiro/pagamento`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cli_id,
            categoriaPremio: categoria,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao marcar pagamento");
      }

      await fetchDadosFinanceiros(selectedJogo.slug);
      toast({
        title: "Sucesso",
        description: "Pagamento marcado como realizado com sucesso.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      fecharConfirmacaoPagamento();
    }
  };

  if (loading && !dadosFinanceiros) {
    return (
      <Container maxW="container.xl" py={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      </Container>
    );
  }

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  return (
    <Container maxW="container.xl" py={6}>
      <Stack spacing={8}>
        <Box>
          <Heading size="lg" mb={4}>
            Financeiro
          </Heading>
          <Select
            placeholder="Selecione um jogo encerrado"
            onChange={handleJogoChange}
            value={selectedJogo?.slug || ""}
            mb={6}
          >
            {jogosEncerrados.map((jogo) => (
              <option key={jogo.slug} value={jogo.slug}>
                {jogo.jog_nome || "Jogo sem nome"} -{" "}
                {new Date(jogo.jog_datamodificacao).toLocaleDateString()}
              </option>
            ))}
          </Select>
        </Box>
        {error && (
          <Box p={4} borderRadius="md" bg="red.50">
            <Text color="red.500">{error}</Text>
            <Button
              mt={4}
              colorScheme="blue"
              onClick={() =>
                selectedJogo && fetchDadosFinanceiros(selectedJogo.slug)
              }
            >
              Tentar Novamente
            </Button>
          </Box>
        )}

        {dadosFinanceiros && (
          <>
            <StatGroup>
              <Stat>
                <StatLabel>Total Arrecadado</StatLabel>
                <StatNumber>
                  {formatarMoeda(dadosFinanceiros.total_arrecadado || 0)}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Custos Administrativos</StatLabel>
                <StatNumber>
                  {formatarMoeda(dadosFinanceiros.custos_administrativos || 0)}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Valor Líquido para Premiação</StatLabel>
                <StatNumber>
                  {formatarMoeda(dadosFinanceiros.valor_liquido_premiacao || 0)}
                </StatNumber>
              </Stat>
            </StatGroup>

            {dadosFinanceiros.premiacoes_totais && (
              <Box>
                <Heading size="sm" mb={4}>
                  Distribuição das Premiações
                </Heading>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={4}
                >
                  {Object.entries(dadosFinanceiros.premiacoes_totais).map(
                    ([categoria, valor]) => (
                      <Box
                        key={categoria}
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                      >
                        <Text fontWeight="bold">
                          {categoria.replace("_", " ").toUpperCase()}
                        </Text>
                        <Text>{formatarMoeda(valor || 0)}</Text>
                      </Box>
                    )
                  )}
                </Grid>
              </Box>
            )}

            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Categoria</Th>
                    <Th>Nome</Th>
                    <Th>Email</Th>
                    <Th>Telefone</Th>
                    <Th>Prêmio</Th>
                    <Th>Status</Th>
                    <Th>Método de Pagamento</Th>
                    <Th>Status do Pagamento</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dadosFinanceiros.premiacoes &&
                    Object.entries(dadosFinanceiros.premiacoes).map(
                      ([categoria, premiados]) =>
                        premiados.map((premiado, index) => (
                          <Tr key={`${categoria}-${premiado.cli_id}-${index}`}>
                            <Td>{categoria.replace("_", " ").toUpperCase()}</Td>
                            <Td>{premiado.nome}</Td>
                            <Td>{premiado.email}</Td>
                            <Td>{premiado.telefone}</Td>
                            <Td>{formatarMoeda(premiado.premio || 0)}</Td>
                            <Td>
                              <Badge 
                                colorScheme={premiado.pago ? "green" : "yellow"} 
                                variant="subtle" 
                                fontSize="0.8em" 
                                px={2}
                              >
                                {premiado.pago ? "Pago" : "Pendente"}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  premiado.MetodoPagamento === "mercado_pago" ? "blue" : 
                                  premiado.MetodoPagamento === "manual_superadmin" ? "purple" : "gray"
                                }
                                variant="outline" 
                                fontSize="0.8em" 
                                px={2}
                              >
                                {premiado.MetodoPagamento === "mercado_pago" ? "Mercado Pago" : 
                                 premiado.MetodoPagamento === "manual_superadmin" ? "Admin Manual" : "N/A"}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  premiado.statusPago === "confirmada"
                                    ? "green"
                                    : premiado.statusPago === "pendente"
                                    ? "yellow"
                                    : "gray"
                                }
                                variant="subtle" 
                                fontSize="0.8em" 
                                px={2}
                              >
                                {premiado.statusPago === "confirmada" ? "Confirmado" : 
                                 premiado.statusPago === "pendente" ? "Pendente" : "N/A"}
                              </Badge>
                            </Td>
                            <Td>
                              <Flex gap={2} justifyContent="center">
                                {!premiado.pago && (
                                  <IconButton
                                    size="xs"
                                    colorScheme="green"
                                    aria-label="Marcar como Pago"
                                    icon={<CheckIcon />}
                                    onClick={() => 
                                      abrirConfirmacaoPagamento(categoria, premiado.cli_id)
                                    }
                                  />
                                )}
                                <Tooltip label="Enviar Email">
                                  <IconButton
                                    size="xs"
                                    colorScheme="blue"
                                    aria-label="Enviar Email"
                                    icon={<EmailIcon />}
                                    onClick={() => 
                                      handleSendEmail(premiado, categoria, premiado.email)
                                    }
                                  />
                                </Tooltip>
                                <Tooltip label="Enviar WhatsApp">
                                  <a
                                    href={`https://wa.me/+55${premiado.telefone.replace(
                                      /\D/g,
                                      ""
                                    )}?text=${encodeURIComponent(
                                      `Olá ${premiado.nome}, parabéns pela premiação na categoria ${categoria.replace("_", " ").toUpperCase()}!`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <IconButton
                                      size="xs"
                                      colorScheme="green"
                                      aria-label="Enviar WhatsApp"
                                      icon={<ChatIcon />}
                                      as="span"
                                    />
                                  </a>
                                </Tooltip>
                              </Flex>
                            </Td>
                          </Tr>
                        ))
                    )}
                </Tbody>
              </Table>
            </Box>
          </>
        )}
      </Stack>

      <AlertDialog
        isOpen={dialogoConfirmacao.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={fecharConfirmacaoPagamento}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Pagamento
            </AlertDialogHeader>
            <AlertDialogBody>
              Tem certeza que deseja marcar este pagamento como realizado? Esta
              ação não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={fecharConfirmacaoPagamento}>
                Cancelar
              </Button>
              <Button colorScheme="green" onClick={confirmarPagamento} ml={3}>
                Confirmar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Financeiro;