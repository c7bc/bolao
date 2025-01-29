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
import ClienteList from '../Cliente/ClientList';

const UserManagement = () => {
  return (
    <Box p={{ base: 2, md: 4 }}>
      <Heading size="lg" mb={4} color="green.500" fontSize={{ base: 'xl', md: '2xl' }}>
        Gerenciamento de Usuários
      </Heading>
      <Tabs variant="enclosed">
        <TabList overflowX="auto" overflowY="hidden" whiteSpace="nowrap">
          <Tab 
            color="green.500" 
            _selected={{ color: "green.700" }}
            fontSize={{ base: 'sm', md: 'md' }}
            px={{ base: 2, md: 4 }}
          >
            Administradores
          </Tab>
          <Tab 
            color="green.500" 
            _selected={{ color: "green.700" }}
            fontSize={{ base: 'sm', md: 'md' }}
            px={{ base: 2, md: 4 }}
          >
            Clientes
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <AdminList />
          </TabPanel>
          <TabPanel px={0}>
            <ClienteList />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UserManagement;