import React, { useState } from "react";
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
  Card,
  CardBody,
  Stack,
  Heading,
  IconButton,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { FaEye } from "react-icons/fa";

// Data arrays
const poolsData = [
  {
    id: 1,
    title: "Bolão de Segunda",
    entryValue: "R$ 10,00",
    prizeValue: "R$ 50.000,00",
    startTime: "2024-11-18T15:00:00",
    requiredPoints: "10 pontos",
    status: "open",
    totalPrizes: 3,
    participants: 245,
  },
  {
    id: 2,
    title: "Bolão da Sorte",
    entryValue: "R$ 5,00",
    prizeValue: "R$ 25.000,00",
    startTime: "2024-11-19T14:00:00",
    requiredPoints: "8 pontos",
    status: "open",
    totalPrizes: 5,
    participants: 180,
  },
  {
    id: 3,
    title: "Super Bolão",
    entryValue: "R$ 15,00",
    prizeValue: "R$ 75.000,00",
    startTime: "2024-11-20T16:00:00",
    requiredPoints: "12 pontos",
    status: "upcoming",
    totalPrizes: 2,
    participants: 0,
  },
];

const ticketsData = [
  {
    id: "12345",
    player: "João Silva",
    city: "São Paulo",
    numbers: [14, 25, 36, 48, 57, 63, 72, 81, 90, 99],
    currentPoints: 4,
    poolTitle: "Bolão de Segunda",
    poolStartTime: "2024-11-18T15:00:00",
    poolStatus: "open",
    seller: "Carlos Oliveira",
    purchaseDate: "2024-11-15T10:00:00",
    phone: "9988xxx655",
    betDetails: {
      title: "Bolão de Segunda",
      contests: 10,
      poolStartTime: "2024-11-18T15:00:00",
      poolStatus: "open",
      ticketNumber: "12345",
      quantityPurchased: 1,
      bettor: "João Silva",
      city: "São Paulo",
      seller: "Carlos Oliveira",
      purchaseDate: "2024-11-15T10:00:00",
      phone: "9988xxx655",
    },
  },
  {
    id: "12346",
    player: "Maria Santos",
    city: "Rio de Janeiro",
    numbers: [10, 20, 30, 40, 50, 60, 70, 80, 90, 95],
    currentPoints: 6,
    poolTitle: "Bolão da Sorte",
    poolStartTime: "2024-11-19T14:00:00",
    poolStatus: "open",
    seller: "José Almeida",
    purchaseDate: "2024-11-16T14:30:00",
    phone: "9988xxx611",
    betDetails: {
      title: "Bolão da Sorte",
      contests: 10,
      poolStartTime: "2024-11-19T14:00:00",
      poolStatus: "open",
      ticketNumber: "12346",
      quantityPurchased: 1,
      bettor: "Maria Santos",
      city: "Rio de Janeiro",
      seller: "José Almeida",
      purchaseDate: "2024-11-16T14:30:00",
      phone: "9988xxx611",
    },
  },
];

const filterOptions = [
  { label: "Todos os Status", value: "all" },
  { label: "Em Andamento", value: "open" },
  { label: "Próximos", value: "upcoming" },
  { label: "Encerrados", value: "closed" },
];

export default function LotteryPools() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchType, setSearchType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState(ticketsData);

  const containerMaxWidth = useBreakpointValue({
    base: "container.sm",
    md: "container.xl",
  });

  const isMobile = useBreakpointValue({ base: true, md: false });

  const calculateTimeRemaining = (startTime) => {
    const diff = new Date(startTime) - new Date();
    if (diff <= 0) return "Em andamento";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSearch = () => {
    const filters = {
      ticket: (ticket) => ticket.id.includes(searchTerm),
      player: (ticket) => ticket.player.toLowerCase().includes(searchTerm.toLowerCase()),
      numbers: (ticket) => ticket.numbers.some((num) => num.toString().includes(searchTerm)),
      city: (ticket) => ticket.city.toLowerCase().includes(searchTerm.toLowerCase()),
    };
    
    setFilteredTickets(ticketsData.filter(filters[searchType] || (() => true)));
  };

  const handleTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const searchButtons = [
    { label: "Buscar por Nº Bilhete", value: "ticket" },
    { label: "Buscar por Apostador", value: "player" },
    { label: "Buscar por Dezenas", value: "numbers" },
    { label: "Buscar por Cidade", value: "city" },
  ];

  const filterOptions = [
    { label: "Todos", value: "all" },
    { label: "Em andamento", value: "open" },
    { label: "Em breve", value: "upcoming" },
  ];

  const renderSearchButtons = () => {
    return searchButtons.map(({ label, value }) => (
      <Button
        key={value}
        onClick={() => setSearchType(value)}
        colorScheme={searchType === value ? "green" : "gray"}
        size="lg"
        w={{ base: "full", md: "auto" }}
        borderColor={searchType === value ? "green.400" : "gray.200"}
        _hover={{ borderColor: searchType === value ? "green.400" : "gray.300" }}
      >
        {label}
      </Button>
    ));
  };

  const renderPools = () => {
    return poolsData.map((pool) => (
      <Card
        key={pool.id}
        border="1px"
        borderColor="green.200"
        bg="green.50"
        _hover={{ transform: "translateY(-2px)", transition: "transform 0.2s" }}
      >
        <CardBody>
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={4}>
            <Box>
              <Flex align="center" gap={2} mb={2}>
                <Heading size="md" color="green.800">{pool.title}</Heading>
                <Badge colorScheme={pool.status === "open" ? "green" : "yellow"} fontSize="sm">
                  {pool.status === "open" ? "Em andamento" : "Em breve"}
                </Badge>
              </Flex>
              <Stack spacing={1}>
                <Text color="green.700">Valor da entrada: {pool.entryValue}</Text>
                <Text color="green.700">Prêmio: {pool.prizeValue}</Text>
                <Text color="green.700">Pontos necessários: {pool.requiredPoints}</Text>
              </Stack>
            </Box>
            <Flex direction={{ base: "column", md: "row" }} align="center" gap={4}>
              <Box textAlign="center">
                <Text fontSize="sm" color="green.600">Início em</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.800">
                  {calculateTimeRemaining(pool.startTime)}
                </Text>
              </Box>
              <Button colorScheme="green" size="lg" w={{ base: "full", md: "auto" }}>Participar</Button>
              <Button colorScheme="white" color="green.600" size="lg" border="2px" w={{ base: "full", md: "auto" }} _hover={{ color: "green.700" }}>
                Detalhes
              </Button>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    ));
  };

  const renderTicketsTable = () => {
    return filteredTickets.map((ticket) => (
      <Tr key={ticket.id}>
        <Td><Button colorScheme="green" size="sm" onClick={() => handleTicketDetails(ticket)}><FaEye /></Button></Td>
        <Td fontWeight="medium">{ticket.id}</Td>
        <Td>{ticket.player}</Td>
        <Td>{ticket.city}</Td>
        <Td><Flex gap={1} flexWrap="wrap">{ticket.numbers.map((num) => <Badge key={num} colorScheme="green" variant="subtle">{num}</Badge>)}</Flex></Td>
        <Td isNumeric fontWeight="bold" color="green.600">{ticket.currentPoints}</Td>
      </Tr>
    ));
  };

  return (
    <Container maxW={containerMaxWidth} py={12}> {/* Aumentei o padding vertical para mais espaçamento */}
      <Heading as="h2" size="xl" color="green.800" textAlign="center" mb={8}>
        Bolões Disponíveis
      </Heading>
      
      <Flex gap={6} mb={8} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }}>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          bg="white"
          borderColor="green.200"
          _hover={{ borderColor: "green.300" }}
          mb={{ base: 4, md: 0 }} // Adicionando margem inferior em telas pequenas
        >
          {filterOptions.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Flex flex={1} gap={4}>
          <Input
            placeholder="Buscar por bilhete ou apostador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
            borderColor="green.200"
            _hover={{ borderColor: "green.300" }}
            mb={{ base: 4, md: 0 }} // Margem inferior em telas pequenas
          />
          <IconButton
            aria-label="Buscar"
            icon={<SearchIcon />}
            colorScheme="green"
            onClick={handleSearch}
            mb={{ base: 4, md: 0 }} // Margem inferior em telas pequenas
          />
        </Flex>
      </Flex>
  
      <Box mb={8}>
        {renderPools().map((pool, index) => (
          <Box key={pool.id} mb={4}> {/* Aqui adicionei a margem inferior aos cards */}
            {pool}
          </Box>
        ))}
      </Box>
  
      <Box overflowX="auto" mb={12}> {/* Aumentando a margem inferior aqui para espaçamento extra */}
        <Heading as="h2" size="xl" color="green.800" textAlign="center" mb={8}>
          Filtros
        </Heading>
        <Flex gap={6} mb={6} direction="row" align="center" justify="center" flexWrap="wrap">
          {renderSearchButtons()}
        </Flex>
  
        {searchType && (
          <Flex gap={4} mb={6} align="center">
            <Input
              placeholder={`Digite o ${searchType === "ticket" ? "nº do bilhete" : searchType === "player" ? "nome do apostador" : searchType === "numbers" ? "número da dezena" : "nome da cidade"}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
              borderColor="green.200"
              _hover={{ borderColor: "green.300" }}
              mb={4} // Adicionando margem inferior
            />
            <Button onClick={handleSearch} colorScheme="green" mb={4}> {/* Aumentei a margem inferior para mais espaçamento */}
              Buscar
            </Button>
            <Button
              onClick={() => {
                setSearchTerm("");
                setFilteredTickets(ticketsData);
              }}
              colorScheme="red"
              mb={4} // Adicionando margem inferior
            >
              Cancelar
            </Button>
          </Flex>
        )}
  
        <Table variant="simple" bg="white" borderRadius="lg">
          <Thead bg="green.50">
            <Tr>
              <Th>Detalhes</Th>
              <Th>Bilhete</Th>
              <Th>Apostador</Th>
              <Th>Cidade</Th>
              <Th>Dezenas</Th>
              <Th isNumeric>Pontos</Th>
            </Tr>
          </Thead>
          <Tbody>{renderTicketsTable()}</Tbody>
        </Table>
      </Box>
      
      {/* Modal para Detalhes do Bilhete */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Bilhete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTicket && (
              <Box>
                <Text fontWeight="bold">Bilhete: {selectedTicket.id}</Text>
                <Text>Apostador: {selectedTicket.player}</Text>
                <Text>Cidade: {selectedTicket.city}</Text>
                <Text>Dezenas: {selectedTicket.numbers.join(", ")}</Text>
                <Text>Pontos: {selectedTicket.currentPoints}</Text>
                <Text>Bolão: {selectedTicket.poolTitle}</Text>
                <Text>Início: {new Date(selectedTicket.poolStartTime).toLocaleString()}</Text>
                <Text>Status: {selectedTicket.poolStatus === "open" ? "Em andamento" : "Em breve"}</Text>
                <Text>Vendedor: {selectedTicket.seller}</Text>
                <Text>Data de Compra: {new Date(selectedTicket.purchaseDate).toLocaleString()}</Text>
                <Text>Telefone: {selectedTicket.phone}</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  
      <Flex justify="center" mt={8} gap={4}> {/* Aumentando a margem superior para mais espaçamento */}
        <IconButton aria-label="Previous page" icon={<ChevronLeftIcon />} variant="outline" colorScheme="green" />
        <IconButton aria-label="Next page" icon={<ChevronRightIcon />} variant="outline" colorScheme="green" />
      </Flex>
    </Container>
  );
  

}

