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
  IconButton,
  Flex,
  Text,
  useToast,
} from '@chakra-ui/react';
import { EditIcon, InfoIcon, DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import ColaboradorFormModal from './ColaboradorFormModal';
import ColaboradorEditModal from './ColaboradorEditModal';
import AccountDetails from './AccountDetails';
import Referrals from './Referrals';
import GameHistory from './GameHistory';
import CommissionHistory from './CommissionHistory';

const ColaboradorList = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [currentColaborador, setCurrentColaborador] = useState(null);
  const [userRole, setUserRole] = useState('');
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const fetchColaboradores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setColaboradores(response.data.colaboradores);

      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const handleEdit = (colaborador) => {
    setCurrentColaborador(colaborador);
    onEditOpen();
  };

  const handleDelete = async (colaboradorId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/colaborador/delete/${colaboradorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Colaborador excluído com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchColaboradores();
    } catch (error) {
      toast({
        title: 'Erro ao excluir colaborador.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Button colorScheme="green" onClick={onOpen}>
          Cadastrar Colaborador
        </Button>
      </Flex>
      <ColaboradorFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchColaboradores} />
      <ColaboradorEditModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        colaborador={currentColaborador}
        refreshList={fetchColaboradores}
      />
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Telefone</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {colaboradores.map((colaborador) => (
            <Tr key={colaborador.col_id}>
              <Td>{colaborador.col_nome}</Td>
              <Td>{colaborador.col_email}</Td>
              <Td>{colaborador.col_telefone}</Td>
              <Td>{colaborador.col_status}</Td>
              <Td>
                <Flex>
                  <IconButton
                    aria-label="Detalhes"
                    icon={<InfoIcon />}
                    mr={2}
                    onClick={() => setCurrentColaborador(colaborador)}
                  />
                  {userRole === 'superadmin' && (
                    <>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        mr={2}
                        onClick={() => handleEdit(colaborador)}
                      />
                      <IconButton
                        aria-label="Excluir"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        onClick={() => handleDelete(colaborador.col_id)}
                      />
                    </>
                  )}
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {currentColaborador && (
        <Box mt={6}>
          <AccountDetails colaboradorId={currentColaborador.col_id} />
          <Referrals colaboradorId={currentColaborador.col_id} />
          <GameHistory colaboradorId={currentColaborador.col_id} />
          <CommissionHistory colaboradorId={currentColaborador.col_id} />
        </Box>
      )}
    </Box>
  );
};

export default ColaboradorList;
