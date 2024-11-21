// app/components/Admin/AdminList.jsx

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
import AdminFormModal from './AdminFormModal';

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchAdmins = async () => {
    // Substitua pelo endpoint correto
    const response = await axios.get('/api/admin/list');
    setAdmins(response.data.admins);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <Box>
      <Button colorScheme="green" mb={4} onClick={onOpen}>
        Cadastrar Administrador
      </Button>
      <AdminFormModal isOpen={isOpen} onClose={onClose} refreshList={fetchAdmins} />
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {admins.map((admin) => (
            <Tr key={admin.adm_id}>
              <Td>{admin.adm_nome}</Td>
              <Td>{admin.adm_email}</Td>
              <Td>{admin.adm_status}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AdminList;
