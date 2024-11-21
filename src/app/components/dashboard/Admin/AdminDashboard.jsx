// app/components/Admin/AdminDashboard.jsx

import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const AdminDashboard = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Dashboard do Administrador
      </Heading>
      <Text>Bem-vindo ao painel de controle.</Text>
      {/* Aqui você pode adicionar gráficos e estatísticas */}
    </Box>
  );
};

export default AdminDashboard;
