'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  FormControl,
  FormLabel,
  Button,
  Flex,
  useBreakpointValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { DownloadIcon, RepeatIcon, ViewIcon } from '@chakra-ui/icons';
import axios from 'axios';
import PaymentForm from './PaymentForm';

const Financeiro = () => {
  const [resumo, setResumo] = useState({
    totalComissao: 0,
    totalPago: 0,
    totalRecebido: 0,
    comissaoColaborador: 0,
  });
  const [comissoes, setComissoes] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [dadosBancarios, setDadosBancarios] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: '',
    titular: '',
    cpf: '',
    pix: '',
  });
  const [historicoJogos, setHistoricoJogos] = useState([]);
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const toast = useToast();

  const fetchResumo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/financeiro/resumo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumo(response.data.resumo);
    } catch (error) {
      toast({
        title: 'Erro ao carregar resumo financeiro.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchDadosBancarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/dados-bancarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDadosBancarios(response.data.dadosBancarios);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados bancários.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchHistoricoJogos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/historico-jogos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { periodo: filtroPeriodo },
      });
      setHistoricoJogos(response.data.jogos);
    } catch (error) {
      toast({
        title: 'Erro ao carregar histórico de jogos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchPagamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/pagamentos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPagamentos(response.data.pagamentos);
    } catch (error) {
      toast({
        title: 'Erro ao carregar pagamentos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSaveDadosBancarios = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/colaborador/dados-bancarios', dadosBancarios, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: 'Dados bancários atualizados com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar dados bancários.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/financeiro/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio-financeiro.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'Erro ao exportar dados.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchResumo(),
        fetchDadosBancarios(),
        fetchHistoricoJogos(),
        fetchPagamentos(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [filtroPeriodo]);

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Financeiro
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Stat>
          <StatLabel>Total Recebido</StatLabel>
          <StatNumber>R$ {resumo.totalRecebido.toFixed(2)}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            Valores recebidos
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Comissão Colaborador</StatLabel>
          <StatNumber>R$ {resumo.comissaoColaborador.toFixed(2)}</StatNumber>
          <StatHelpText>Comissão atual</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total de Comissões</StatLabel>
          <StatNumber>R$ {resumo.totalComissao.toFixed(2)}</StatNumber>
          <StatHelpText>Acumulado até hoje</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Pago</StatLabel>
          <StatNumber>R$ {resumo.totalPago.toFixed(2)}</StatNumber>
          <StatHelpText>Pagamentos realizados</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Accordion allowMultiple mb={6}>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Dados Bancários
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <VStack align="stretch" spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight="bold">Banco:</Text>
                  <Text>{dadosBancarios.banco}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Agência:</Text>
                  <Text>{dadosBancarios.agencia}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Conta:</Text>
                  <Text>{dadosBancarios.conta}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">PIX:</Text>
                  <Text>{dadosBancarios.pix}</Text>
                </Box>
              </SimpleGrid>
              <Button colorScheme="blue" onClick={() => setIsModalOpen(true)}>
                Atualizar Dados Bancários
              </Button>
            </VStack>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Histórico de Pagamentos
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data</Th>
                  <Th>Valor</Th>
                  <Th>Método</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pagamentos.map((pagamento) => (
                  <Tr key={pagamento.id}>
                    <Td>{new Date(pagamento.data).toLocaleDateString()}</Td>
                    <Td>R$ {pagamento.valor.toFixed(2)}</Td>
                    <Td>{pagamento.metodo}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          pagamento.status === 'CONFIRMADO'
                            ? 'green'
                            : pagamento.status === 'PENDENTE'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {pagamento.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Histórico de Jogos
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data</Th>
                  <Th>Cliente</Th>
                  <Th>Valor Apostado</Th>
                  <Th>Comissão</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {historicoJogos.map((jogo) => (
                  <Tr key={jogo.id}>
                    <Td>{new Date(jogo.data).toLocaleDateString()}</Td>
                    <Td>{jogo.cliente}</Td>
                    <Td>R$ {jogo.valorApostado.toFixed(2)}</Td>
                    <Td>R$ {jogo.comissao.toFixed(2)}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          jogo.status === 'GANHO'
                            ? 'green'
                            : jogo.status === 'PERDIDO'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {jogo.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Novo Pagamento
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <PaymentForm />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Atualizar Dados Bancários</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={4}>
              <FormControl>
                <FormLabel>Banco</FormLabel>
                <Input
                  value={dadosBancarios.banco}
                  onChange={(e) =>
                    setDadosBancarios({ ...dadosBancarios, banco: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Agência</FormLabel>
                <Input
                  value={dadosBancarios.agencia}
                  onChange={(e) =>
                    setDadosBancarios({ ...dadosBancarios, agencia: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Conta</FormLabel>
                <Input
                  value={dadosBancarios.conta}
                  onChange={(e) =>
                    setDadosBancarios({ ...dadosBancarios, conta: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tipo de Conta</FormLabel>
                <Select
                  value={dadosBancarios.tipoConta}
                  onChange={(e) =>
                    setDadosBancarios({ ...dadosBancarios, tipoConta: e.target.value })
                  }
                >
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Chave PIX</FormLabel>
                <Input
                  value={dadosBancarios.pix}
                  onChange={(e) =>
                    setDadosBancarios({ ...dadosBancarios, pix: e.target.value })
                  }
                />
              </FormControl>
              <Button colorScheme="blue" onClick={handleSaveDadosBancarios} width="100%">
                Salvar
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Flex mb={4} gap={4} flexWrap="wrap">
        <FormControl maxW="200px">
          <FormLabel>Período</FormLabel>
          <Select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mês</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="ano">Ano Atual</option>
          </Select>
        </FormControl>

        <FormControl maxW="200px">
          <FormLabel>Cliente</FormLabel>
          <Select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          >
            <option value="">Todos os Clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </Select>
        </FormControl>

        <Box ml="auto">
          <Button
            colorScheme="green"
            mr={2}
            size={buttonSize}
            onClick={handleExport}
            leftIcon={<DownloadIcon />}
          >
            Exportar Dados
          </Button>
          <Button
            colorScheme="blue"
            size={buttonSize}
            onClick={() => {
              fetchResumo();
              fetchHistoricoJogos();
              fetchPagamentos();
            }}
            leftIcon={<RepeatIcon />}
          >
            Atualizar
          </Button>
        </Box>
      </Flex>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Carregando dados financeiros...</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Data</Th>
                <Th>Descrição</Th>
                <Th>Valor</Th>
                <Th>Tipo</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {comissoes.map((comissao) => (
                <Tr key={comissao.id}>
                  <Td>{new Date(comissao.data).toLocaleDateString()}</Td>
                  <Td>{comissao.descricao}</Td>
                  <Td>R$ {comissao.valor.toFixed(2)}</Td>
                  <Td>{comissao.tipo}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        comissao.status === 'PAGO'
                          ? 'green'
                          : comissao.status === 'PENDENTE'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {comissao.status}
                    </Badge>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Ver detalhes"
                      icon={<ViewIcon />}
                      size="sm"
                      mr={2}
                      onClick={() => {
                        // Implementar visualização de detalhes
                      }}
                    />
                    {comissao.comprovante && (
                      <IconButton
                        aria-label="Download comprovante"
                        icon={<DownloadIcon />}
                        size="sm"
                        onClick={() => {
                          // Implementar download de comprovante
                        }}
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default Financeiro;