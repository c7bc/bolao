// app/components/Footer.jsx

import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box bg="green.600" color="white" px={4} py={2} mt="auto">
      <Text textAlign="center">© 2023 Minha Plataforma. Todos os direitos reservados.</Text>
    </Box>
  );
};

export default Footer;
