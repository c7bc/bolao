'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import {
  Box,
  Flex,
  Heading,
  Button,
  Avatar,
  Text,
  HStack,
  Container,
  useColorModeValue,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaSignOutAlt, FaUser, FaClock, FaChevronDown } from 'react-icons/fa';

const Header = ({ userType, userName, onLogout, onSelectMenu }) => {
  const router = useRouter(); // Correct hook usage
  const [currentTime, setCurrentTime] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Cores dinâmicas
  const bgGradient = useColorModeValue(
    'linear(to-r, green.400, green.600)',
    'linear(to-r, green.600, green.800)'
  );
  const textColor = 'white'; // Fixar a cor do texto para branco
  const buttonHoverBg = useColorModeValue('green.500', 'green.600');

  // Responsividade
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(formattedTime);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Efeito de scroll (pode ser removido se não for mais necessário)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogoutClick = () => {
    onLogout();
    if (['admin', 'superadmin', 'colaborador'].includes(userType)) {
      router.push('/loginAdmin');
    } else {
      router.push('/login');
    }
  };

  const handlePerfilClick = () => {
    onSelectMenu('perfil'); // Atualiza o menu selecionado para 'perfil'
  };

  return (
    <Box
      bgGradient={bgGradient} // Gradiente aplicado no cabeçalho inteiro
      color={textColor}
      py={4}
      px={6}
      boxShadow={isScrolled ? 'lg' : 'none'}
      transition="all 0.3s ease-in-out"
    >
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between">
          {/* Título e Relógio */}
          <Flex align="center">
            <Heading
              size="lg"
              color="white" // Definir cor para branco
              fontWeight="bold"
              letterSpacing="tight"
              mr={6}
            >
              Dashboard
            </Heading>
            <Flex align="center">
              <Icon as={FaClock} color="white" />
              <Text ml={2} fontSize="sm" color="white">
                {currentTime}
              </Text>
            </Flex>
          </Flex>

          {/* Menu Mobile */}
          {isMobile ? (
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FaChevronDown />}
                colorScheme="green"
                variant="ghost"
                color="white" // Garantir que o texto do botão seja branco
              >
                Menu
              </MenuButton>
              <MenuList bg="gray.800" color="white"> {/* Cor fixa */}
                <MenuItem onClick={handlePerfilClick}>
                  <Icon as={FaUser} mr={2} />
                  Meu Perfil
                </MenuItem>
                <MenuItem onClick={handleLogoutClick}>
                  <Icon as={FaSignOutAlt} mr={2} />
                  Sair
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            /* Menu Desktop */
            <HStack spacing={4}>
              <Avatar name={userName} size="sm" bg="green.500" color="white" />
              <Text fontWeight="medium" color="white">
                {userName || 'Usuário'}
              </Text>
              <Button
                leftIcon={<FaUser />}
                variant="ghost"
                colorScheme="green"
                color="white"
                _hover={{ bg: buttonHoverBg, color: 'white' }}
                onClick={handlePerfilClick} // Atualiza o menu selecionado para 'perfil'
              >
                Meu Perfil
              </Button>
              <Button
                leftIcon={<FaSignOutAlt />}
                variant="solid"
                colorScheme="green"
                color="white"
                _hover={{ bg: buttonHoverBg }}
                onClick={handleLogoutClick}
              >
                Sair
              </Button>
            </HStack>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
