// src/app/components/SignUp.jsx

import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  Stack,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  Link,
  Flex,
  useBreakpointValue,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FaUser,
  FaPhoneAlt,
  FaLock,
  FaRegIdCard,
  FaEnvelope,
} from 'react-icons/fa';

const SignUp = () => {
  const [formData, setFormData] = useState({
    cli_nome: '',
    cli_email: '',
    cli_telefone: '',
    cli_password: '',
    termsAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCheckboxChange = () => {
    setFormData((prevData) => ({
      ...prevData,
      termsAccepted: !prevData.termsAccepted,
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      setErrorMessage('Você deve aceitar os termos e condições.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/cliente/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cli_nome: formData.cli_nome,
          cli_email: formData.cli_email,
          cli_telefone: formData.cli_telefone,
          cli_password: formData.cli_password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(
          'Conta criada com sucesso! Você será redirecionado para o login.'
        );
        // Redireciona para a página de login após 2 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setErrorMessage(result.error || 'Erro ao criar conta. Por favor, tente novamente.');
      }
    } catch (error) {
      setErrorMessage('Erro ao criar conta. Verifique os dados e tente novamente.');
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
      maxW="4xl"
      mx="auto"
      mb={8}
    >
      <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
        Criar minha conta
      </Heading>
      <Text fontSize="lg" color="green.700" mb={4} textAlign="center">
        Rápido e fácil, não demora nem 1 minuto.
      </Text>

      {errorMessage && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          {/* Nome Completo */}
          <FormControl isRequired>
            <FormLabel htmlFor="cli_nome" color="green.700">
              Nome Completo
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaUser color="green.500" />
              </InputLeftElement>
              <Input
                id="cli_nome"
                name="cli_nome"
                type="text"
                placeholder="Nome e Sobrenome"
                value={formData.cli_nome}
                onChange={handleInputChange}
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Por favor, coloque seu Nome e Sobrenome.
            </FormHelperText>
          </FormControl>

          {/* Email */}
          <FormControl isRequired>
            <FormLabel htmlFor="cli_email" color="green.700">
              Email
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaEnvelope color="green.500" />
              </InputLeftElement>
              <Input
                id="cli_email"
                name="cli_email"
                type="email"
                placeholder="Seu email"
                value={formData.cli_email}
                onChange={handleInputChange}
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Por favor, insira um email válido.
            </FormHelperText>
          </FormControl>

          {/* Celular / Whatsapp */}
          <FormControl isRequired>
            <FormLabel htmlFor="cli_telefone" color="green.700">
              Celular / Whatsapp
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaPhoneAlt color="green.500" />
              </InputLeftElement>
              <Input
                id="cli_telefone"
                name="cli_telefone"
                type="tel"
                placeholder="(00) 0 0000-0000"
                value={formData.cli_telefone}
                onChange={handleInputChange}
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Insira seu número de celular ou Whatsapp.
            </FormHelperText>
          </FormControl>

          {/* Senha */}
          <FormControl isRequired>
            <FormLabel htmlFor="cli_password" color="green.700">
              Senha
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaLock color="green.500" />
              </InputLeftElement>
              <Input
                id="cli_password"
                name="cli_password"
                type="password"
                placeholder="Digite uma senha"
                value={formData.cli_password}
                onChange={handleInputChange}
                color="green.700"
              />
            </InputGroup>
            <FormHelperText color="green.600">
              Crie uma senha segura com pelo menos 6 caracteres.
            </FormHelperText>
          </FormControl>
          {/* Termos e Condições */}
          <FormControl isRequired>
            <Checkbox
              isChecked={formData.termsAccepted}
              onChange={handleCheckboxChange}
              colorScheme="green"
            >
              Tenho mais de 18 anos, li e concordo com os{' '}
              <Link href="/termos" color="green.500">
                Termos e Condições de Uso
              </Link>{' '}
              do site.
            </Checkbox>
          </FormControl>

          {/* Botão de Cadastro */}
          <Button
            type="submit"
            colorScheme="green"
            size={buttonSize}
            w="full"
            mt={6}
            isLoading={loading}
            isDisabled={
              !formData.termsAccepted ||
              !formData.cli_nome ||
              !formData.cli_email ||
              !formData.cli_telefone ||
              !formData.cli_password
            }
          >
            Cadastrar
          </Button>
        </Stack>
      </form>

      <Flex justify="center" mt={4}>
        <Text fontSize="sm" color="green.700">
          Já tenho conta.
        </Text>
        <Link href="/login" ml={1} color="green.500" fontWeight="bold">
          Entrar
        </Link>
      </Flex>
    </Box>
  );
};

export default SignUp;
