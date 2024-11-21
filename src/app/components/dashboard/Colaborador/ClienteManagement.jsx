// app/components/Colaborador/ClienteManagement.jsx

import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import axios from 'axios';
import ClienteFormModal from './ClienteFormModal';

const ClienteManagement = () => {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchClientes = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/colaborador/clientes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        telefone: searchTerm || undefined,
      },
    });
    setClientes(response.data.clientes);
  };

  useEffect(() => {
    fetchClientes();
  }, [searchTerm]);

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
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Telefone</Th>
            <Th>Email</Th>
          </Tr>
        </Thead>
        <Tbody>
          {clientes.map((cliente) => (
            <Tr key={cliente.cli_id}>
              <Td>{cliente.cli_nome}</Td>
              <Td>{cliente.cli_telefone}</Td>
              <Td>{cliente.cli_email}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ClienteManagement;
