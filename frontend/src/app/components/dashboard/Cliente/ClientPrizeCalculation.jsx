// frontend/src/app/components/dashboard/Client/ClientPrizeCalculation.jsx

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Heading,
  Select,
  Button,
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Container,
  Stack,
  Badge,
  Card,
  CardHeader,
  CardBody,
  TableContainer,
  Skeleton,
  Icon,
  HStack,
  VStack,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
} from "@chakra-ui/react";
import { FaCalculator, FaSearch } from "react-icons/fa";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ClientPrizeCalculation = () => {
  const ITEMS_PER_PAGE = 50;
  const toast = useToast();

  const [jogos, setJogos] = useState([]);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const [resultadoPremiacao, setResultadoPremiacao] = useState(null);
  const [sorteios, setSorteios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [searchCampeao, setSearchCampeao] = useState("");
  const [sortCampeao, setSortCampeao] = useState("desc");
  const [currentPageCampeao, setCurrentPageCampeao] = useState(1);

  const [searchVice, setSearchVice] = useState("");
  const [sortVice, setSortVice] = useState("desc");
  const [currentPageVice, setCurrentPageVice] = useState(1);

  const [searchUltimo, setSearchUltimo] = useState("");
  const [sortUltimo, setSortUltimo] = useState("desc");
  const [currentPageUltimo, setCurrentPageUltimo] = useState(1);

  const [searchHistorico, setSearchHistorico] = useState("");
  const [sortHistorico, setSortHistorico] = useState("asc");
  const [currentPageHistorico, setCurrentPageHistorico] = useState(1);

  const [searchApostas, setSearchApostas] = useState("");
  const [sortApostas, setSortApostas] = useState("desc");
  const [currentPageApostas, setCurrentPageApostas] = useState(1);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return "N/A";
    return format(parsedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatCurrency = (value) => {
    if (typeof value !== "number") return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const renderDuplicatedNumber = (numero, sorteio) => {
    const isDuplicated = sorteio.numerosDuplicados?.includes(numero);
    return (
      <Tooltip
        key={`${sorteio.sorteio_id}-${numero}`}
        label={
          isDuplicated
            ? "Número duplicado de sorteios anteriores"
            : "Número único"
        }
        placement="top"
      >
        <Badge
          colorScheme={isDuplicated ? "red" : "green"}
          px={2}
          py={1}
          borderRadius="md"
        >
          {numero}
        </Badge>
      </Tooltip>
    );
  };

  const renderDetalhesDuplicacoes = (duplicacoesDetalhadas) => {
    if (!duplicacoesDetalhadas?.length) return null;
    return duplicacoesDetalhadas.map((dup, idx) => (
      <Text key={idx} fontSize="sm" color="gray.600">
        Duplicados do sorteio {dup.ordemSorteio} ({dup.descricao}):{" "}
        {dup.numerosDuplicados.join(", ")}
      </Text>
    ));
  };

  const processarDuplicacoes = (sorteiosData) => {
    return sorteiosData.map((sorteioAtual, indexAtual) => {
      const duplicacoes = sorteiosData
        .slice(indexAtual + 1)
        .map((sorteioAnterior, idx) => {
          const numerosDuplicados = sorteioAtual.numerosArray.filter((num) =>
            sorteioAnterior.numerosArray.includes(num)
          );
          if (numerosDuplicados.length > 0) {
            return {
              sorteioId: sorteioAnterior.sorteio_id,
              descricao: sorteioAnterior.descricao,
              numerosDuplicados,
              ordemSorteio: sorteiosData.length - (indexAtual + idx + 1),
            };
          }
          return null;
        })
        .filter(Boolean);
      return {
        ...sorteioAtual,
        duplicacoesDetalhadas: duplicacoes,
        numerosDuplicados: [
          ...new Set(duplicacoes.flatMap((dup) => dup.numerosDuplicados)),
        ],
      };
    });
  };

  const fetchSorteios = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/jogos/${selectedJogo.slug}/lottery`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const sorteiosOrdenados = response.data.sorteios.sort(
        (a, b) => new Date(b.dataSorteio) - new Date(a.dataSorteio)
      );
      setSorteios(processarDuplicacoes(sorteiosOrdenados));
    } catch (error) {
      toast({
        title: "Erro ao buscar sorteios",
        description: error.response?.data?.error || "Erro desconhecido",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedJogo, toast]);

  useEffect(() => {
    if (selectedJogo) fetchSorteios();
  }, [selectedJogo, fetchSorteios]);

  const fetchJogos = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }
      const response = await axios.get("/api/jogos/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJogos(response.data.jogos);
    } catch (error) {
      toast({
        title: "Erro ao buscar jogos",
        description:
          error.response?.data?.error || "Ocorreu um erro ao buscar os jogos.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSelectJogo = (e) => {
    const jogoId = e.target.value;
    const jogo = jogos.find((j) => j.jog_id === jogoId);
    setSelectedJogo(jogo);
    setResultadoPremiacao(null);
    setSearchCampeao("");
    setSortCampeao("desc");
    setCurrentPageCampeao(1);
    setSearchVice("");
    setSortVice("desc");
    setCurrentPageVice(1);
    setSearchUltimo("");
    setSortUltimo("desc");
    setCurrentPageUltimo(1);
    setSearchHistorico("");
    setSortHistorico("asc");
    setCurrentPageHistorico(1);
    setSearchApostas("");
    setSortApostas("desc");
    setCurrentPageApostas(1);
  };

  const processarPremiacao = async () => {
    if (!selectedJogo) {
      toast({
        title: "Jogo não selecionado",
        description: "Por favor, selecione um jogo para processar a premiação.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }
      const response = await axios.post(
        `/api/jogos/${selectedJogo.slug}/process-premiacao-client`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.premiacoes) {
        setResultadoPremiacao(response.data);
        toast({
          title: "Premiação processada com sucesso",
          description: "Os prêmios foram calculados com sucesso.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      toast({
        title: "Erro ao processar premiação",
        description:
          error.response?.data?.error ||
          "Ocorreu um erro ao processar a premiação.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  // Memoized filter and sort functions for each category
  const filteredCampeao = useMemo(() => {
    if (!resultadoPremiacao) return [];
    return resultadoPremiacao.premiacoes.campeao.filter((ganhador) =>
      ganhador.nome.toLowerCase().includes(searchCampeao.toLowerCase())
    );
  }, [resultadoPremiacao, searchCampeao]);

  const sortedCampeao = useMemo(() => {
    return [...filteredCampeao].sort((a, b) =>
      sortCampeao === "asc" ? a.pontos - b.pontos : b.pontos - a.pontos
    );
  }, [filteredCampeao, sortCampeao]);

  const paginatedCampeao = useMemo(() => {
    const start = (currentPageCampeao - 1) * ITEMS_PER_PAGE;
    return sortedCampeao.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCampeao, currentPageCampeao]);

  const totalPagesCampeao = Math.ceil(sortedCampeao.length / ITEMS_PER_PAGE);

  // Vice-campeões
  const filteredVice = useMemo(() => {
    if (!resultadoPremiacao) return [];
    return resultadoPremiacao.premiacoes.vice.filter((ganhador) =>
      ganhador.nome.toLowerCase().includes(searchVice.toLowerCase())
    );
  }, [resultadoPremiacao, searchVice]);

  const sortedVice = useMemo(() => {
    return [...filteredVice].sort((a, b) =>
      sortVice === "asc" ? a.pontos - b.pontos : b.pontos - a.pontos
    );
  }, [filteredVice, sortVice]);

  const paginatedVice = useMemo(() => {
    const start = (currentPageVice - 1) * ITEMS_PER_PAGE;
    return sortedVice.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedVice, currentPageVice]);

  const totalPagesVice = Math.ceil(sortedVice.length / ITEMS_PER_PAGE);

  // Últimos colocados
  const filteredUltimo = useMemo(() => {
    if (!resultadoPremiacao) return [];
    return resultadoPremiacao.premiacoes.ultimoColocado.filter((ganhador) =>
      ganhador.nome.toLowerCase().includes(searchUltimo.toLowerCase())
    );
  }, [resultadoPremiacao, searchUltimo]);

  const sortedUltimo = useMemo(() => {
    return [...filteredUltimo].sort((a, b) =>
      sortUltimo === "asc" ? a.pontos - b.pontos : b.pontos - a.pontos
    );
  }, [filteredUltimo, sortUltimo]);

  const paginatedUltimo = useMemo(() => {
    const start = (currentPageUltimo - 1) * ITEMS_PER_PAGE;
    return sortedUltimo.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedUltimo, currentPageUltimo]);

  const totalPagesUltimo = Math.ceil(sortedUltimo.length / ITEMS_PER_PAGE);

  // Histórico de sorteios
  const filteredHistorico = useMemo(() => {
    if (!resultadoPremiacao) return [];
    return resultadoPremiacao.historicoSorteios.filter((sorteio) =>
      sorteio.descricao.toLowerCase().includes(searchHistorico.toLowerCase())
    );
  }, [resultadoPremiacao, searchHistorico]);

  const sortedHistorico = useMemo(() => {
    return [...filteredHistorico].sort((a, b) =>
      sortHistorico === "asc"
        ? new Date(a.data_sorteio) - new Date(b.data_sorteio)
        : new Date(b.data_sorteio) - new Date(a.data_sorteio)
    );
  }, [filteredHistorico, sortHistorico]);

  const paginatedHistorico = useMemo(() => {
    const start = (currentPageHistorico - 1) * ITEMS_PER_PAGE;
    return sortedHistorico.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedHistorico, currentPageHistorico]);

  const totalPagesHistorico = Math.ceil(sortedHistorico.length / ITEMS_PER_PAGE);

  // Apostas
  const filteredApostas = useMemo(() => {
    if (!resultadoPremiacao) return [];
    return resultadoPremiacao.resultadosApostas.filter((aposta) => {
      const nomeMatch = aposta.nome
        ? aposta.nome.toLowerCase().includes(searchApostas.toLowerCase())
        : false;
      const numerosMatch = aposta.palpite_numbers
        .join(", ")
        .toLowerCase()
        .includes(searchApostas.toLowerCase());
      return nomeMatch || numerosMatch;
    });
  }, [resultadoPremiacao, searchApostas]);

  const sortedApostas = useMemo(() => {
    return [...filteredApostas].sort((a, b) =>
      sortApostas === "asc"
        ? a.pontos_totais - b.pontos_totais
        : b.pontos_totais - a.pontos_totais
    );
  }, [filteredApostas, sortApostas]);

  const paginatedApostas = useMemo(() => {
    const start = (currentPageApostas - 1) * ITEMS_PER_PAGE;
    return sortedApostas.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedApostas, currentPageApostas]);

  const totalPagesApostas = Math.ceil(sortedApostas.length / ITEMS_PER_PAGE);

  const renderPagination = (currentPage, totalPages, setCurrentPage) => (
    <Flex mt={4} justifyContent="center" alignItems="center">
      <Button
        onClick={() => setCurrentPage(1)}
        isDisabled={currentPage === 1}
        size="sm"
        mr={2}
      >
        Primeira
      </Button>
      <Button
        onClick={() => setCurrentPage(currentPage - 1)}
        isDisabled={currentPage === 1}
        size="sm"
        mr={2}
      >
        Anterior
      </Button>
      <Text mx={2}>
        Página {currentPage} de {totalPages}
      </Text>
      <Button
        onClick={() => setCurrentPage(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        size="sm"
        ml={2}
      >
        Próxima
      </Button>
      <Button
        onClick={() => setCurrentPage(totalPages)}
        isDisabled={currentPage === totalPages}
        size="sm"
        ml={2}
      >
        Última
      </Button>
    </Flex>
  );

  return (
    <Container maxW="container.xl" py={6}>
      <Stack spacing={8}>
        <Card>
          <CardHeader>
            <Heading size="lg">Visualização de Premiações</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Box>
                <Heading size="sm" mb={2}>
                  Selecione um Jogo
                </Heading>
                <Select
                  placeholder="Selecione um jogo para visualizar"
                  value={selectedJogo ? selectedJogo.jog_id : ""}
                  onChange={handleSelectJogo}
                  isDisabled={loading}
                >
                  {jogos.map((jogo) => (
                    <option key={jogo.jog_id} value={jogo.jog_id}>
                      {jogo.jog_nome}
                    </option>
                  ))}
                </Select>
              </Box>
              {selectedJogo && (
                <Button
                  colorScheme="blue"
                  onClick={processarPremiacao}
                  isLoading={processing}
                  loadingText="Processando premiação..."
                  leftIcon={<Icon as={FaCalculator} />}
                >
                  Visualizar Premiação
                </Button>
              )}
            </Stack>
          </CardBody>
        </Card>

        {resultadoPremiacao && (
          <Stack spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="md">Informações do Jogo</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Nome do Jogo:</Text>
                    <Text>{resultadoPremiacao.jogo.jog_nome}</Text>
                  </Flex>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Status:</Text>
                    <Badge
                      colorScheme={
                        resultadoPremiacao.jogo.status === "encerrado"
                          ? "red"
                          : "green"
                      }
                    >
                      {resultadoPremiacao.jogo.status.toUpperCase()}
                    </Badge>
                  </Flex>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Total Arrecadado (Líquido):</Text>
                    <Text>
                      {formatCurrency(resultadoPremiacao.totalArrecadado)}
                    </Text>
                  </Flex>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Distribuição de Prêmios (Valores Líquidos)</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple" colorScheme="green">
                    <Thead>
                      <Tr>
                        <Th>Categoria</Th>
                        <Th isNumeric>Valor</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Campeão</Td>
                        <Td isNumeric>
                          {formatCurrency(
                            resultadoPremiacao.distribuicaoPremiosLiquida.campeao
                          )}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Vice-Campeão</Td>
                        <Td isNumeric>
                          {formatCurrency(
                            resultadoPremiacao.distribuicaoPremiosLiquida.vice
                          )}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Último Colocado</Td>
                        <Td isNumeric>
                          {formatCurrency(
                            resultadoPremiacao.distribuicaoPremiosLiquida.ultimoColocado
                          )}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Números Sorteados</Heading>
              </CardHeader>
              <CardBody>
                <Text>{resultadoPremiacao.numerosSorteados.join(", ")}</Text>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Histórico de Sorteios</Heading>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <Flex justify="center" p={8}>
                    <Skeleton height="40px" width="100%" />
                  </Flex>
                ) : sorteios.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Ordem</Th>
                          <Th>Descrição</Th>
                          <Th>Números Sorteados</Th>
                          <Th>Data do Sorteio</Th>
                          <Th>Duplicações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sorteios.map((sorteio, index) => (
                          <Tr key={sorteio.sorteio_id}>
                            <Td>{sorteios.length - index}</Td>
                            <Td>{sorteio.descricao}</Td>
                            <Td>
                              <HStack wrap="wrap" spacing={1}>
                                {sorteio.numerosArray.map((numero) =>
                                  renderDuplicatedNumber(numero, sorteio)
                                )}
                              </HStack>
                            </Td>
                            <Td>{formatDate(sorteio.dataSorteio)}</Td>
                            <Td>
                              {sorteio.numerosDuplicados.length > 0 ? (
                                <VStack align="start" spacing={2}>
                                  <Badge colorScheme="red">
                                    {sorteio.numerosDuplicados.length} números
                                    duplicados
                                  </Badge>
                                  {renderDetalhesDuplicacoes(
                                    sorteio.duplicacoesDetalhadas
                                  )}
                                </VStack>
                              ) : (
                                <Badge colorScheme="green">Nenhum</Badge>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text>Nenhum sorteio realizado para este jogo</Text>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Vencedores</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={6}>
                  <Box>
                    <Heading size="sm" mb={4}>
                      Campeão(s)
                    </Heading>
                    {resultadoPremiacao.premiacoes.campeao.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="green">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>Nome do Ganhador</Th>
                              <Th isNumeric>Pontos</Th>
                              <Th isNumeric>Prêmio</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {paginatedCampeao.map((ganhador, index) => (
                              <Tr key={`campeao-${ganhador.nome}-${index}`}>
                                <Td>
                                  {(currentPageCampeao - 1) * ITEMS_PER_PAGE +
                                    index +
                                    1}
                                </Td>
                                <Td>{ganhador.nome}</Td>
                                <Td isNumeric>{ganhador.pontos}</Td>
                                <Td isNumeric>
                                  {formatCurrency(ganhador.premio)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhum Campeão definido</Text>
                    )}
                    {sortedCampeao.length > ITEMS_PER_PAGE &&
                      renderPagination(
                        currentPageCampeao,
                        totalPagesCampeao,
                        setCurrentPageCampeao
                      )}
                  </Box>

                  <Box>
                    <Heading size="sm" mb={4}>
                      Vice-Campeão(s)
                    </Heading>
                    {resultadoPremiacao.premiacoes.vice.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="yellow">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>Nome do Ganhador</Th>
                              <Th isNumeric>Pontos</Th>
                              <Th isNumeric>Prêmio</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {paginatedVice.map((ganhador, index) => (
                              <Tr key={`vice-${ganhador.nome}-${index}`}>
                                <Td>
                                  {(currentPageVice - 1) * ITEMS_PER_PAGE +
                                    index +
                                    1}
                                </Td>
                                <Td>{ganhador.nome}</Td>
                                <Td isNumeric>{ganhador.pontos}</Td>
                                <Td isNumeric>
                                  {formatCurrency(ganhador.premio)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhum Vice-Campeão definido</Text>
                    )}
                    {sortedVice.length > ITEMS_PER_PAGE &&
                      renderPagination(
                        currentPageVice,
                        totalPagesVice,
                        setCurrentPageVice
                      )}
                  </Box>

                  <Box>
                    <Heading size="sm" mb={4}>
                      Último(s) Colocado(s)
                    </Heading>
                    {resultadoPremiacao.premiacoes.ultimoColocado.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="red">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>Nome do Ganhador</Th>
                              <Th isNumeric>Pontos</Th>
                              <Th isNumeric>Prêmio</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {paginatedUltimo.map((ganhador, index) => (
                              <Tr key={`ultimo-${ganhador.nome}-${index}`}>
                                <Td>
                                  {(currentPageUltimo - 1) * ITEMS_PER_PAGE +
                                    index +
                                    1}
                                </Td>
                                <Td>{ganhador.nome}</Td>
                                <Td isNumeric>{ganhador.pontos}</Td>
                                <Td isNumeric>
                                  {formatCurrency(ganhador.premio)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhum Último Colocado definido</Text>
                    )}
                    {sortedUltimo.length > ITEMS_PER_PAGE &&
                      renderPagination(
                        currentPageUltimo,
                        totalPagesUltimo,
                        setCurrentPageUltimo
                      )}
                  </Box>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Resultados das Apostas</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaSearch} color="gray.300" />
                      </InputLeftElement>
                      <Input
                        type="text"
                        placeholder="Pesquisar por nome ou números"
                        value={searchApostas}
                        onChange={(e) => {
                          setSearchApostas(e.target.value);
                          setCurrentPageApostas(1);
                        }}
                      />
                    </InputGroup>
                    <Select
                      placeholder="Ordenar por pontos"
                      value={sortApostas}
                      onChange={(e) => setSortApostas(e.target.value)}
                    >
                      <option value="asc">Pontos Crescentes</option>
                      <option value="desc">Pontos Decrescentes</option>
                    </Select>
                  </SimpleGrid>
                  {paginatedApostas.length > 0 ? (
                    <>
                      <TableContainer>
                        <Table variant="simple" colorScheme="purple">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>Nome do Apostador</Th>
                              <Th>Números Apostados</Th>
                              <Th>Números Acertados</Th>
                              <Th isNumeric>Acertos</Th>
                              <Th isNumeric>Pontos</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {paginatedApostas.map((aposta, index) => (
                              <Tr key={`aposta-${aposta.aposta_id}-${index}`}>
                                <Td>
                                  {(currentPageApostas - 1) * ITEMS_PER_PAGE +
                                    index +
                                    1}
                                </Td>
                                <Td>{aposta.nome || "Nome Não Encontrado"}</Td>
                                <Td>{aposta.palpite_numbers.join(", ")}</Td>
                                <Td>
                                  {aposta.numeros_acertados.join(", ") || "N/A"}
                                </Td>
                                <Td isNumeric>{aposta.quantidade_acertos}</Td>
                                <Td isNumeric>{aposta.pontos_totais}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                      {sortedApostas.length > ITEMS_PER_PAGE &&
                        renderPagination(
                          currentPageApostas,
                          totalPagesApostas,
                          setCurrentPageApostas
                        )}
                    </>
                  ) : (
                    <Text>Nenhuma aposta encontrada.</Text>
                  )}
                </Stack>
              </CardBody>
            </Card>
          </Stack>
        )}

        {loading && (
          <Stack spacing={4}>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

export default ClientPrizeCalculation;