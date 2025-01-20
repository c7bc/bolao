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
import { FaCalculator, FaSearch, FaFilePdf } from "react-icons/fa";
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
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  const generatePDF = async () => {
    if (!resultadoPremiacao) {
      toast({
        title: "Dados não disponíveis",
        description: "Por favor, processe a premiação antes de gerar o relatório.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
  
    try {
      setGeneratingPDF(true);
      const doc = new jsPDF();
      doc.setFont("helvetica");
  
      // Título principal
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Premiação", 105, 15, { align: "center" });
  
      // Informações do bolão
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("Informações do Bolão: ", 105, 25, { align: "center" });
  
      doc.setFontSize(12);
      const infoText = `Nome do Jogo: ${resultadoPremiacao.jogo.jog_nome}, Status: ${resultadoPremiacao.jogo.status}, Início: ${formatDate(resultadoPremiacao.jogo.data_inicio)}, Fim: ${formatDate(resultadoPremiacao.jogo.data_fim)}`;
      doc.text(infoText, 105, 30, { align: "center" });
  
      // Números sorteados com quebra de linha automática
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Números Sorteados:", 105, 40, { align: "center" });
  
      const numbersArray = resultadoPremiacao.numerosSorteados;
      const maxWidth = 170;
      let numbersLine = "";
      let lines = [];
      let currentY = 45;
  
      numbersArray.forEach((number, index) => {
        const testLine = numbersLine + (numbersLine ? ", " : "") + number;
        const textWidth = doc.getTextWidth(testLine);
        
        if (textWidth > maxWidth) {
          lines.push(numbersLine);
          numbersLine = number.toString();
        } else {
          numbersLine = testLine;
        }
  
        if (index === numbersArray.length - 1) {
          lines.push(numbersLine);
        }
      });
  
      lines.forEach((line) => {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(line, 105, currentY, { align: "center" });
        currentY += 6;
      });
  
      currentY += 4;
  
      // Informações do responsável
      doc.setTextColor(0, 0, 0);
      if (resultadoPremiacao.jogo.responsavel) {
        doc.text(`Responsável: ${resultadoPremiacao.jogo.responsavel}`, 20, currentY);
        if (resultadoPremiacao.jogo.contato) {
          currentY += 5;
          doc.text(`Contato: ${resultadoPremiacao.jogo.contato}`, 20, currentY);
        }
      }
  
      currentY += 10;
  
      // Título da distribuição dos prêmios
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Distribuição dos Prêmios", 105, currentY, { align: "center" });
  
      currentY += 10;
  
      // Configuração dos boxes de premiação
      const boxSize = 8;
      const textMarginLeft = 35;
      const lineHeight = 10;
  
      // Box Mais pontos (Vermelho)
      doc.setFillColor(255, 99, 99);
      doc.rect(20, currentY - 4, boxSize, boxSize, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Mais pontos - Prêmio 10 pts = ${formatCurrency(resultadoPremiacao.distribuicaoPremios.campeao)}`, textMarginLeft, currentY);
  
      currentY += lineHeight;
      // Box 9 pontos (Verde)
      doc.setFillColor(99, 255, 99);
      doc.rect(20, currentY - 4, boxSize, boxSize, "F");
      doc.text(`9 pontos - Prêmio 9 pts = ${formatCurrency(resultadoPremiacao.distribuicaoPremios.vice)}`, textMarginLeft, currentY);
  
      currentY += lineHeight;
      // Box Menos pontos (Azul)
      doc.setFillColor(99, 99, 255);
      doc.rect(20, currentY - 4, boxSize, boxSize, "F");
      doc.text(`Menos pontos - Prêmio menos pts = ${formatCurrency(resultadoPremiacao.distribuicaoPremios.ultimoColocado)}`, textMarginLeft, currentY);
  
      currentY += 20;
  
      // Seção de Vencedores
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Vencedores do Concurso", 105, currentY, { align: "center" });
      currentY += 15;
  
      // Função auxiliar para desenhar uma linha de vencedor
      const drawWinnerLine = (winner, yPos, color, isAlternate = false) => {
        const margin = 20;
        const pageWidth = doc.internal.pageSize.width;
        const lineWidth = pageWidth - (2 * margin);
        const rowHeight = 8;
  
        // Background color
        doc.setFillColor(...color);
        if (isAlternate) {
          const alpha = 0.5;
          doc.setFillColor(
            255 - ((255 - color[0]) * alpha),
            255 - ((255 - color[1]) * alpha),
            255 - ((255 - color[2]) * alpha)
          );
        }
        doc.rect(margin, yPos, lineWidth, rowHeight, "F");
  
        // Text
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const textY = yPos + 5.5;
  
        // Nome (50% do espaço)
        doc.text(winner.nome, margin + 5, textY);
  
        // Pontos (25% do espaço)
        doc.text(
          `${winner.pontos} pts`,
          margin + (lineWidth * 0.6),
          textY
        );
  
        // Prêmio (25% do espaço)
        doc.text(
          formatCurrency(winner.premio),
          margin + (lineWidth * 0.8),
          textY
        );
  
        return yPos + rowHeight;
      };
  
      // Função para desenhar um grupo de vencedores
      const drawWinnersGroup = (winners, title, baseColor, startY) => {
        const margin = 20;
        const pageWidth = doc.internal.pageSize.width;
        const titleWidth = pageWidth - (2 * margin);
  
        // Título da categoria
        doc.setFillColor(...baseColor);
        doc.rect(margin, startY, titleWidth, 10, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, 105, startY + 7, { align: "center" });
  
        let currentY = startY + 15;
  
        winners.forEach((winner, index) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          currentY = drawWinnerLine(winner, currentY, baseColor, index % 2 === 1);
        });
  
        return currentY + 5;
      };
  
      // Desenhar grupos de vencedores
      if (resultadoPremiacao.premiacoes.campeao.length > 0) {
        currentY = drawWinnersGroup(
          resultadoPremiacao.premiacoes.campeao,
          `Campeões (${resultadoPremiacao.premiacoes.campeao.length} ganhador${resultadoPremiacao.premiacoes.campeao.length > 1 ? 'es' : ''}) - ${formatCurrency(resultadoPremiacao.distribuicaoPremios.campeao / resultadoPremiacao.premiacoes.campeao.length)} cada`,
          [255, 200, 200],
          currentY
        );
      }
  
      if (resultadoPremiacao.premiacoes.vice.length > 0) {
        currentY = drawWinnersGroup(
          resultadoPremiacao.premiacoes.vice,
          `Vice-Campeões (${resultadoPremiacao.premiacoes.vice.length} ganhador${resultadoPremiacao.premiacoes.vice.length > 1 ? 'es' : ''}) - ${formatCurrency(resultadoPremiacao.distribuicaoPremios.vice / resultadoPremiacao.premiacoes.vice.length)} cada`,
          [200, 255, 200],
          currentY
        );
      }
  
      if (resultadoPremiacao.premiacoes.ultimoColocado.length > 0) {
        currentY = drawWinnersGroup(
          resultadoPremiacao.premiacoes.ultimoColocado,
          `Últimos Colocados (${resultadoPremiacao.premiacoes.ultimoColocado.length} ganhador${resultadoPremiacao.premiacoes.ultimoColocado.length > 1 ? 'es' : ''}) - ${formatCurrency(resultadoPremiacao.distribuicaoPremios.ultimoColocado / resultadoPremiacao.premiacoes.ultimoColocado.length)} cada`,
          [99, 99, 255],
          currentY
        );
      }
  
      currentY += 10;
  
      // Título da seção de resultados
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
  
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resultados das Apostas", 105, currentY, { align: "center" });
      currentY += 15;
  
      // Tabela de resultados
      const drawCompactTable = (data, startY) => {
        const rowHeight = 5;
        const pageWidth = doc.internal.pageSize.width;
        const tableWidth = (pageWidth - 28) / 2;
        const marginLeft = 14;
  
        const indexWidth = 8;
        const nameWidth = 35;
        const numberWidth = 5;
        const totalNumbers = data[0].numbers.length;
  
        let currentY = startY;
        let isLeftColumn = true;
  
        data.forEach((row, rowIndex) => {
          if (currentY > 280) {
            doc.addPage();
            currentY = 20;
            isLeftColumn = true;
          }
  
          let currentX = isLeftColumn ? marginLeft : marginLeft + tableWidth + 5;
  
          // Define background color based on points
          let bgColor;
          if (row.points >= 10) {
            bgColor = [255, 180, 180];
          } else if (row.points === 9) {
            bgColor = [180, 255, 180];
          } else if (row.points === resultadoPremiacao.premiacoes.ultimoColocado[0]?.pontos) {
            bgColor = [65, 105, 225];
          } else {
            bgColor = [255, 255, 255];
          }
  
          // Draw index background
          doc.setFillColor(...bgColor);
          doc.rect(currentX, currentY, indexWidth, rowHeight, 'F');
  
          // Draw left vertical line for index
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
  
          // Draw table borders
          doc.setDrawColor(0);
          doc.line(currentX, currentY, currentX + indexWidth + nameWidth + (numberWidth * totalNumbers), currentY);
  
          // Index
          doc.setFontSize(6);
          doc.setTextColor(0);
          doc.text((rowIndex + 1).toString(), currentX + 1, currentY + rowHeight - 0.8);
          currentX += indexWidth;
  
          // Vertical line after index
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
  
          // Nome do apostador
          doc.text(row.name.substring(0, 25), currentX + 1, currentY + rowHeight - 0.8);
          currentX += nameWidth;
  
          // Vertical line after name
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
  
          // Numbers
          row.numbers.forEach((number) => {
            if (row.matchedNumbers.includes(number)) {
              doc.setFillColor(144, 238, 144);
            } else {
              doc.setFillColor(255, 255, 255);
            }
  
            doc.rect(currentX, currentY, numberWidth, rowHeight, 'F');
            doc.rect(currentX, currentY, numberWidth, rowHeight, 'S');
  
            doc.setFontSize(6);
            doc.setTextColor(0);
            doc.text(
              number.toString(),
              currentX + numberWidth / 2,
              currentY + rowHeight - 0.8,
              { align: "center" }
            );
  
            currentX += numberWidth;
          });
  
          // Bottom line for each row
          doc.line(
            isLeftColumn ? marginLeft : marginLeft + tableWidth + 5,
            currentY + rowHeight,
            currentX,
            currentY + rowHeight
          );
  
          // Last vertical line
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
  
          if (!isLeftColumn) {
            currentY += rowHeight;
          }
          isLeftColumn = !isLeftColumn;
        });
  
        return currentY;
      };
  
      // Preparar dados para a tabela de resultados
      const tableData = resultadoPremiacao.resultadosApostas.map(aposta => ({
        name: aposta.nome || "N/A",
        numbers: aposta.palpite_numbers,
        matchedNumbers: aposta.numeros_acertados || [],
        points: aposta.pontos_totais
      }));
  
      // Desenhar a tabela de resultados
      drawCompactTable(tableData, currentY);
  
      // Adicionar paginação
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`${i} / ${pageCount}`, 105, 290, { align: "center" });
      }
  
      doc.save(`Relatorio_Premiacao_${resultadoPremiacao.jogo.jog_nome}_${format(new Date(), "dd-MM-yyyy")}.pdf`);
  
      toast({
        title: "PDF gerado com sucesso",
        description: "O relatório foi gerado e baixado.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Ocorreu um erro ao gerar o PDF.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

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
               <Flex>
                <Button
                  colorScheme="blue"
                  onClick={generatePDF}
                  isLoading={generatingPDF}
                  loadingText="Gerando PDF..."
                  leftIcon={<Icon as={FaFilePdf} />}
                  size="lg"
                  width="full"
                >
                  Gerar Relatório PDF
                </Button>
              </Flex>
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