'use client';

import React, { useEffect, useState } from 'react';
import { Flex, Box } from '@chakra-ui/react';
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

const Dashboard = () => {
  const [userType, setUserType] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  useEffect(() => {
    // Obter o tipo de usuário a partir do token ou outra lógica
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      try {
        // Decodificar o token (supondo que ele seja um JWT válido)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (['admin', 'superadmin', 'colaborador', 'cliente'].includes(payload.role)) {
          setUserType(payload.role); // Define o tipo de usuário
        } else {
          console.error('Role inválido no token:', payload.role);
          window.location.href = '/login';
        }
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

  const renderContent = () => {
    console.log('Tipo de usuário:', userType);
    if (userType === 'admin' || userType === 'superadmin') {
      switch (selectedMenu) {
        case 'adminDashboard':
          return <AdminDashboard />;
        case 'userManagement':
          return <UserManagement />;
        case 'gameManagement':
          return <GameManagement />;
        case 'financeiro':
          return <FinanceiroAdmin />;
        case 'configuracoes':
          return <Configuracoes />;
        default:
          return <AdminDashboard />;
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
        default:
          return <ClienteDashboard />;
      }
    } else {
      return <Box>Tipo de usuário inválido. Por favor, contate o suporte.</Box>;
    }
  };

  return (
    <Flex direction="column" minHeight="100vh">
      <Header userType={userType} onLogout={handleLogout} />
      <Flex flex="1">
        <Sidebar userType={userType} onSelectMenu={setSelectedMenu} />
        <Box flex="1" p={4}>
          {renderContent()}
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default Dashboard;
