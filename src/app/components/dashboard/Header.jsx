import React from 'react';
import { Box, Flex, Heading, Spacer, Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation'; // Importa o useRouter

const Header = ({ userType, onLogout }) => {
  const router = useRouter(); // Instância do roteador

  const handleGoToProfile = () => {
    router.push('/perfil'); // Navega para a página de perfil
  };

  return (
    <Box bg="green.600" color="white" px={4} py={2}>
      <Flex alignItems="center">
        <Heading size="md">Minha Plataforma</Heading>
        <Spacer />
        <Flex alignItems="center">
          <Button
            variant="ghost"
            colorScheme="whiteAlpha"
            mr={4}
            onClick={handleGoToProfile} // Chama a função ao clicar
          >
            Meu Perfil
          </Button>
          <Button variant="outline" colorScheme="whiteAlpha" onClick={onLogout}>
            Sair
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
