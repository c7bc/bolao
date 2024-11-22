'use client'; // Declara como Client Component

import React from 'react';
import {
  Box,
  VStack,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

const Sidebar = ({ userType, onSelectMenu }) => {
  const menuItems = {
    admin: [
      { label: 'Dashboard', key: 'adminDashboard' },
      { label: 'Usuários', key: 'userManagement' },
      { label: 'Jogos', key: 'gameManagement' },
      { label: 'Financeiro', key: 'financeiro' },
      { label: 'Configurações', key: 'configuracoes' },
    ],
    superadmin: [
      // Superadmin usa os mesmos menus que admin
      { label: 'Dashboard', key: 'adminDashboard' },
      { label: 'Usuários', key: 'userManagement' },
      { label: 'Jogos', key: 'gameManagement' },
      { label: 'Financeiro', key: 'financeiro' },
      { label: 'Configurações', key: 'configuracoes' },
    ],
    colaborador: [
      { label: 'Dashboard', key: 'colaboradorDashboard' },
      { label: 'Clientes', key: 'clienteManagement' },
      { label: 'Jogos', key: 'jogos' },
      { label: 'Financeiro', key: 'financeiro' },
    ],
    cliente: [
      { label: 'Dashboard', key: 'clienteDashboard' },
      { label: 'Jogos Disponíveis', key: 'jogosDisponiveis' },
      { label: 'Meus Jogos', key: 'meusJogos' },
      { label: 'Histórico', key: 'historico' },
      { label: 'Perfil', key: 'perfil', path: '/perfil' }, // Apenas "Perfil" redireciona
    ],
  };

  // Seleciona o menu baseado no tipo de usuário
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
              key={menu.key}
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
