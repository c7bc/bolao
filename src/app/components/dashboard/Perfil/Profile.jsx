import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Flex,
  Avatar,
  Badge,
  Stack,
} from '@chakra-ui/react';
import { EmailIcon, PhoneIcon, CalendarIcon, CheckCircleIcon, CloseIcon } from '@chakra-ui/icons';
import axios from 'axios';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token'); // Obtém o token do localStorage
        const response = await axios.get('/api/user/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserProfile(response.data.user);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erro ao carregar as informações do perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" mt={20}>
        <Spinner size="xl" />
        <Text mt={4}>Carregando informações do perfil...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={20}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  const {
    cli_nome,
    cli_email,
    cli_telefone,
    cli_status,
    cli_datacriacao,
  } = userProfile;

  return (
    <Box p={6}>
      <Flex alignItems="center" mb={6}>
        <Avatar name={cli_nome} size="xl" />
        <Box ml={4}>
          <Heading size="lg">{cli_nome}</Heading>
          <Badge colorScheme={cli_status === 'active' ? 'green' : 'red'}>
            {cli_status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </Box>
      </Flex>
      <Divider mb={6} />

      <VStack align="start" spacing={4}>
        <Flex align="center">
          <Icon as={EmailIcon} mr={2} />
          <Text>
            <strong>E-mail:</strong> {cli_email}
          </Text>
        </Flex>

        <Flex align="center">
          <Icon as={PhoneIcon} mr={2} />
          <Text>
            <strong>Telefone:</strong> {cli_telefone}
          </Text>
        </Flex>

        <Flex align="center">
          <Icon as={CalendarIcon} mr={2} />
          <Text>
            <strong>Data de Criação:</strong>{' '}
            {new Date(cli_datacriacao).toLocaleDateString()}
          </Text>
        </Flex>
      </VStack>

      <Divider my={6} />

      <Heading size="md" mb={4}>
        Histórico de Transações
      </Heading>
      {userProfile.additionalInfo?.history?.length > 0 ? (
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Status</Th>
              <Th>Depósito</Th>
            </Tr>
          </Thead>
          <Tbody>
            {userProfile.additionalInfo.history.map((transaction) => (
              <Tr key={transaction.htc_transactionid}>
                <Td>{transaction.htc_transactionid}</Td>
                <Td>
                  {transaction.htc_status === 'completed' ? (
                    <Flex align="center">
                      <Icon as={CheckCircleIcon} color="green.500" mr={2} />
                      Concluído
                    </Flex>
                  ) : (
                    <Flex align="center">
                      <Icon as={CloseIcon} color="red.500" mr={2} />
                      Pendente
                    </Flex>
                  )}
                </Td>
                <Td>R$ {transaction.htc_deposito.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>Nenhuma transação encontrada.</Text>
      )}

      <Divider my={6} />

      <Heading size="md" mb={4}>
        Dados Adicionais
      </Heading>
      {userProfile.cli_idcolaborador ? (
        <Text>
          <strong>ID do Colaborador:</strong> {userProfile.cli_idcolaborador}
        </Text>
      ) : (
        <Text>Sem colaborador associado.</Text>
      )}
    </Box>
  );
};

export default Profile;
