'use client';

import React, { useEffect, useState } from 'react';
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
import Profile from '../components/dashboard/Perfil/Profile';
import Personalizacao from '../components/dashboard/Admin/Personalizacao';
import axios from 'axios';

const Dashboard = () => {
  const [userType, setUserType] = useState(null);
  const [userName, setUserName] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('adminDashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
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

      // Define o menu inicial baseado no tipo de usuário
      switch (role) {
        case 'admin':
        case 'superadmin':
          setSelectedMenu('adminDashboard');
          break;
        case 'colaborador':
          setSelectedMenu('colaboradorDashboard');
          break;
        case 'cliente':
          setSelectedMenu('clienteDashboard');
          break;
      }
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userType) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/user/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserProfile(response.data.user);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        setErrorProfile('Erro ao carregar as informações do perfil.');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [userType]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectMenu = (menu) => {
    setSelectedMenu(menu);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (loadingProfile) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (errorProfile) {
      return (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro ao carregar o perfil
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorProfile}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!userType || !userName) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      );
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
          return userType === 'superadmin' ? <Personalizacao /> : null;
        case 'perfil':
          return (
            <Profile 
              userType={userType} 
              userProfile={userProfile} 
              loading={loadingProfile} 
              error={errorProfile} 
            />
          );
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
          return (
            <Profile 
              userType={userType} 
              userProfile={userProfile} 
              loading={loadingProfile} 
              error={errorProfile} 
            />
          );
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
          return (
            <Profile 
              userType={userType} 
              userProfile={userProfile} 
              loading={loadingProfile} 
              error={errorProfile} 
            />
          );
        default:
          return <ClienteDashboard />;
      }
    } else {
      return (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Tipo de usuário inválido
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Por favor, contate o suporte.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        userType={userType}
        userName={userName}
        onLogout={handleLogout}
        onSelectMenu={handleSelectMenu}
        toggleSidebar={toggleSidebar}
      />
      
      <div className="flex flex-1 pt-16">
        <Sidebar
          userType={userType}
          onSelectMenu={handleSelectMenu}
          isOpen={sidebarOpen}
        />
        
        <main className="flex-1 p-4 md:ml-64 transition-all duration-300">
          <div className="container mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      
      <Footer />
      
      {/* Overlay para fechar o sidebar em dispositivos móveis */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Dashboard;