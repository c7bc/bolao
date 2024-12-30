// Caminho: src/app/components/dashboard/Colaborador/ClienteManagement.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Spinner,
  Flex,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import ClienteFormModal from '../Cliente/ClienteCreateModal'; // Verifique o caminho correto
import { useToast } from '@chakra-ui/react';

const ClienteManagement = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token ausente.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/colaborador/clientes/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.clientes) {
        setClientes(response.data.clientes);
        setFilteredClientes(response.data.clientes); // Inicialmente exibe todos
      } else {
        toast({
          title: 'Erro ao obter clientes.',
          description: 'Nenhum cliente encontrado.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro ao buscar clientes.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    // Filtrar localmente com base no número de telefone
    const results = clientes.filter((cliente) =>
      cliente.cli_telefone.includes(searchTerm)
    );
    setFilteredClientes(results);
  }, [searchTerm, clientes]);

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Clientes
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Cliente
      </Button>
      <ClienteFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchClientes} />
      <Input
        placeholder="Pesquisar por número de celular"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={4}
      />
      {loading ? (
        <Flex justify="center" align="center" mt="10">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Telefone</Th>
              <Th>Email</Th>
              <Th>ID do Colaborador</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredClientes.length > 0 ? (
              filteredClientes.map((cliente) => (
                <Tr key={cliente.cli_id}>
                  <Td>{cliente.cli_nome}</Td>
                  <Td>{cliente.cli_telefone}</Td>
                  <Td>{cliente.cli_email}</Td>
                  <Td>{cliente.cli_idcolaborador || 'Nenhum'}</Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={4} textAlign="center">
                  <Text>Nenhum cliente encontrado.</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ClienteManagement;
