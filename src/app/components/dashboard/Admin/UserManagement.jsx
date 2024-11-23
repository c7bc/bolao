// src/app/components/dashboard/Admin/UserManagement.jsx

import React from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import AdminList from './AdminList';
import ColaboradorList from '../Colaborador/ColaboradorList';
import ClienteList from '../Cliente/ClientList';

const UserManagement = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={4} color="green.500">
        Gerenciamento de Usuários
      </Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab color="green.500" _selected={{ color: "green.700" }}>
            Administradores
          </Tab>
          <Tab color="green.500" _selected={{ color: "green.700" }}>
            Colaboradores
          </Tab>
          <Tab color="green.500" _selected={{ color: "green.700" }}>
            Clientes
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <AdminList />
          </TabPanel>
          <TabPanel>
            <ColaboradorList />
          </TabPanel>
          <TabPanel>
            <ClienteList />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UserManagement;
