// src/app/components/dashboard/Cliente/ClienteList.jsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Button,
  Flex,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import ClienteDetails from './ClienteDetails';
import ClienteEditModal from './ClienteEditModal';
import ClienteCreateModal from './ClienteCreateModal';

const ClienteList = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const toast = useToast();

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cliente/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClientes(response.data.clientes || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro ao carregar clientes.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewDetails = (cliente) => {
    setSelectedCliente(cliente);
    setIsEditOpen(false); // Certifique-se de que o modal de edição está fechado
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setIsEditOpen(true);
  };

  const handleDelete = async (clienteId) => {
    const confirmDelete = confirm('Tem certeza que deseja excluir este cliente?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/cliente/delete/${clienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Cliente excluído com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro ao excluir cliente.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedCliente(null);
    fetchClientes();
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    fetchClientes();
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Button colorScheme="green" onClick={() => setIsCreateOpen(true)}>
          Cadastrar Novo Cliente
        </Button>
      </Flex>
      {clientes.length === 0 ? (
        <Text>Nenhum cliente encontrado.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {clientes.map((cliente) => (
              <Tr key={cliente.cli_id}>
                <Td>{cliente.cli_nome}</Td>
                <Td>{cliente.cli_email}</Td>
                <Td>{cliente.cli_telefone}</Td>
                <Td>
                  <Flex>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      mr={2}
                      onClick={() => handleViewDetails(cliente)}
                    >
                      Detalhes
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="green"
                      mr={2}
                      onClick={() => handleEdit(cliente)}
                    >
                      Editar
                    </Button>
                    <IconButton
                      aria-label="Excluir Cliente"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(cliente.cli_id)}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Modal de Detalhes */}
      {selectedCliente && !isEditOpen && (
        <ClienteDetails
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
        />
      )}

      {/* Modal de Edição */}
      {isEditOpen && selectedCliente && (
        <ClienteEditModal
          isOpen={isEditOpen}
          onClose={handleCloseEdit}
          cliente={selectedCliente}
        />
      )}

      {/* Modal de Criação */}
      {isCreateOpen && (
        <ClienteCreateModal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
        />
      )}
    </Box>
  );
};

export default ClienteList;
