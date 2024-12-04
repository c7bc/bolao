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
import ClienteFormModal from '../Cliente/ClienteCreateModal';

const ClienteManagement = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token ausente');
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
        console.error('Erro ao obter clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

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
          {filteredClientes.map((cliente) => (
            <Tr key={cliente.cli_id}>
              <Td>{cliente.cli_nome}</Td>
              <Td>{cliente.cli_telefone}</Td>
              <Td>{cliente.cli_email}</Td>
              <Td>{cliente.cli_idcolaborador || 'Nenhum'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ClienteManagement;
