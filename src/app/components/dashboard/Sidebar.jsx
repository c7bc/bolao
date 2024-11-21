'use client'; // Declara como Client Component

import React from 'react';
import {
  Box,
  VStack,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

const Sidebar = ({ userType, onSelectMenu }) => {
  const router = useRouter(); // Hook para navegação

  const menuItems = {
    admin: [
      { label: 'Dashboard', key: 'adminDashboard', path: '/dashboard/admin' },
      { label: 'Usuários', key: 'userManagement', path: '/dashboard/user-management' },
      { label: 'Jogos', key: 'gameManagement', path: '/dashboard/game-management' },
      { label: 'Financeiro', key: 'finance', path: '/dashboard/finance' },
      { label: 'Configurações', key: 'settings', path: '/dashboard/settings' },
    ],
    colaborador: [
      { label: 'Dashboard', key: 'colaboradorDashboard', path: '/dashboard/colaborador' },
      { label: 'Clientes', key: 'clientManagement', path: '/dashboard/client-management' },
      { label: 'Jogos', key: 'jogos', path: '/dashboard/jogos' },
      { label: 'Financeiro', key: 'finance', path: '/dashboard/finance' },
    ],
    cliente: [
      { label: 'Dashboard', key: 'clienteDashboard', path: '/dashboard/' },
      { label: 'Jogos Disponíveis', key: 'jogosDisponiveis' },
      { label: 'Meus Jogos', key: 'meusJogos' },
      { label: 'Histórico', key: 'historico' },
      { label: 'Perfil', key: 'perfil', path: '/perfil' },
    ],
  };

  const menus = menuItems[userType];

  const handleNavigation = (menu) => {
    if (menu.path) {
      // Redireciona para outra página se "path" estiver definido
      router.push(menu.path);
    } else if (onSelectMenu) {
      // Atualiza o menu selecionado para renderizar no painel
      onSelectMenu(menu.key);
    }
  };

  return (
    <Box
      bg={useColorModeValue('gray.100', 'gray.900')}
      w="250px"
      p={4}
      minH="calc(100vh - 64px)" // Ajusta o tamanho considerando o header e footer
    >
      <VStack align="stretch" spacing={4}>
        {menus ? (
          menus.map((menu) => (
            <Button
              key={menu.key || menu.path}
              variant="ghost"
              onClick={() => handleNavigation(menu)} // Lida com navegação
            >
              {menu.label}
            </Button>
          ))
        ) : (
          <Text color="red.500">
            Tipo de usuário inválido. Por favor, contate o suporte.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default Sidebar;
