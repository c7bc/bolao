// src/app/components/dashboard/Admin/AdminList.jsx

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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import AdminFormModal from './AdminFormModal';
import AdminEditModal from './AdminEditModal';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Estados para deleção
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [adminToDelete, setAdminToDelete] = useState(null);
  const cancelRef = React.useRef();
  const toast = useToast();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem('token'); // Ou onde você armazena o token
        const response = await axios.get('/api/admin/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAdmins(response.data.admins);
      } catch (error) {
        // Opcional: lidar com erros de autenticação, redirecionar para login, etc.
        toast({
          title: 'Erro ao buscar administradores.',
          description: error.response?.data?.error || 'Por favor, tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchAdmins();
  }, [toast]); // Adicionado 'toast' como dependência

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    onEditOpen();
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token'); // Ou onde você armazena o token
      await axios.delete('/api/admin/delete', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { adm_id: adminToDelete.adm_id },
      });

      toast({
        title: 'Administrador deletado.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Atualiza a lista de administradores após deleção
      setAdmins(admins.filter((admin) => admin.adm_id !== adminToDelete.adm_id));
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Erro ao deletar administrador.',
        description: error.response?.data?.error || 'Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onDeleteClose();
    }
  };

  return (
    <Box>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Administrador
      </Button>
      <AdminFormModal isOpen={isOpen} onClose={onClose} refreshList={() => {}} />
      {selectedAdmin && (
        <AdminEditModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          admin={selectedAdmin}
          refreshList={() => {}}
        />
      )}

      {/* AlertDialog para confirmação de deleção */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Deletar Administrador
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja deletar o administrador{' '}
              <strong>{adminToDelete?.adm_nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Deletar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Função</Th>
            <Th>Data de Criação</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {admins.map((admin) => (
            <Tr key={admin.adm_id}>
              <Td>{admin.adm_nome}</Td>
              <Td>{admin.adm_email}</Td>
              <Td>{admin.adm_status}</Td>
              <Td>{admin.adm_role}</Td>
              <Td>{new Date(admin.adm_datacriacao).toLocaleDateString()}</Td>
              <Td>
                <IconButton
                  aria-label="Editar Admin"
                  icon={<EditIcon />}
                  mr={2}
                  onClick={() => handleEdit(admin)}
                />
                <IconButton
                  aria-label="Deletar Admin"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleDeleteClick(admin)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AdminList;
