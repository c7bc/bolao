'use client';

import React from 'react';
import {
  Box,
  VStack,
  Button,
  Text,
  useColorModeValue,
  Icon,
  Flex,
  Heading,
  Divider,
  useBreakpointValue,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiGamepad,
  FiDollarSign,
  FiSettings,
  FiUser,
  FiClock,
  FiMenu,
  FiAlert
} from 'react-icons/fi';

const Sidebar = ({ userType, onSelectMenu }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  
  const menuItems = {
    admin: [
      { label: 'Dashboard', key: 'adminDashboard', icon: FiHome },
      { label: 'Usuários', key: 'userManagement', icon: FiUsers },
      { label: 'Jogos', key: 'gameManagement', icon: FiGamepad },
      { label: 'Financeiro', key: 'financeiro', icon: FiDollarSign },
      { label: 'Configurações', key: 'configuracoes', icon: FiSettings },
    ],
    superadmin: [
      { label: 'Dashboard', key: 'adminDashboard', icon: FiHome },
      { label: 'Usuários', key: 'userManagement', icon: FiUsers },
      { label: 'Jogos', key: 'gameManagement', icon: FiGamepad },
      { label: 'Financeiro', key: 'financeiro', icon: FiDollarSign },
      { label: 'Configurações', key: 'configuracoes', icon: FiSettings },
    ],
    colaborador: [
      { label: 'Dashboard', key: 'colaboradorDashboard', icon: FiHome },
      { label: 'Clientes', key: 'clienteManagement', icon: FiUsers },
      { label: 'Jogos', key: 'jogos', icon: FiGamepad },
      { label: 'Financeiro', key: 'financeiro', icon: FiDollarSign },
    ],
    cliente: [
      { label: 'Dashboard', key: 'clienteDashboard', icon: FiHome },
      { label: 'Jogos Disponíveis', key: 'jogosDisponiveis', icon: FiGamepad },
      { label: 'Meus Jogos', key: 'meusJogos', icon: FiGamepad },
      { label: 'Histórico', key: 'historico', icon: FiClock },
      { label: 'Perfil', key: 'perfil', icon: FiUser, path: '/perfil' },
    ],
  };

  const menus = menuItems[userType];

  // Estilos responsivos
  const sidebarWidth = useBreakpointValue({ base: "full", md: "300px" });
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const handleNavigation = (menu) => {
    if (menu.path) {
      router.push(menu.path);
    } else if (onSelectMenu) {
      onSelectMenu(menu.key);
    }
    if (!isDesktop) onToggle();
  };

  // Esquema de cores personalizado
  const bgColor = useColorModeValue('green.50', 'green.900');
  const buttonBgColor = useColorModeValue('white', 'green.800');
  const buttonHoverBg = useColorModeValue('green.100', 'green.700');
  const buttonActiveBg = useColorModeValue('green.200', 'green.600');
  const textColor = useColorModeValue('green.800', 'white');
  const iconColor = useColorModeValue('green.500', 'green.300');

  return (
    <Box
      position={isDesktop ? "block" : "relative"}
      left="0"
      h="140vh"
      w={sidebarWidth}
      bg={bgColor}
      boxShadow="lg"
      transition="all 0.3s"
      borderRight="1px"
      borderColor={useColorModeValue('green.200', 'green.700')}
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: useColorModeValue('green.200', 'green.700'),
          borderRadius: '24px',
        },
      }}
    >
      {!isDesktop && (
        <Button
          position="absolute"
          top="4"
          right="4"
          onClick={onToggle}
          variant="ghost"
          color={iconColor}
        >
          <Icon as={FiMenu} />
        </Button>
      )}

      <Collapse in={isDesktop || isOpen} animateOpacity>
        <VStack spacing="8" align="stretch" p="6">
          <Box>
            <Heading
              size="md"
              color={textColor}
              textTransform="uppercase"
              letterSpacing="wider"
              mb="6"
            >
              Menu Principal
            </Heading>
            <Divider borderColor={useColorModeValue('green.200', 'green.700')} />
          </Box>

          <VStack spacing="3" align="stretch">
            {menus ? (
              menus.map((menu) => (
                <Button
                  key={menu.key}
                  onClick={() => handleNavigation(menu)}
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-start"
                  w="full"
                  py="6"
                  bg={buttonBgColor}
                  _hover={{
                    bg: buttonHoverBg,
                    transform: 'translateX(5px)',
                  }}
                  _active={{
                    bg: buttonActiveBg,
                  }}
                  transition="all 0.2s"
                  borderRadius="lg"
                  boxShadow="sm"
                  leftIcon={<Icon as={menu.icon} fontSize="20" color={iconColor} />}
                >
                  <Text color={textColor} fontWeight="medium">
                    {menu.label}
                  </Text>
                </Button>
              ))
            ) : (
              <Flex
                direction="column"
                align="center"
                justify="center"
                p="6"
                bg="red.50"
                borderRadius="lg"
              >
                <Icon as={FiAlert} color="red.500" boxSize="6" mb="2" />
                <Text color="red.500" fontWeight="medium" textAlign="center">
                  Tipo de usuário inválido. Por favor, contate o suporte.
                </Text>
              </Flex>
            )}
          </VStack>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default Sidebar;