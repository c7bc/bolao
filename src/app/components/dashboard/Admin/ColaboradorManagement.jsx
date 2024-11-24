// src/app/components/dashboard/Admin/ColaboradorManagement.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import axios from 'axios';
import ColaboradorFormModal from './ColaboradorFormModal';
import ColaboradorEditModal from './ColaboradorEditModal';
import ColaboradorDetailsModal from './ColaboradorDetailsModal';

const ColaboradorManagement = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const fetchColaboradores = async () => {
    const response = await axios.get('/api/colaborador/list');
    setColaboradores(response.data.colaboradores);
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const handleEdit = (colaborador) => {
    setSelectedColaborador(colaborador);
    onEditOpen();
  };

  const handleViewDetails = (colaborador) => {
    setSelectedColaborador(colaborador);
    onDetailsOpen();
  };

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Colaboradores
      </Heading>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Colaborador
      </Button>
      <ColaboradorFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchColaboradores} />
      {selectedColaborador && (
        <>
          <ColaboradorEditModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            refreshList={fetchColaboradores}
            colaborador={selectedColaborador}
          />
          <ColaboradorDetailsModal
            isOpen={isDetailsOpen}
            onClose={onDetailsClose}
            colaborador={selectedColaborador}
          />
        </>
      )}
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
          {colaboradores.map((colaborador) => (
            <Tr key={colaborador.col_id}>
              <Td>{colaborador.col_nome}</Td>
              <Td>{colaborador.col_email}</Td>
              <Td>{colaborador.col_telefone}</Td>
              <Td>
                <Tooltip label="Editar Colaborador">
                  <IconButton
                    aria-label="Editar"
                    icon={<EditIcon />}
                    mr={2}
                    onClick={() => handleEdit(colaborador)}
                  />
                </Tooltip>
                <Tooltip label="Ver Detalhes">
                  <IconButton
                    aria-label="Detalhes"
                    icon={<ViewIcon />}
                    onClick={() => handleViewDetails(colaborador)}
                  />
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ColaboradorManagement;
