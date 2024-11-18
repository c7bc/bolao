import React, { useState } from 'react';
import { Box, Heading, Text, Input, Button, Stack, FormControl, FormLabel, FormHelperText, Link, Flex, useBreakpointValue, Icon } from '@chakra-ui/react';
import { FaUser, FaPhoneAlt, FaLock } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });

  const [error, setError] = useState('');
  const buttonSize = useBreakpointValue({ base: "md", md: "lg" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.emailOrPhone || !formData.password) {
      setError('Por favor, preencha todos os campos.');
    } else {
      setError('');
      // Lógica para login (por exemplo, enviar para a API)
      console.log(formData);
    }
  };

  return (
    <Box p={6} bg="white" boxShadow="xl" borderRadius="md" maxW="4xl" mx="auto" mb={8}>
      <Flex direction="column" align="center" mb={6}>
        <Heading as="h1" size="xl" color="green.800" mb={4}>
          Bolão do Prêmios
        </Heading>
        <Text fontSize="lg" color="green.700" textAlign="center" mb={4}>
          Entre para participar do nosso bolão e ganhar prêmios incríveis!
        </Text>
      </Flex>

      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          {/* Email ou Telefone */}
          <FormControl isRequired>
            <FormLabel htmlFor="emailOrPhone" color="green.700">Email ou Telefone</FormLabel>
            <Input
              id="emailOrPhone"
              name="emailOrPhone"
              type="text"
              placeholder="Digite seu email ou telefone"
              value={formData.emailOrPhone}
              onChange={handleInputChange}
              leftIcon={<FaUser color="green.500" />}
              color="green.700"
            />
            <FormHelperText color="green.600">Digite seu e-mail ou telefone registrado.</FormHelperText>
          </FormControl>

          {/* Senha */}
          <FormControl isRequired>
            <FormLabel htmlFor="password" color="green.700">Senha</FormLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              value={formData.password}
              onChange={handleInputChange}
              leftIcon={<FaLock color="green.500" />}
              color="green.700"
            />
          </FormControl>

          {/* Exibição de erro */}
          {error && (
            <Text color="red.500" textAlign="center">{error}</Text>
          )}

          {/* Botão de Login */}
          <Button
            type="submit"
            colorScheme="green"
            size={buttonSize}
            w="full"
            mt={6}
            isDisabled={!formData.emailOrPhone || !formData.password}
          >
            Entrar
          </Button>
        </Stack>
      </form>

      {/* Links para ações */}
      <Flex direction="column" align="center" mt={6}>
        <Link href="/esqueci-minha-senha" color="green.500" fontSize="sm" mb={2}>
          Esqueci minha senha
        </Link>
        <Flex align="center">
          <Text fontSize="sm" color="green.700">Ainda não tem uma conta? </Text>
          <Link href="/cadastro" color="green.500" fontWeight="bold" ml={1}>Criar conta</Link>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Login;
