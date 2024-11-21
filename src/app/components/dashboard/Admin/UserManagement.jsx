// app/components/Admin/UserManagement.jsx

import React, { useState, useEffect } from 'react';
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

const UserManagement = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Gerenciamento de Usuários
      </Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Administradores</Tab>
          <Tab>Colaboradores</Tab>
          <Tab>Clientes</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <AdminList />
          </TabPanel>
          <TabPanel>
            <ColaboradorList />
          </TabPanel>
          <TabPanel>
            {/* Lista de clientes */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UserManagement;
