import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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

const ColaboradorList = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchColaboradores = async () => {
    try {
      // Substitua pelo endpoint correto
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setColaboradores(response.data.colaboradores);
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  return (
    <Box>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Colaborador
      </Button>
      <ClienteFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchColaboradores} />
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Telefone</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {colaboradores.map((colaborador) => (
            <Tr key={colaborador.col_id}>
              <Td>{colaborador.col_nome}</Td>
              <Td>{colaborador.col_email}</Td>
              <Td>{colaborador.col_telefone}</Td>
              <Td>{colaborador.col_status}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ColaboradorList;
