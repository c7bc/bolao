// src/app/components/dashboard/Admin/PrizeCalculation.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@chakra-ui/react';
import { FaCalculator, FaFilePdf } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente para cálculo e visualização de premiações
 * @returns {JSX.Element} Componente React
 */
const PrizeCalculation = () => {
  // Estados
  const [jogos, setJogos] = useState([]);
  const [selectedJogo, setSelectedJogo] = useState(null);
  const [resultadoPremiacao, setResultadoPremiacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const toast = useToast();

  // Função para formatar data com verificação
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return 'N/A';
    return format(parsedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Função para formatar valor monetário com verificação
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para buscar todos os jogos
  const fetchJogos = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
        return;
      }
  
      const response = await axios.get('/api/jogos/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setJogos(response.data.jogos.filter(jogo => jogo.jog_status !== 'encerrado'));
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: 'Erro ao buscar jogos',
        description: error.response?.data?.error || 'Ocorreu um erro ao buscar os jogos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  

  // Função para lidar com a seleção do jogo
  const handleSelectJogo = (e) => {
    const jogoId = e.target.value;
    const jogo = jogos.find((j) => j.jog_id === jogoId);
    setSelectedJogo(jogo);
    setResultadoPremiacao(null);
  };

  // Função para processar a premiação
  const processarPremiacao = async () => {
    if (!selectedJogo) {
      toast({
        title: 'Jogo não selecionado',
        description: 'Por favor, selecione um jogo para processar a premiação.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
        return;
      }

      const response = await axios.post(
        `/api/jogos/${selectedJogo.slug}/process-premiacao`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.premiacoes) {
        setResultadoPremiacao(response.data);
        toast({
          title: 'Premiação processada com sucesso',
          description: 'Os prêmios foram calculados com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao processar premiação:', error);
      toast({
        title: 'Erro ao processar premiação',
        description: error.response?.data?.error || 'Ocorreu um erro ao processar a premiação.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Função para gerar o PDF
  const generatePDF = async () => {
    if (!resultadoPremiacao) {
      toast({
        title: 'Dados não disponíveis',
        description: 'Por favor, processe a premiação antes de gerar o relatório.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setGeneratingPDF(true);

      const doc = new jsPDF();

      // Configurações iniciais do PDF
      doc.setFont('helvetica');
      doc.setFontSize(16);

      // Cabeçalho do PDF
      doc.text('Relatório de Premiação do Bolão', 105, 20, { align: 'center' });
      doc.setFontSize(12);

      // Informações do Jogo
      doc.text('Informações do Jogo', 14, 30);
      doc.setFontSize(10);
      doc.text(`Nome do Jogo: ${resultadoPremiacao.jogo.jog_nome}`, 14, 40);
      doc.text(`Status: ${resultadoPremiacao.jogo.status}`, 14, 45);
      doc.text(`Data de Início: ${formatDate(resultadoPremiacao.jogo.data_inicio)}`, 14, 50);
      doc.text(`Data de Fim: ${formatDate(resultadoPremiacao.jogo.data_fim)}`, 14, 55);

      // Informações do Criador
      doc.setFontSize(12);
      doc.text('Informações do Responsável', 14, 70);
      doc.setFontSize(10);
      if (resultadoPremiacao.criador) {
        doc.text(`Nome: ${resultadoPremiacao.criador.nome || 'N/A'}`, 14, 80);
        doc.text(`Email: ${resultadoPremiacao.criador.email || 'N/A'}`, 14, 85);
        doc.text(`Telefone: ${resultadoPremiacao.criador.whatsapp || 'N/A'}`, 14, 90);
      } else {
        doc.text('Informações do responsável não disponíveis', 14, 80);
      }

      // Distribuição de Prêmios
      doc.setFontSize(12);
      doc.text('Distribuição de Prêmios', 14, 105);

      const distribuicaoData = [
        ['Categoria', 'Valor'],
        ['Campeão', formatCurrency(resultadoPremiacao.distribuicaoPremios.campeao)],
        ['Vice-Campeão', formatCurrency(resultadoPremiacao.distribuicaoPremios.vice)],
        ['Último Colocado', formatCurrency(resultadoPremiacao.distribuicaoPremios.ultimoColocado)],
        ['Custos Administrativos', formatCurrency(resultadoPremiacao.distribuicaoPremios.custosAdministrativos)],
        ['Comissão Colaboradores', formatCurrency(resultadoPremiacao.distribuicaoPremios.comissaoColaboradores)],
      ];

      doc.autoTable({
        startY: 110,
        head: [distribuicaoData[0]],
        body: distribuicaoData.slice(1),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 100, 0] },
      });

      // Total Arrecadado
      doc.text(
        `Total Arrecadado: ${formatCurrency(resultadoPremiacao.totalArrecadado)}`,
        14,
        doc.lastAutoTable.finalY + 15
      );

      // Resultados das Apostas
      doc.setFontSize(12);
      doc.text('Resultados das Apostas', 14, doc.lastAutoTable.finalY + 30);

      const apostasData = resultadoPremiacao.resultadosApostas.map((aposta, index) => [
        index + 1,
        aposta.cli_id,
        aposta.palpite_numbers.join(', '),
        aposta.numeros_acertados.join(', ') || 'N/A',
        aposta.quantidade_acertos,
        aposta.pontos_totais,
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 35,
        head: [['#', 'ID do Apostador', 'Números Apostados', 'Números Acertados', 'Acertos', 'Pontos']],
        body: apostasData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 100, 0] },
      });

      // Vencedores e suas Premiações
      doc.setFontSize(12);
      doc.text('Vencedores e Premiações', 14, doc.lastAutoTable.finalY + 15);

      // Tabela de Campeões
      const campeaoData = resultadoPremiacao.premiacoes.premiacoes.campeao.map((vencedor, index) => [
        index + 1,
        vencedor.cli_id,
        vencedor.pontos,
        formatCurrency(vencedor.premio),
      ]);

      if (campeaoData.length > 0) {
        doc.setFontSize(10);
        doc.text('Campeões', 14, doc.lastAutoTable.finalY + 25);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 30,
          head: [['#', 'ID do Ganhador', 'Pontos', 'Prêmio']],
          body: campeaoData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 100, 0] },
        });
      }

      // Tabela de Vice-Campeões
      const viceData = resultadoPremiacao.premiacoes.premiacoes.vice.map((vencedor, index) => [
        index + 1,
        vencedor.cli_id,
        vencedor.pontos,
        formatCurrency(vencedor.premio),
      ]);

      if (viceData.length > 0) {
        doc.setFontSize(10);
        doc.text('Vice-Campeões', 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [['#', 'ID do Ganhador', 'Pontos', 'Prêmio']],
          body: viceData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 100, 0] },
        });
      }

      // Tabela de Últimos Colocados
      const ultimoData = resultadoPremiacao.premiacoes.premiacoes.ultimoColocado.map((vencedor, index) => [
        index + 1,
        vencedor.cli_id,
        vencedor.pontos,
        formatCurrency(vencedor.premio),
      ]);

      if (ultimoData.length > 0) {
        doc.setFontSize(10);
        doc.text('Últimos Colocados', 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [['#', 'ID do Ganhador', 'Pontos', 'Prêmio']],
          body: ultimoData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 100, 0] },
        });
      }

      // Tabela de Comissão dos Colaboradores
      const comissaoData = resultadoPremiacao.premiacoes.premiacoes.comissaoColaboradores.map((colaborador, index) => [
        index + 1,
        colaborador.col_id,
        formatCurrency(colaborador.premio),
      ]);

      if (comissaoData.length > 0) {
        doc.setFontSize(10);
        doc.text('Comissão dos Colaboradores', 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [['#', 'ID do Colaborador', 'Comissão']],
          body: comissaoData,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 100, 0] },
        });
      }

      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Salvar o PDF
      doc.save(`Relatorio_Premiacao_${resultadoPremiacao.jogo.jog_nome}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);

      toast({
        title: 'PDF gerado com sucesso',
        description: 'O relatório foi gerado e baixado.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: error.message || 'Ocorreu um erro ao gerar o PDF.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Carregar jogos ao montar o componente
  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);  

  return (
    <Container maxW="container.xl" py={6}>
      <Stack spacing={8}>
        {/* Cabeçalho */}
        <Card>
          <CardHeader>
            <Heading size="lg">Cálculo de Premiação</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              {/* Seleção do Jogo */}
              <Box>
                <Heading size="sm" mb={2}>
                  Selecione um Jogo
                </Heading>
                <Select
                  placeholder="Selecione um jogo para processar"
                  value={selectedJogo ? selectedJogo.jog_id : ''}
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

              {/* Botão para Processar Premiação */}
              {selectedJogo && (
                <Button
                  colorScheme="green"
                  onClick={processarPremiacao}
                  isLoading={processing}
                  loadingText="Processando premiação..."
                  leftIcon={<Icon as={FaCalculator} />}
                >
                  Processar Premiação
                </Button>
              )}
            </Stack>
          </CardBody>
        </Card>

        {/* Resultados da Premiação */}
        {resultadoPremiacao && (
          <Stack spacing={6}>
            {/* Informações Básicas do Jogo */}
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
                      colorScheme={resultadoPremiacao.jogo.status === 'encerrado' ? 'red' : 'green'}
                    >
                      {resultadoPremiacao.jogo.status.toUpperCase()}
                    </Badge>
                  </Flex>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Total Arrecadado:</Text>
                    <Text>{formatCurrency(resultadoPremiacao.totalArrecadado)}</Text>
                  </Flex>
                </Stack>
              </CardBody>
            </Card>

            {/* Distribuição de Prêmios */}
            <Card>
              <CardHeader>
                <Heading size="md">Distribuição de Prêmios</Heading>
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
                        <Td isNumeric>{formatCurrency(resultadoPremiacao.distribuicaoPremios.campeao)}</Td>
                      </Tr>
                      <Tr>
                        <Td>Vice-Campeão</Td>
                        <Td isNumeric>{formatCurrency(resultadoPremiacao.distribuicaoPremios.vice)}</Td>
                      </Tr>
                      <Tr>
                        <Td>Último Colocado</Td>
                        <Td isNumeric>{formatCurrency(resultadoPremiacao.distribuicaoPremios.ultimoColocado)}</Td>
                      </Tr>
                      <Tr>
                        <Td>Custos Administrativos</Td>
                        <Td isNumeric>{formatCurrency(resultadoPremiacao.distribuicaoPremios.custosAdministrativos)}</Td>
                      </Tr>
                      <Tr>
                        <Td>Comissão Colaboradores</Td>
                        <Td isNumeric>{formatCurrency(resultadoPremiacao.distribuicaoPremios.comissaoColaboradores)}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Resultados das Apostas */}
            <Card>
              <CardHeader>
                <Heading size="md">Resultados das Apostas</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple" colorScheme="purple">
                    <Thead>
                      <Tr>
                        <Th>#</Th>
                        <Th>ID do Apostador</Th>
                        <Th>Números Apostados</Th>
                        <Th>Números Acertados</Th>
                        <Th isNumeric>Acertos</Th>
                        <Th isNumeric>Pontos</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {resultadoPremiacao.resultadosApostas.map((aposta, index) => (
                        <Tr key={aposta.aposta_id}>
                          <Td>{index + 1}</Td>
                          <Td>{aposta.cli_id}</Td>
                          <Td>{aposta.palpite_numbers.join(', ')}</Td>
                          <Td>{aposta.numeros_acertados.join(', ') || 'N/A'}</Td>
                          <Td isNumeric>{aposta.quantidade_acertos}</Td>
                          <Td isNumeric>{aposta.pontos_totais}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Vencedores */}
            <Card>
              <CardHeader>
                <Heading size="md">Vencedores</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={6}>
                  {/* Campeões */}
                  <Box>
                    <Heading size="sm" mb={4}>
                      Campeão(s)
                    </Heading>
                    {resultadoPremiacao.premiacoes.premiacoes.campeao.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="green">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>ID do Ganhador</Th>
                              <Th isNumeric>Pontos</Th>
                              <Th isNumeric>Prêmio</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {resultadoPremiacao.premiacoes.premiacoes.campeao.map((ganhador, index) => (
                              <Tr key={`campeao-${ganhador.cli_id}`}>
                                <Td>{index + 1}</Td>
                                <Td>{ganhador.cli_id}</Td>
                                <Td isNumeric>{ganhador.pontos}</Td>
                                <Td isNumeric>{formatCurrency(ganhador.premio)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhum Campeão definido</Text>
                    )}
                  </Box>

                  {/* Vice-Campeões */}
                  <Box>
                    <Heading size="sm" mb={4}>
                      Vice-Campeão(s)
                    </Heading>
                    {resultadoPremiacao.premiacoes.premiacoes.vice.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="yellow">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>ID do Ganhador</Th>
                              <Th isNumeric>Pontos</Th>
                              <Th isNumeric>Prêmio</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {resultadoPremiacao.premiacoes.premiacoes.vice.map((ganhador, index) => (
                              <Tr key={`vice-${ganhador.cli_id}`}>
                                <Td>{index + 1}</Td>
                                <Td>{ganhador.cli_id}</Td>
                                <Td isNumeric>{ganhador.pontos}</Td>
                                <Td isNumeric>{formatCurrency(ganhador.premio)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhum Vice-Campeão definido</Text>
                    )}
                  </Box>

                  {/* Últimos Colocados */}
                  <Box>
                    <Heading size="sm" mb={4}>
                      Último(s) Colocado(s)
                    </Heading>
                    {resultadoPremiacao.premiacoes.premiacoes.ultimoColocado.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="red">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>ID do Ganhador</Th>
                              <Th isNumeric>Pontos</Th>
                              <Th isNumeric>Prêmio</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {resultadoPremiacao.premiacoes.premiacoes.ultimoColocado.map((ganhador, index) => (
                              <Tr key={`ultimo-${ganhador.cli_id}`}>
                                <Td>{index + 1}</Td>
                                <Td>{ganhador.cli_id}</Td>
                                <Td isNumeric>{ganhador.pontos}</Td>
                                <Td isNumeric>{formatCurrency(ganhador.premio)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhum Último Colocado definido</Text>
                    )}
                  </Box>

                  {/* Comissão dos Colaboradores */}
                  <Box>
                    <Heading size="sm" mb={4}>
                      Comissão dos Colaboradores
                    </Heading>
                    {resultadoPremiacao.premiacoes.premiacoes.comissaoColaboradores.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" colorScheme="blue">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>ID do Colaborador</Th>
                              <Th isNumeric>Comissão</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {resultadoPremiacao.premiacoes.premiacoes.comissaoColaboradores.map((colaborador, index) => (
                              <Tr key={`colaborador-${colaborador.col_id}`}>
                                <Td>{index + 1}</Td>
                                <Td>{colaborador.col_id}</Td>
                                <Td isNumeric>{formatCurrency(colaborador.premio)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text>Nenhuma comissão de colaborador definida</Text>
                    )}
                  </Box>
                </Stack>
              </CardBody>
            </Card>

            {/* Botão para Gerar PDF */}
            <Flex justifyContent="flex-end">
              <Button
                colorScheme="blue"
                onClick={generatePDF}
                isLoading={generatingPDF}
                loadingText="Gerando PDF..."
                leftIcon={<Icon as={FaFilePdf} />}
                size="lg"
              >
                Gerar Relatório PDF
              </Button>
            </Flex>
          </Stack>
        )}

        {/* Loading States */}
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

export default PrizeCalculation;
