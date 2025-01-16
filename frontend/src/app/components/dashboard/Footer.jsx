'use client';

import React from 'react';
import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Flex,
  Heading,
  Icon,
  Input,
  Button,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
  Link,
} from '@chakra-ui/react';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiArrowRight,
  FiHeart
} from 'react-icons/fi';

const Footer = () => {
  // Cores dinâmicas
  const bgColor = useColorModeValue('green.50', 'green.900');
  const borderColor = useColorModeValue('green.200', 'green.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('green.700', 'green.200');
  const socialBg = useColorModeValue('green.100', 'green.700');
  const socialColor = useColorModeValue('green.700', 'green.200');
  const socialHoverBg = useColorModeValue('green.200', 'green.600');
  const inputBg = useColorModeValue('white', 'green.800');
  const linkHoverColor = useColorModeValue('green.600', 'green.300');

  const currentYear = new Date().getFullYear();

  const FooterHeading = ({ children }) => (
    <Heading
      as="h4"
      size="md"
      color={headingColor}
      mb={4}
      fontWeight="bold"
    >
      {children}
    </Heading>
  );

  const SocialButton = ({ icon, href }) => (
    <Link
      href={href}
      isExternal
      _hover={{ textDecoration: 'none' }}
    >
      <Flex
        align="center"
        justify="center"
        w="10"
        h="10"
        rounded="full"
        bg={socialBg}
        color={socialColor}
        transition="all 0.3s ease"
        _hover={{
          bg: socialHoverBg,
          transform: 'translateY(-2px)'
        }}
      >
        <Icon as={icon} w="5" h="5" />
      </Flex>
    </Link>
  );

  return (
    <Box
      bg={bgColor}
      color={textColor}
      borderTop="1px"
      borderColor={borderColor}
    >
      <Container maxW="7xl" py={10}>
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 4 }}
          spacing={8}
          mb={8}
        >
          {/* Sobre nós */}
          <Stack spacing={6}>
            <Box>
              <FooterHeading>Sobre Nós</FooterHeading>
              <Text fontSize="sm" lineHeight="tall">
                Somos uma plataforma inovadora dedicada a proporcionar a melhor experiência
                para nossos usuários, com foco em qualidade e excelência.
              </Text>
            </Box>
          </Stack>

          {/* Links Rápidos */}
          <Stack spacing={4}>
            <FooterHeading>Links Rápidos</FooterHeading>
            {['Início', 'Sobre', 'Serviços', 'Contato', 'Blog'].map((text) => (
              <Link
                key={text}
                href="#"
                fontSize="sm"
                _hover={{
                  color: linkHoverColor,
                  textDecoration: 'none',
                  transform: 'translateX(5px)'
                }}
                transition="all 0.3s ease"
                display="inline-block"
              >
                {text}
              </Link>
            ))}
          </Stack>

          {/* Contato */}
          <Stack spacing={4}>
            <FooterHeading>Contato</FooterHeading>
            <VStack spacing={3} align="start">
              <HStack spacing={3}>
                <Icon as={FiMapPin} color={headingColor} />
                <Text fontSize="sm">Rua Example, 123 - SP</Text>
              </HStack>
              <HStack spacing={3}>
                <Icon as={FiPhone} color={headingColor} />
                <Text fontSize="sm">+55 (11) 1234-5678</Text>
              </HStack>
              <HStack spacing={3}>
                <Icon as={FiMail} color={headingColor} />
                <Text fontSize="sm">contato@exemplo.com</Text>
              </HStack>
            </VStack>
          </Stack>

          {/* Newsletter */}
          <Stack spacing={4}>
            <FooterHeading>Newsletter</FooterHeading>
            <Text fontSize="sm">
              Inscreva-se para receber nossas últimas novidades.
            </Text>
            <Stack direction="row" spacing={2}>
              <Input
                placeholder="Seu e-mail"
                bg={inputBg}
                border={0}
                _focus={{
                  bg: inputBg,
                  borderColor: 'green.500'
                }}
              />
              <Button
                colorScheme="green"
                rightIcon={<FiArrowRight />}
                _hover={{
                  transform: 'translateX(5px)'
                }}
                transition="all 0.3s ease"
              >
                OK
              </Button>
            </Stack>
          </Stack>
        </SimpleGrid>

        <Divider borderColor={borderColor} my={6} />

        {/* Bottom Section */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          gap={4}
        >
          <Text fontSize="sm" textAlign={{ base: 'center', md: 'left' }}>
            © {currentYear} Minha Plataforma. Feito com{' '}
            <Icon as={FiHeart} color="red.500" w={4} h={4} mx={1} />
            no Brasil.
          </Text>

          <HStack spacing={4} justify="center">
            <SocialButton icon={FiFacebook} href="#" />
            <SocialButton icon={FiTwitter} href="#" />
            <SocialButton icon={FiInstagram} href="#" />
            <SocialButton icon={FiLinkedin} href="#" />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
