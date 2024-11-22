'use client'; // Declara como Client Component

import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Avatar,
  Text,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation'; // Importa o useRouter
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

const Header = ({ userType, userName, onLogout }) => {
  const router = useRouter(); // Instância do roteador
  const [currentTime, setCurrentTime] = useState('');

  // Atualiza a hora a cada segundo
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

    updateTime(); // Inicializa a hora
    const timer = setInterval(updateTime, 1000); // Atualiza a cada segundo

    return () => clearInterval(timer); // Limpa o intervalo ao desmontar
  }, []);

  // Função para lidar com o logout e redirecionar
  const handleLogout = () => {
    onLogout(); // Remove o token

    // Redireciona com base no tipo de usuário
    if (['admin', 'superadmin', 'colaborador'].includes(userType)) {
      router.push('/loginAdmin');
    } else {
      router.push('/login');
    }
  };

  return (
    <Box bg="green.600" color="white" px={6} py={4} boxShadow="md">
      <Flex alignItems="center">
        <HStack spacing={4}>
          <Avatar name={userName} src="" bg="green.400" />
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              {userName || 'Usuário'}
            </Text>
            <Text fontSize="sm">{currentTime}</Text>
          </Box>
        </HStack>
        <Spacer />
        <HStack spacing={4}>
          <Button
            leftIcon={<FaUser />}
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={() => router.push('/perfil')}
          >
            Meu Perfil
          </Button>
          <Button
            leftIcon={<FaSignOutAlt />}
            variant="outline"
            colorScheme="whiteAlpha"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
