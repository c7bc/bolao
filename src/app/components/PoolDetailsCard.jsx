// src/app/components/PoolDetailsCard.jsx

"use client"; // Indicates that this is a client component

import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Stack,
  Badge,
  Icon,
  Flex,
  Divider,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaTicketAlt,
  FaMoneyCheckAlt,
  FaUsers,
  FaRegCalendarAlt,
  FaRegClock,
  FaCreditCard,
  FaHandshake,
  FaGem,
  FaRegFileAlt,
} from 'react-icons/fa';
import { FaPix } from 'react-icons/fa6';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation'; // Updated to next/navigation

// PrizeDetails Component
const PrizeDetails = ({ entryValue, prizeValue }) => (
  <Flex
    justify="space-between"
    align="center"
    mb={6}
    p={4}
    bgGradient="linear(to-r, green.400, green.500)"
    borderRadius="lg"
    boxShadow="lg"
    color="white"
    flexWrap="wrap"
  >
    <Flex align="center" mb={{ base: 2, md: 0 }}>
      <Icon as={FaTicketAlt} boxSize={6} />
      <Text fontSize="lg" fontWeight="bold" ml={2}>
        Entrada
      </Text>
    </Flex>
    <Text fontSize="xl" fontWeight="bold" mb={{ base: 2, md: 0 }}>
      {entryValue ? `R$ ${entryValue}` : 'N/A'}
    </Text>

    <Divider orientation="vertical" borderColor="white" height="40px" mx={4} />

    <Flex align="center" mb={{ base: 2, md: 0 }}>
      <Icon as={FaGem} boxSize={6} />
      <Text fontSize="lg" fontWeight="bold" ml={2}>
        Prêmio
      </Text>
    </Flex>
    <Text fontSize="xl" fontWeight="bold">
      {prizeValue ? `R$ ${prizeValue}` : 'N/A'}
    </Text>
  </Flex>
);

// StatusAndStartTime Component
const StatusAndStartTime = ({
  requiredPoints,
  status,
  startTime,
  participants,
}) => {
  const isValidDate = (date) => !isNaN(new Date(date).getTime());

  return (
    <Flex
      direction="column"
      gap={6}
      mb={6}
      p={4}
      bg="green.100"
      borderRadius="lg"
      boxShadow="lg"
    >
      <Flex justify="space-between" align="center">
        <Flex align="center">
          <Icon as={FaRegCalendarAlt} boxSize={6} color="green.500" />
          <Text
            fontSize="lg"
            color="green.700"
            fontWeight="bold"
            ml={2}
          >
            Pontos Necessários
          </Text>
        </Flex>
        <Text fontSize="xl" color="green.700">
          {requiredPoints || 'N/A'}
        </Text>
      </Flex>

      <Flex justify="space-between" align="center">
        <Flex align="center">
          <Icon as={FaRegClock} boxSize={6} color="green.500" />
          <Text
            fontSize="lg"
            color="green.700"
            fontWeight="bold"
            ml={2}
          >
            Status
          </Text>
        </Flex>
        <Badge
          colorScheme={
            status === 'open'
              ? 'green'
              : status === 'closed'
              ? 'red'
              : 'yellow'
          }
          fontSize="xl"
          variant="solid"
        >
          {status === 'open'
            ? 'Em andamento'
            : status === 'closed'
            ? 'Encerrado'
            : 'Em breve'}
        </Badge>
      </Flex>

      <Flex justify="space-between" align="center">
        <Flex align="center">
          <Icon as={FaRegCalendarAlt} boxSize={6} color="green.500" />
          <Text
            fontSize="lg"
            color="green.700"
            fontWeight="bold"
            ml={2}
          >
            Início
          </Text>
        </Flex>
        <Text fontSize="xl" color="green.700">
          {isValidDate(startTime)
            ? new Date(startTime).toLocaleString()
            : 'Data inválida'}
        </Text>
      </Flex>

      <Flex justify="space-between" align="center">
        <Flex align="center">
          <Icon as={FaUsers} boxSize={6} color="green.500" />
          <Text
            fontSize="lg"
            color="green.700"
            fontWeight="bold"
            ml={2}
          >
            Participantes
          </Text>
        </Flex>
        <Text fontSize="xl" color="green.700">
          {participants !== undefined ? participants : 'N/A'}
        </Text>
      </Flex>
    </Flex>
  );
};

// PaymentMethods Component
const PaymentMethods = ({ acceptedPayments = [] }) => {
  if (!Array.isArray(acceptedPayments) || acceptedPayments.length === 0) {
    return (
      <Badge colorScheme="gray" variant="outline" px={4} py={2} fontSize="lg">
        Métodos de Pagamento Indefinidos
      </Badge>
    );
  }

  return (
    <Flex gap={4} wrap="wrap" mb={6}>
      {acceptedPayments.map((payment, index) => {
        let icon;
        const paymentLower = payment.toLowerCase();

        if (paymentLower === 'pix') {
          icon = FaPix;
        } else if (paymentLower === 'boleto') {
          icon = FaRegFileAlt; // Icon for Boleto
        } else if (paymentLower.includes('cartão')) {
          icon = FaCreditCard;
        } else {
          icon = FaCreditCard; // Default for other methods
        }

        return (
          <Badge
            key={index}
            colorScheme="green"
            variant="solid"
            px={4}
            py={2}
            fontSize="lg"
            display="flex"
            alignItems="center"
          >
            <Icon as={icon} color="white" boxSize={5} mr={2} />
            {payment}
          </Badge>
        );
      })}
    </Flex>
  );
};

// PoolDetailsExtras Component
const PoolDetailsExtras = () => (
  <Box
    borderTop="1px"
    borderColor="green.200"
    pt={6}
    bg="green.50"
    borderRadius="lg"
    boxShadow="lg"
  >
    <Text
      fontSize="lg"
      color="green.800"
      fontWeight="bold"
      textAlign="center"
      mb={4}
    >
      Detalhes do Bolão
    </Text>
    <Stack spacing={6} direction="column" align="center">
      <Flex align="center">
        <Icon as={FaTicketAlt} color="green.400" boxSize={8} />
        <Text
          fontSize="lg"
          ml={2}
          fontWeight="bold"
          color="green.600"
        >
          Bilhete
        </Text>
      </Flex>
      <Flex align="center">
        <Icon as={FaMoneyCheckAlt} color="green.400" boxSize={8} />
        <Text
          fontSize="lg"
          ml={2}
          fontWeight="bold"
          color="green.600"
        >
          Métodos de Pagamento
        </Text>
      </Flex>
      <Flex align="center">
        <Icon as={FaUsers} color="green.400" boxSize={8} />
        <Text
          fontSize="lg"
          ml={2}
          fontWeight="bold"
          color="green.600"
        >
          Participantes
        </Text>
      </Flex>
      <Flex align="center">
        <Icon as={FaHandshake} color="green.400" boxSize={8} />
        <Text
          fontSize="lg"
          ml={2}
          fontWeight="bold"
          color="green.600"
        >
          Interação
        </Text>
      </Flex>
    </Stack>
  </Box>
);

// Main PoolDetailsCard Component
const PoolDetailsCard = ({ pool }) => {
  const router = useRouter();

  if (!pool) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="green.500" />
      </Flex>
    );
  }

  return (
    <Box
      p={6}
      bg="white"
      boxShadow="2xl"
      borderRadius="lg"
      maxW="4xl"
      mx="auto"
      mb={8}
    >
      <Heading
        as="h2"
        size="2xl"
        color="green.800"
        mb={6}
        textAlign="center"
        bgGradient="linear(to-r, green.400, green.500)"
        bgClip="text"
      >
        {pool.title || 'Título Indefinido'}
      </Heading>

      <PrizeDetails
        entryValue={pool.entryValue}
        prizeValue={pool.prizeValue}
      />

      <StatusAndStartTime
        requiredPoints={pool.requiredPoints}
        status={pool.status}
        startTime={pool.startTime}
        participants={pool.participants}
      />

      <PaymentMethods acceptedPayments={pool.acceptedPayments} />

      <Button
        colorScheme="green"
        size="lg"
        mb={4}
        width="full"
        mt={6}
        aria-label="Participar no Bolão"
        onClick={() => router.push('/participar')} // Uses router.push correctly
      >
        Participar
      </Button>

      <PoolDetailsExtras />
    </Box>
  );
};

// PropTypes for validation
PoolDetailsCard.propTypes = {
  pool: PropTypes.shape({
    title: PropTypes.string,
    entryValue: PropTypes.string, // Optional
    prizeValue: PropTypes.string, // Valor do Prêmio
    requiredPoints: PropTypes.string,
    status: PropTypes.string,
    startTime: PropTypes.string,
    participants: PropTypes.number,
    acceptedPayments: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default PoolDetailsCard;
