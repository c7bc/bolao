// src/app/components/ConcursosBlock.jsx

import React, { useState, useEffect } from "react";
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
  Heading
} from "@chakra-ui/react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from 'next/link';

export default function ConcursosBlock() {
  const [jogos, setJogos] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredJogos, setFilteredJogos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        let url = "/api/jogos/list";
        const params = new URLSearchParams();
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }
        if (searchTerm) {
          params.append("nome", searchTerm);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch jogos");
        }
        const data = await res.json();
        setJogos(data.jogos);
        setFilteredJogos(data.jogos);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar os jogos.");
        setIsLoading(false);
      }
    };

    fetchJogos();
  }, [statusFilter, searchTerm]);

  const handleSearch = () => {
    let filtered = jogos;

    if (statusFilter !== "all") {
      filtered = filtered.filter(jogo => jogo.jog_status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(jogo =>
        jogo.jog_nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJogos(filtered);
  };

  const handleReset = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setFilteredJogos(jogos);
  };

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" color="green.500" />
        <Text ml={4} fontSize="xl">Carregando...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text fontSize="xl" color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <Heading
        as="h2"
        size="xl"
        color="green.800"
        textAlign="center"
        mb={8}
      >
        Concursos Disponíveis
      </Heading>
      <Flex
        gap={6}
        mb={8}
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
      >
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          bg="white"
          borderColor="green.200"
          _hover={{ borderColor: "green.300" }}
          mb={{ base: 4, md: 0 }}
        >
          <option value="all">Todos os Status</option>
          <option value="open">Em Andamento</option>
          <option value="upcoming">Próximos</option>
          <option value="closed">Encerrados</option>
        </Select>
        <Flex flex={1} gap={4}>
          <Input
            placeholder="Buscar por nome do bolão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
            borderColor="green.200"
            _hover={{ borderColor: "green.300" }}
            mb={{ base: 4, md: 0 }}
          />
          <IconButton
            aria-label="Buscar"
            icon={<SearchIcon />}
            colorScheme="green"
            onClick={handleSearch}
            mb={{ base: 4, md: 0 }}
          />
          <Button
            onClick={handleReset}
            colorScheme="red"
            mb={{ base: 4, md: 0 }}
          >
            Resetar
          </Button>
        </Flex>
      </Flex>
      <Box overflowX="auto" mb={12}>
        <Table variant="striped" colorScheme="green" bg="white" borderRadius="lg">
          <Thead bg="green.50">
            <Tr>
              <Th>Status</Th>
              <Th>Nome</Th>
              <Th>Tipo do Jogo</Th>
              <Th>Valor do Ticket (R$)</Th>
              <Th>Prêmio (R$)</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredJogos.map((jogo) => (
              <Tr key={jogo.jog_id}>
                <Td>
                  <Badge
                    colorScheme={jogo.jog_status === 'open' ? 'green' : jogo.jog_status === 'closed' ? 'red' : 'yellow'}
                    variant="solid"
                  >
                    {jogo.jog_status === 'open' ? 'Em andamento' : 
                     jogo.jog_status === 'closed' ? 'Encerrado' : 'Em breve'}
                  </Badge>
                </Td>
                <Td>{jogo.jog_nome}</Td>
                <Td>{jogo.jog_tipodojogo}</Td>
                <Td>{jogo.jog_valorjogo ? `R$ ${jogo.jog_valorjogo}` : 'N/A'}</Td>
                <Td>{jogo.jog_valorpremio ? `R$ ${jogo.jog_valorpremio}` : 'N/A'}</Td>
                <Td>
                  <Link href={`/bolao/${jogo.slug}`} passHref>
                    <Button colorScheme="green" size="sm" as="a">
                      Ver Detalhes
                    </Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      <Flex justify="center" mt={8} gap={4}>
        <IconButton
          aria-label="Página Anterior"
          icon={<ChevronLeftIcon />}
          variant="outline"
          colorScheme="green"
        />
        <IconButton
          aria-label="Próxima Página"
          icon={<ChevronRightIcon />}
          variant="outline"
          colorScheme="green"
        />
      </Flex>
    </Container>
  );
}
