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
  Stack,
  Text,
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
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAdmins(response.data.admins);
      } catch (error) {
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
  }, [toast]);

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
      const token = localStorage.getItem('token');
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
      <Button 
        colorScheme="green" 
        mb={4} 
        onClick={onOpen}
        size={{ base: 'sm', md: 'md' }}
      >
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

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx={{ base: 2, md: 0 }}>
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

      <Box overflowX="auto">
        <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
          <Thead>
            <Tr>
              <Th display={{ base: 'none', md: 'table-cell' }}>Nome</Th>
              <Th>Email</Th>
              <Th display={{ base: 'none', md: 'table-cell' }}>Status</Th>
              <Th display={{ base: 'none', lg: 'table-cell' }}>Função</Th>
              <Th display={{ base: 'none', lg: 'table-cell' }}>Data de Criação</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {admins.map((admin) => (
              <Tr key={admin.adm_id}>
                <Td 
                  display={{ base: 'none', md: 'table-cell' }}
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  {admin.adm_nome}
                </Td>
                <Td fontSize={{ base: 'xs', md: 'sm' }}>{admin.adm_email}</Td>
                <Td 
                  display={{ base: 'none', md: 'table-cell' }}
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  {admin.adm_status}
                </Td>
                <Td 
                  display={{ base: 'none', lg: 'table-cell' }}
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  {admin.adm_role}
                </Td>
                <Td 
                  display={{ base: 'none', lg: 'table-cell' }}
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  {new Date(admin.adm_datacriacao).toLocaleDateString()}
                </Td>
                <Td>
                  <Stack direction={{ base: 'column', md: 'row' }} spacing={1}>
                    <IconButton
                      aria-label="Editar Admin"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEdit(admin)}
                    />
                    <IconButton
                      aria-label="Deletar Admin"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteClick(admin)}
                    />
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      
      {admins.length === 0 && (
        <Text mt={4} textAlign="center">
          Nenhum administrador encontrado
        </Text>
      )}
    </Box>
  );
};

export default AdminList;