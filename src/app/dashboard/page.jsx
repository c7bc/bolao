// src/app/dashboard/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { Flex, Box, useBreakpointValue, Spinner, Alert, AlertIcon, Text } from '@chakra-ui/react';
import Header from '../components/dashboard/Header';
import Footer from '../components/dashboard/Footer';
import Sidebar from '../components/dashboard/Sidebar';
import AdminDashboard from '../components/dashboard/Admin/AdminDashboard';
import UserManagement from '../components/dashboard/Admin/UserManagement';
import GameManagement from '../components/dashboard/Admin/GameManagement';
import FinanceiroAdmin from '../components/dashboard/Admin/Financeiro';
import Configuracoes from '../components/dashboard/Admin/Configuracoes';
import ColaboradorDashboard from '../components/dashboard/Colaborador/ColaboradorDashboard';
import ClienteManagement from '../components/dashboard/Colaborador/ClienteManagement';
import Jogos from '../components/dashboard/Colaborador/Jogos';
import FinanceiroColaborador from '../components/dashboard/Colaborador/Financeiro';
import ClienteDashboard from '../components/dashboard/Cliente/ClienteDashboard';
import JogosDisponiveis from '../components/dashboard/Cliente/JogosDisponiveis';
import MeusJogos from '../components/dashboard/Cliente/Meusjogos';
import Historico from '../components/dashboard/Cliente/Historico';
import Profile from '../components/dashboard/Perfil/Profile'; // Importação do componente Profile
import Personalizacao from '../components/dashboard/Admin/Personalizacao';
import axios from 'axios';

const Dashboard = () => {
  const [userType, setUserType] = useState(null);
  const [userName, setUserName] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('adminDashboard'); // Define o menu padrão
  const isMobile = useBreakpointValue({ base: true, md: false }); // Detecta dispositivo móvel
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);

  useEffect(() => {
    // Obter o tipo de usuário e nome a partir do token ou outra lógica
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      try {
        // Decodificar o token (supondo que ele seja um JWT sem criptografia)
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Ajuste para diferentes tipos de usuários
        let role = payload.role;
        let name = '';

        switch (role) {
          case 'superadmin':
            name = payload.adm_nome || 'Superadmin';
            break;
          case 'admin':
            name = payload.adm_nome || 'Admin';
            break;
          case 'colaborador':
            name = payload.col_nome || 'Colaborador';
            break;
          case 'cliente':
            name = payload.cli_nome || 'Cliente';
            break;
          default:
            name = 'Usuário';
            break;
        }

        setUserType(role);
        setUserName(name);
      } catch (error) {
        console.error('Erro ao decodificar o token:', error);
        window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/user/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserProfile(response.data.user);
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        setErrorProfile('Erro ao carregar as informações do perfil.');
      } finally {
        setLoadingProfile(false);
      }
    };

    if (userType) {
      fetchUserProfile();
    }
  }, [userType]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Redirecionamento será tratado no Header
  };

  const renderContent = () => {
    if (!userType || !userName) {
      return <Box>Carregando...</Box>; // Fallback para carregamento inicial
    }

    if (userType === 'admin' || userType === 'superadmin') {
      switch (selectedMenu) {
        case 'adminDashboard':
          return <AdminDashboard userName={userName} />;
        case 'userManagement':
          return <UserManagement />;
        case 'gameManagement':
          return <GameManagement />;
        case 'financeiro':
          return <FinanceiroAdmin />;
        case 'configuracoes':
          return <Configuracoes />;
          case 'personalizacao':
        return <Personalizacao />;
        case 'perfil':
          return <Profile userType={userType} userProfile={userProfile} loading={loadingProfile} error={errorProfile} />;
        default:
          return <AdminDashboard userName={userName} />;
      }
    } else if (userType === 'colaborador') {
      switch (selectedMenu) {
        case 'colaboradorDashboard':
          return <ColaboradorDashboard />;
        case 'clienteManagement':
          return <ClienteManagement />;
        case 'jogos':
          return <Jogos />;
        case 'financeiro':
          return <FinanceiroColaborador />;
        case 'perfil':
          return <Profile userType={userType} userProfile={userProfile} loading={loadingProfile} error={errorProfile} />;
        default:
          return <ColaboradorDashboard />;
      }
    } else if (userType === 'cliente') {
      switch (selectedMenu) {
        case 'clienteDashboard':
          return <ClienteDashboard />;
        case 'jogosDisponiveis':
          return <JogosDisponiveis />;
        case 'meusJogos':
          return <MeusJogos />;
        case 'historico':
          return <Historico />;
        case 'perfil':
          return <Profile userType={userType} userProfile={userProfile} loading={loadingProfile} error={errorProfile} />;
        default:
          return <ClienteDashboard />;
      }
    } else {
      return <Box>Tipo de usuário inválido. Por favor, contate o suporte.</Box>;
    }
  };

  // Ajuste para exibir o Sidebar corretamente em dispositivos móveis
  const sidebarWidth = '150px';

  return (
    <Flex direction="column" minHeight="100vh">
      <Header
        userType={userType}
        userName={userName}
        onLogout={handleLogout}
        onSelectMenu={setSelectedMenu}
      />
      <Flex flex="1">
        {/* Sidebar visível em desktops e oculto em dispositivos móveis */}
        {!isMobile && (
          <Box width={sidebarWidth} bg="gray.100">
            <Sidebar userType={userType} onSelectMenu={setSelectedMenu} />
          </Box>
        )}
        <Box flex="1" p={4} ml={!isMobile ? sidebarWidth : '0'}>
          {renderContent()}
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default Dashboard;
