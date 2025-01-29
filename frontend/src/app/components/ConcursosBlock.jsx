'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Spinner,
  Heading,
  useToast,
  Card,
  CardBody,
  Tooltip,
} from '@chakra-ui/react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const ITEMS_PER_PAGE = 10;

export default function ConcursosBlock() {
  const [jogos, setJogos] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJogos, setFilteredJogos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  // Função para buscar tipos de jogos
  const fetchGameTypes = useCallback(async () => {
    try {
      const response = await axios.get('/api/game-types/list');
      setGameTypes(response.data.gameTypes);
    } catch (error) {
      toast({
        title: 'Erro ao carregar tipos de jogos',
        description: error.message || 'Ocorreu um erro ao buscar os tipos de jogos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Função para buscar jogos
  const fetchJogos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axios.get('/api/jogos/list', { params });
      const jogosData = response.data.jogos.filter(jogo => jogo.visibleInConcursos);
      setJogos(jogosData);
      setFilteredJogos(jogosData);
      setIsLoading(false);
    } catch (error) {
      setError(error.message || 'Erro ao carregar os jogos.');
      toast({
        title: 'Erro ao carregar jogos',
        description: error.message || 'Ocorreu um erro ao buscar os jogos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, toast]);

  useEffect(() => {
    fetchGameTypes();
  }, [fetchGameTypes]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  const handleSearch = () => {
    let filtered = jogos;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((jogo) => jogo.jog_status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((jogo) =>
        jogo.jog_nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJogos(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setFilteredJogos(jogos);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aberto':
        return 'green';
      case 'fechado':
        return 'yellow';
      case 'encerrado':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'fechado':
        return 'Fechado';
      case 'encerrado':
        return 'Encerrado';
      default:
        return 'Desconhecido';
    }
  };

  // Lógica de paginação
  const totalPages = Math.ceil(filteredJogos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentJogos = filteredJogos.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const formatCurrency = (value) => {
    if (isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="60vh">
        <Spinner size="xl" color="green.500" />
        <Text ml={4} fontSize="xl">
          Carregando concursos...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minH="60vh">
        <Card>
          <CardBody>
            <Text fontSize="xl" color="red.500" textAlign="center">
              {error}
            </Text>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 12 }}>
      <Heading 
        as="h2" 
        size={{ base: "lg", md: "xl" }} 
        color="green.800" 
        textAlign="center" 
        mb={{ base: 4, md: 8 }}
        px={2}
      >
        Concursos Disponíveis
      </Heading>
  
      <Flex
        gap={{ base: 3, md: 6 }}
        mb={{ base: 4, md: 8 }}
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        px={{ base: 2, md: 0 }}
      >
        <Select
          placeholder="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          bg="white"
          borderColor="green.200"
          _hover={{ borderColor: 'green.300' }}
          mb={{ base: 2, md: 0 }}
          size={{ base: "sm", md: "md" }}
        >
          <option value="all">Todos os Status</option>
          <option value="aberto">Abertos</option>
          <option value="fechado">Fechados</option>
          <option value="encerrado">Encerrados</option>
        </Select>
  
        <Flex 
          flex={1} 
          gap={{ base: 2, md: 4 }}
          direction={{ base: 'column', sm: 'row' }}
        >
          <Input
            placeholder="Buscar por nome do concurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
            borderColor="green.200"
            _hover={{ borderColor: 'green.300' }}
            size={{ base: "sm", md: "md" }}
          />
          <Flex gap={2}>
            <Tooltip label="Buscar">
              <IconButton
                aria-label="Buscar"
                icon={<Search />}
                colorScheme="green"
                onClick={handleSearch}
                size={{ base: "sm", md: "md" }}
              />
            </Tooltip>
            <Tooltip label="Limpar Filtros">
              <Button
                onClick={handleReset}
                colorScheme="red"
                variant="outline"
                size={{ base: "sm", md: "md" }}
                w={{ base: "full", sm: "auto" }}
              >
                Limpar
              </Button>
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
  
      <Box>
  {/* Versão Desktop - Tabela */}
  <Box display={{ base: 'none', lg: 'block' }}>
    <Table 
      variant="striped" 
      colorScheme="green" 
      bg="white" 
      borderRadius="lg"
      size="md"
    >
      <Thead bg="green.50">
        <Tr>
          <Th>Status</Th>
          <Th>Nome</Th>
          <Th>Tipo do Jogo</Th>
          <Th>Valor do Bilhete</Th>
          <Th>Data de Início</Th>
          <Th>Data de Fim</Th>
          <Th>Detalhes</Th>
        </Tr>
      </Thead>
      <Tbody>
        {currentJogos.map((jogo) => (
          <Tr key={jogo.jog_id}>
            <Td>
              <Badge
                colorScheme={getStatusColor(jogo.jog_status)}
                variant="solid"
              >
                {getStatusText(jogo.jog_status)}
              </Badge>
            </Td>
            <Td>{jogo.jog_nome}</Td>
            <Td>
              {gameTypes.find(type => type.game_type_id === jogo.jog_tipodojogo)?.name || 'N/A'}
            </Td>
            <Td>{formatCurrency(jogo.jog_valorBilhete)}</Td>
            <Td>
              {jogo.data_inicio && !isNaN(new Date(jogo.data_inicio))
                ? new Date(jogo.data_inicio).toLocaleString()
                : 'N/A'}
            </Td>
            <Td>
              {jogo.data_fim && !isNaN(new Date(jogo.data_fim))
                ? new Date(jogo.data_fim).toLocaleString()
                : 'N/A'}
            </Td>
            <Td>
              <Button
                as={Link}
                href={`/bolao/${jogo.slug}`}
                colorScheme="green"
                size="sm"
              >
                Ver Detalhes
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  </Box>

  {/* Versão Mobile - Cards */}
  <Box display={{ base: 'block', lg: 'none' }}>
    {currentJogos.map((jogo) => (
      <Card 
        key={jogo.jog_id} 
        mb={4} 
        borderRadius="lg" 
        overflow="hidden"
        boxShadow="sm"
      >
        <CardBody p={4}>
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Badge
              colorScheme={getStatusColor(jogo.jog_status)}
              variant="solid"
              fontSize="sm"
            >
              {getStatusText(jogo.jog_status)}
            </Badge>
            <Text fontSize="sm" fontWeight="bold">
              {formatCurrency(jogo.jog_valorBilhete)}
            </Text>
          </Flex>

          <Text fontSize="md" fontWeight="bold" mb={2}>
            {jogo.jog_nome}
          </Text>

          <Text fontSize="sm" color="gray.600" mb={2}>
            Tipo: {gameTypes.find(type => type.game_type_id === jogo.jog_tipodojogo)?.name || 'N/A'}
          </Text>

          <Box fontSize="sm" color="gray.600" mb={3}>
            <Flex direction="column" gap={1}>
              <Text>
                <Text as="span" fontWeight="medium">Início:</Text>{' '}
                {jogo.data_inicio && !isNaN(new Date(jogo.data_inicio))
                  ? new Date(jogo.data_inicio).toLocaleString()
                  : 'N/A'}
              </Text>
              <Text>
                <Text as="span" fontWeight="medium">Fim:</Text>{' '}
                {jogo.data_fim && !isNaN(new Date(jogo.data_fim))
                  ? new Date(jogo.data_fim).toLocaleString()
                  : 'N/A'}
              </Text>
            </Flex>
          </Box>

          <Button
            as={Link}
            href={`/bolao/${jogo.slug}`}
            colorScheme="green"
            size="sm"
            width="full"
          >
            Ver Detalhes
          </Button>
        </CardBody>
      </Card>
    ))}
  </Box>
</Box>
  
      {totalPages > 1 && (
        <Flex 
          justify="center" 
          align="center" 
          gap={{ base: 2, md: 4 }}
          px={2}
        >
          <Tooltip label="Página Anterior">
            <IconButton
              aria-label="Página Anterior"
              icon={<ChevronLeft />}
              onClick={handlePreviousPage}
              isDisabled={currentPage === 1}
              variant="outline"
              colorScheme="green"
              size={{ base: "sm", md: "md" }}
            />
          </Tooltip>
          <Text fontSize={{ base: "sm", md: "md" }}>
            Página {currentPage} de {totalPages}
          </Text>
          <Tooltip label="Próxima Página">
            <IconButton
              aria-label="Próxima Página"
              icon={<ChevronRight />}
              onClick={handleNextPage}
              isDisabled={currentPage === totalPages}
              variant="outline"
              colorScheme="green"
              size={{ base: "sm", md: "md" }}
            />
          </Tooltip>
        </Flex>
      )}
    </Container>
  );
}
