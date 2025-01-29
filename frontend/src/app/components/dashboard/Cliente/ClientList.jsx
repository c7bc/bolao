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
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { DeleteIcon, ViewIcon, EditIcon } from '@chakra-ui/icons';
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
  const isMobile = useBreakpointValue({ base: true, md: false });

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
  }, []);

  const handleViewDetails = (cliente) => {
    setSelectedCliente(cliente);
    setIsEditOpen(false);
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setIsEditOpen(true);
  };

  const handleDelete = async (clienteId) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este cliente?');
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
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
        <Button 
          colorScheme="green" 
          onClick={() => setIsCreateOpen(true)}
          size={{ base: 'sm', md: 'md' }}
        >
          Cadastrar Novo Cliente
        </Button>
      </Flex>

      {clientes.length === 0 ? (
        <Text>Nenhum cliente encontrado.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>Email</Th>
                <Th>Telefone</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {clientes.map((cliente) => (
                <Tr key={cliente.cli_id}>
                  <Td fontSize={{ base: 'xs', md: 'sm' }}>{cliente.cli_nome}</Td>
                  <Td 
                    fontSize={{ base: 'xs', md: 'sm' }}
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    {cliente.cli_email}
                  </Td>
                  <Td fontSize={{ base: 'xs', md: 'sm' }}>{cliente.cli_telefone}</Td>
                  <Td>
                    <Stack direction={{ base: 'column', md: 'row' }} spacing={1}>
                      {!isMobile && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleViewDetails(cliente)}
                          leftIcon={<ViewIcon />}
                        >
                          Detalhes
                        </Button>
                      )}
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={() => handleEdit(cliente)}
                        leftIcon={<EditIcon />}
                      >
                        {!isMobile && 'Editar'}
                      </Button>
                      <IconButton
                        aria-label="Excluir Cliente"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(cliente.cli_id)}
                      />
                    </Stack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {selectedCliente && !isEditOpen && (
        <ClienteDetails
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
          isMobile={isMobile}
        />
      )}

      {isEditOpen && selectedCliente && (
        <ClienteEditModal
          isOpen={isEditOpen}
          onClose={handleCloseEdit}
          cliente={selectedCliente}
          size={isMobile ? 'full' : 'xl'}
        />
      )}

      {isCreateOpen && (
        <ClienteCreateModal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          size={isMobile ? 'full' : 'xl'}
        />
      )}
    </Box>
  );
};

export default ClienteList;