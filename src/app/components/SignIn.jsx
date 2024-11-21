// src/app/components/SignIn.jsx

import React, { useState } from 'react';
import {
  Box,
  Heading,
  Input,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Flex,
  useBreakpointValue,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaPhoneAlt, FaLock } from 'react-icons/fa';
import Link from 'next/link';

const SignIn = () => {
  const [formData, setFormData] = useState({
    telefone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = '/api/cliente/login';
      const data = {
        cli_telefone: formData.telefone,
        cli_password: formData.password,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Armazena o token e redireciona para o dashboard do cliente
        const { token } = result;
        localStorage.setItem('token', token);
        // Redireciona para o dashboard do cliente
        window.location.href = `/dashboard`;
      } else {
        setErrorMessage(result.error || 'Erro ao fazer login.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrorMessage('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      p={6}
      bg="white"
      boxShadow="xl"
      borderRadius="md"
      maxW="md"
      mx="auto"
      mt={8}
    >
      <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
        Login de Cliente
      </Heading>

      {errorMessage && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          {/* Telefone */}
          <FormControl isRequired>
            <FormLabel htmlFor="telefone" color="green.700">
              Telefone
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaPhoneAlt color="green.500" />
              </InputLeftElement>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                placeholder="Seu telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                color="green.700"
                pattern="[0-9]{10,15}" // Validação básica para telefone
                title="Por favor, insira um número de telefone válido com 10 a 15 dígitos."
              />
            </InputGroup>
          </FormControl>

          {/* Senha */}
          <FormControl isRequired>
            <FormLabel htmlFor="password" color="green.700">
              Senha
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaLock color="green.500" />
              </InputLeftElement>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={handleInputChange}
                color="green.700"
              />
            </InputGroup>
          </FormControl>

          {/* Botão de Login */}
          <Button
            type="submit"
            colorScheme="green"
            size={buttonSize}
            w="full"
            mt={6}
            isLoading={loading}
            isDisabled={!formData.telefone || !formData.password}
          >
            Entrar
          </Button>
        </Stack>
      </form>

      {/* Link para Cadastro */}
      <Flex justify="center" mt={4}>
        <Link href="/cadastro" style={{ color: '#38A169', fontWeight: 'bold' }}>
          Criar uma conta
        </Link>
      </Flex>
    </Box>
  );
};

export default SignIn;
