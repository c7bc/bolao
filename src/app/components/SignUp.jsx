import React, { useState } from 'react';
import { Box, Heading, Text, Input, Button, Stack, FormControl, FormLabel, FormHelperText, Checkbox, Link, Flex, useBreakpointValue } from '@chakra-ui/react';
import { FaUser, FaPhoneAlt, FaCity, FaLock, FaRegIdCard, FaEnvelope } from 'react-icons/fa';

const CreateAccount = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    email: '',
    password: '',
    referralCode: '',
    termsAccepted: false,
  });

  const buttonSize = useBreakpointValue({ base: "md", md: "lg" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = () => {
    setFormData((prevData) => ({ ...prevData, termsAccepted: !prevData.termsAccepted }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica para submeter o formulário (por exemplo, enviar para a API)
    console.log(formData);
  };

  return (
    <Box p={6} bg="white" boxShadow="xl" borderRadius="md" maxW="4xl" mx="auto" mb={8}>
      <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
        Criar minha conta
      </Heading>
      <Text fontSize="lg" color="green.700" mb={4} textAlign="center">
        Rápido e fácil, não demora nem 1 minuto.
      </Text>

      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          {/* Nome Completo */}
          <FormControl isRequired>
            <FormLabel htmlFor="name" color="green.700">Nome Completo</FormLabel>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nome e Sobrenome"
              value={formData.name}
              onChange={handleInputChange}
              leftIcon={<FaUser color="green.500" />}
              color="green.700"
            />
            <FormHelperText color="green.600">Por favor, coloque seu Nome e Sobrenome.</FormHelperText>
          </FormControl>

          {/* Email */}
          <FormControl isRequired>
            <FormLabel htmlFor="email" color="green.700">Email</FormLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Seu email"
              value={formData.email}
              onChange={handleInputChange}
              leftIcon={<FaEnvelope color="green.500" />}
              color="green.700"
            />
          </FormControl>

          {/* Celular / Whatsapp */}
          <FormControl isRequired>
            <FormLabel htmlFor="phone" color="green.700">Celular / Whatsapp</FormLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(00) 0 0000-0000"
              value={formData.phone}
              onChange={handleInputChange}
              leftIcon={<FaPhoneAlt color="green.500" />}
              color="green.700"
            />
          </FormControl>

          {/* Cidade */}
          <FormControl isRequired>
            <FormLabel htmlFor="city" color="green.700">Sua Cidade</FormLabel>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="Sua Cidade"
              value={formData.city}
              onChange={handleInputChange}
              leftIcon={<FaCity color="green.500" />}
              color="green.700"
            />
          </FormControl>

          {/* Senha */}
          <FormControl isRequired>
            <FormLabel htmlFor="password" color="green.700">Senha</FormLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Digite uma senha"
              value={formData.password}
              onChange={handleInputChange}
              leftIcon={<FaLock color="green.500" />}
              color="green.700"
            />
          </FormControl>

          {/* Código de Indicação (opcional) */}
          <FormControl>
            <FormLabel htmlFor="referralCode" color="green.700">Código de Indicação</FormLabel>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              placeholder="Campo opcional"
              value={formData.referralCode}
              onChange={handleInputChange}
              leftIcon={<FaRegIdCard color="green.500" />}
              color="green.700"
            />
          </FormControl>

          {/* Termos e Condições */}
          <FormControl isRequired>
            <Checkbox
              isChecked={formData.termsAccepted}
              onChange={handleCheckboxChange}
              colorScheme="green"
            >
              Tenho mais de 18 anos, li e concordo com os <Link href="/termos" color="green.500">Termos e Condições de Uso</Link> do site.
            </Checkbox>
          </FormControl>

          {/* Botão de Cadastro */}
          <Button
            type="submit"
            colorScheme="green"
            size={buttonSize}
            w="full"
            mt={6}
            isDisabled={!formData.termsAccepted || !formData.name || !formData.phone || !formData.city || !formData.email || !formData.password}
          >
            Cadastrar
          </Button>
        </Stack>
      </form>

      <Flex justify="center" mt={4}>
        <Text fontSize="sm" color="green.700">Já tenho conta. </Text>
        <Link href="/login" ml={1} color="green.500" fontWeight="bold">Entrar</Link>
      </Flex>
    </Box>
  );
};

export default CreateAccount;
