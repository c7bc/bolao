import React, { useState } from 'react';
import {
  Box,
  Heading,
  Input,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Select,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  useBreakpointValue,
  Flex,
} from '@chakra-ui/react';
import { FaEnvelope, FaLock, FaPhoneAlt, FaIdCard } from 'react-icons/fa';

const SignIn = () => {
  const [role, setRole] = useState('superadmin'); // Tipo de cargo selecionado
  const [formData, setFormData] = useState({
    email: '',
    telefone: '',
    documento: '',
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

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setFormData({ email: '', telefone: '', documento: '', password: '' });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint;
      let data;

      switch (role) {
        case 'superadmin':
          endpoint = '/api/superadmin/login';
          data = { email: formData.email, password: formData.password };
          break;
        case 'admin':
          endpoint = '/api/admin/login';
          data = { email: formData.email, password: formData.password };
          break;
        case 'colaborador':
          endpoint = '/api/colaborador/login';
          data = {
            cli_telefone: formData.telefone,
            cli_password: formData.password,
            documento: formData.documento,
          };
          break;
        default:
          throw new Error('Cargo inválido.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Armazena o token e redireciona para o dashboard correspondente
        const { token } = result;
        localStorage.setItem('token', token);
        const dashboardUrl = role === 'colaborador' ? '/dashboard/' : '/dashboard';
        window.location.href = dashboardUrl;
      } else {
        setErrorMessage(result.error || 'Erro ao fazer login.');
      }
    } catch (error) {
      setErrorMessage('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      p={8}
      bg="white"
      boxShadow="2xl"
      borderRadius="md"
      maxW="lg"
      mx="auto"
      mt={12}
    >
      <Heading as="h2" size="xl" color="green.600" mb={6} textAlign="center">
        Login
      </Heading>

      {errorMessage && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          {/* Seleção de Cargo */}
          <FormControl isRequired>
            <FormLabel htmlFor="role" color="green.700">
              Selecione o Cargo
            </FormLabel>
            <Select
              id="role"
              value={role}
              onChange={handleRoleChange}
              placeholder="Selecione o cargo"
              bg="green.50"
              color="green.800"
              borderColor="green.300"
            >
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
            </Select>
          </FormControl>

          {/* Email (para Superadmin e Admin) */}
          {(role === 'superadmin' || role === 'admin') && (
            <FormControl isRequired>
              <FormLabel htmlFor="email" color="green.700">
                E-mail
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="green.500" />
                </InputLeftElement>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Seu e-mail"
                  value={formData.email}
                  onChange={handleInputChange}
                  bg="green.50"
                  color="green.800"
                  borderColor="green.300"
                />
              </InputGroup>
            </FormControl>
          )}

          {/* Telefone (para Colaborador) */}
          {role === 'colaborador' && (
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
                  bg="green.50"
                  color="green.800"
                  borderColor="green.300"
                />
              </InputGroup>
            </FormControl>
          )}

          {/* Documento (para Colaborador) */}
          {role === 'colaborador' && (
            <FormControl>
              <FormLabel htmlFor="documento" color="green.700">
                Documento
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaIdCard color="green.500" />
                </InputLeftElement>
                <Input
                  id="documento"
                  name="documento"
                  type="text"
                  placeholder="Seu documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  bg="green.50"
                  color="green.800"
                  borderColor="green.300"
                />
              </InputGroup>
            </FormControl>
          )}

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
                bg="green.50"
                color="green.800"
                borderColor="green.300"
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
            isDisabled={
              !formData.password || (role !== 'colaborador' && !formData.email) || (role === 'colaborador' && !formData.telefone)
            }
          >
            Entrar
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default SignIn;
