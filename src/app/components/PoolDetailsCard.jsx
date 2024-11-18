import React from 'react';
import { Box, Heading, Text, Button, Stack, Badge, Icon, Flex, Divider } from '@chakra-ui/react';
import { FaTicketAlt, FaMoneyCheckAlt, FaUsers, FaRegCalendarAlt, FaRegClock, FaCreditCard, FaHandshake, FaGem, FaRegFileAlt } from 'react-icons/fa';
import { FaPix } from "react-icons/fa6";

// Componente para exibir o valor da entrada e o prêmio com ícones
const PrizeDetails = ({ entryValue, prizeValue }) => (
  <Flex justify="space-between" align="center" mb={6} p={4} bg="green.500" borderRadius="lg" boxShadow="lg">
    <Flex align="center">
      <Icon as={FaTicketAlt} color="white" boxSize={6} />
      <Text fontSize="lg" fontWeight="bold" color="white" ml={2}>Entrada</Text>
    </Flex>
    <Text fontSize="xl" fontWeight="bold" color="white">{entryValue}</Text>

    <Divider orientation="vertical" borderColor="white" height="40px" mx={4} />

    <Flex align="center">
      <Icon as={FaGem} color="white" boxSize={6} />
      <Text fontSize="lg" fontWeight="bold" color="white" ml={2}>Prêmio</Text>
    </Flex>
    <Text fontSize="xl" fontWeight="bold" color="white">{prizeValue}</Text>
  </Flex>
);

// Componente para exibir o status, a data de início e os pontos necessários com ícones
const StatusAndStartTime = ({ requiredPoints, status, startTime, participants }) => (
  <Flex direction="column" gap={6} mb={6} p={4} bg="green.100" borderRadius="lg" boxShadow="lg">
    <Flex justify="space-between" align="center">
      <Flex align="center">
        <Icon as={FaRegCalendarAlt} color="green.500" boxSize={6} />
        <Text fontSize="lg" color="green.700" fontWeight="bold" ml={2}>Pontos Necessários</Text>
      </Flex>
      <Text fontSize="xl" color="green.700">{requiredPoints}</Text>
    </Flex>

    <Flex justify="space-between" align="center">
      <Flex align="center">
        <Icon as={FaRegClock} color="green.500" boxSize={6} />
        <Text fontSize="lg" color="green.700" fontWeight="bold" ml={2}>Status</Text>
      </Flex>
      <Text fontSize="xl" color={status === "open" ? "green.800" : "orange.500"}>{status === "open" ? "Em andamento" : "Em breve"}</Text>
    </Flex>

    <Flex justify="space-between" align="center">
      <Flex align="center">
        <Icon as={FaRegCalendarAlt} color="green.500" boxSize={6} />
        <Text fontSize="lg" color="green.700" fontWeight="bold" ml={2}>Início</Text>
      </Flex>
      <Text fontSize="xl" color="green.700">{new Date(startTime).toLocaleString()}</Text>
    </Flex>

    <Flex justify="space-between" align="center">
      <Flex align="center">
        <Icon as={FaUsers} color="green.500" boxSize={6} />
        <Text fontSize="lg" color="green.700" fontWeight="bold" ml={2}>Participantes</Text>
      </Flex>
      <Text fontSize="xl" color="green.700">{participants}</Text>
    </Flex>
  </Flex>
);

// Componente para exibir os métodos de pagamento com ícones
const PaymentMethods = ({ acceptedPayments }) => (
  <Flex gap={4} wrap="wrap" mb={6}>
    {acceptedPayments.map((payment, index) => {
      let icon;
      if (payment === 'Pix') {
        icon = FaPix;
      } else if (payment === 'Boleto') {
        icon = FaRegFileAlt; // Novo ícone para Boleto
      } else {
        icon = FaCreditCard;
      }

      return (
        <Badge key={index} colorScheme="green" variant="solid" px={4} py={2} fontSize="lg">
          <Icon as={icon} color="white" boxSize={5} mr={2} />
          {payment}
        </Badge>
      );
    })}
  </Flex>
);

// Componente para exibir os ícones de detalhes do bolão
const PoolDetailsExtras = () => (
  <Box borderTop="1px" borderColor="green.200" pt={6} bg="green.50" borderRadius="lg" boxShadow="lg">
    <Text fontSize="lg" color="green.800" fontWeight="bold" textAlign="center" mb={4}>
      Detalhes do Bolão
    </Text>
    <Stack spacing={6} direction="column" align="center">
      <Flex align="center">
        <Icon as={FaTicketAlt} color="green.400" boxSize={8} />
        <Text fontSize="lg" ml={2} fontWeight="bold" color="green.600">Bilhete</Text>
      </Flex>
      <Flex align="center">
        <Icon as={FaMoneyCheckAlt} color="green.400" boxSize={8} />
        <Text fontSize="lg" ml={2} fontWeight="bold" color="green.600">Métodos de Pagamento</Text>
      </Flex>
      <Flex align="center">
        <Icon as={FaUsers} color="green.400" boxSize={8} />
        <Text fontSize="lg" ml={2} fontWeight="bold" color="green.600">Participantes</Text>
      </Flex>
      <Flex align="center">
        <Icon as={FaHandshake} color="green.400" boxSize={8} />
        <Text fontSize="lg" ml={2} fontWeight="bold" color="green.600">Interação</Text>
      </Flex>
    </Stack>
  </Box>
);

export default function PoolDetailsCard({ pool }) {
  return (
    <Box p={6} bg="white" boxShadow="xl" borderRadius="md" maxW="4xl" mx="auto" mb={8}>
      <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
        {pool.title}
      </Heading>
      
      <PrizeDetails entryValue={pool.entryValue} prizeValue={pool.prizeValue} />
      
      <StatusAndStartTime
        requiredPoints={pool.requiredPoints}
        status={pool.status}
        startTime={pool.startTime}
        participants={pool.participants}
      />

      <PaymentMethods acceptedPayments={pool.acceptedPayments} />
      
      <Button colorScheme="green" size="lg" mb={4} width="full" mt={6}>Participar</Button>
      
      <PoolDetailsExtras />
    </Box>
  );
}
