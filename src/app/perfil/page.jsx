'use client';

import React, { useEffect, useState } from 'react';
import { Flex, Box } from '@chakra-ui/react';
import Header from '../components/dashboard/Header';
import Footer from '../components/dashboard/Footer';
import Sidebar from '../components/dashboard/Sidebar';
import Profile from '../components/dashboard/Perfil/Profile';

const PerfilPage = () => {
  const [userType, setUserType] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('perfil');

  useEffect(() => {
    // Obter o tipo de usuário a partir do token ou outra lógica
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      try {
        // Decodificar o token (supondo que ele seja um JWT)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserType(payload.role);
      } catch (error) {
        console.error('Erro ao decodificar o token:', error);
        window.location.href = '/login';
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Flex direction="column" minHeight="100vh">
      <Header userType={userType} onLogout={handleLogout} />
      <Flex flex="1">
        <Sidebar userType={userType} onSelectMenu={setSelectedMenu} />
        <Box flex="1" p={4}>
          {/* Renderiza o componente de perfil */}
          <Profile />
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default PerfilPage;
