'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Avatar,
  Badge,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  useToast,
  Container,
} from '@chakra-ui/react';
import {
  EmailIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const Profile = ({ userType, userProfile, loading, error }) => {
  const toast = useToast();
  const [codeSent, setCodeSent] = useState(false);
  const [decodedToken, setDecodedToken] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
  } = useForm();

  const onSendCode = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Não autenticado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      console.log("Sending code with token:", token);
      const response = await axios.post(
        '/api/user/send-code',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Code sent response:", response.data);
      toast({
        title: 'Código enviado por e-mail.',
        description: 'Verifique seu e-mail para obter o código de confirmação.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setCodeSent(true);
    } catch (err) {
      toast({
        title: 'Erro ao enviar o código.',
        description: err.response?.data?.error || 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const onSubmit = async (data) => {
    if (!codeSent) {
      // First step: Send the code
      await onSendCode();
    } else {
      // Second step: Verify the code and change the password
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: 'Não autenticado.',
            description: 'Por favor, faça login novamente.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        console.log("Token data:", JSON.parse(atob(token.split('.')[1])));
        console.log("Sending password change request with:", data);

        const response = await axios.put(
          '/api/user/change-password',
          {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
            code: data.code,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Password change response:", response.data);
        toast({
          title: 'Senha atualizada com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        reset();
        setCodeSent(false);
      } catch (err) {
        if (err.response?.data?.error === 'Invalid code') {
          setError('code', {
            type: 'manual',
            message: 'O código de confirmação está incorreto.',
          });
        } else if (err.response?.data?.error === 'Current password is incorrect.') {
          setError('currentPassword', {
            type: 'manual',
            message: 'A senha atual está incorreta.',
          });
        } else if (err.response?.data?.error === 'User not found') {
          toast({
            title: 'Usuário não encontrado',
            description: 'Por favor, verifique suas informações de login ou contate o suporte.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        toast({
          title: 'Erro ao atualizar senha.',
          description: err.response?.data?.error || 'Tente novamente mais tarde.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Decode token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedTokenData = JSON.parse(atob(base64));
        setDecodedToken(decodedTokenData);
      } catch (e) {
      }
    }
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" mt={20}>
        <Spinner size="xl" />
        <Text mt={4} color="green.600">Carregando informações do perfil...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={20}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  // Function to get information based on role
  const getUserInfo = () => {
    switch (userType) {
      case 'cliente':
        return {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          status: userProfile.status,
          creationDate: userProfile.creationDate,
          additionalInfo: userProfile.additionalInfo, // Transaction history
        };
      case 'admin':
        return {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          status: userProfile.status,
          creationDate: userProfile.creationDate,
        };
      case 'superadmin':
        return {
          name: userProfile.name,
          email: userProfile.email,
          // Superadmin doesn't have phone, status, or creation date
        };
      case 'colaborador':
        return {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          status: userProfile.status,
          creationDate: userProfile.creationDate,
          id: userProfile.col_id,
        };
      default:
        return {};
    }
  };

  const userInfo = getUserInfo();

  return (
    <Container maxW="container.lg" p={6}>
      <Box p={6} boxShadow="md" borderRadius="md" bg="white" color="green.600">
        {/* User Information */}
        <Flex alignItems="center" mb={6}>
          <Avatar name={userInfo.name} size="xl" bg="green.500" color="white" />
          <Box ml={4}>
            <Heading size="lg" color="green.700">{userInfo.name}</Heading>
            {userType !== 'superadmin' && userInfo.status && (
              <Badge
                colorScheme={
                  userInfo.status.toLowerCase() === 'active' ||
                  userInfo.status.toLowerCase() === 'ativo'
                    ? 'green'
                    : 'red'
                }
                mt={2}
              >
                {userInfo.status.toLowerCase() === 'active' ||
                userInfo.status.toLowerCase() === 'ativo'
                  ? 'Ativo'
                  : 'Inativo'}
              </Badge>
            )}
          </Box>
        </Flex>

        <Divider mb={6} />

        {/* Personal Information */}
        <VStack align="start" spacing={4}>
          {/* Email */}
          <Flex align="center">
            <EmailIcon mr={2} color="green.500" />
            <Text color="green.600">
              <strong>E-mail:</strong> {userInfo.email}
            </Text>
          </Flex>

          {/* Phone - Do not display for superadmin */}
          {userType !== 'superadmin' && userInfo.phone && (
            <Flex align="center">
              <PhoneIcon mr={2} color="green.500" />
              <Text color="green.600">
                <strong>Telefone:</strong> {userInfo.phone}
              </Text>
            </Flex>
          )}

          {/* Creation Date - Do not display for superadmin */}
          {userType !== 'superadmin' && userInfo.creationDate && (
            <Flex align="center">
              <CalendarIcon mr={2} color="green.500" />
              <Text color="green.600">
                <strong>Data de Criação:</strong>{' '}
                {new Date(userInfo.creationDate).toLocaleDateString('pt-BR')}
              </Text>
            </Flex>
          )}
        </VStack>

        {/* Transaction History (Only for Clients) */}
        {userType === 'cliente' && userInfo.additionalInfo && (
          <>
            <Divider my={6} />

            <Heading size="md" mb={4} color="green.700">
              Histórico de Transações
            </Heading>
            {userInfo.additionalInfo.history?.length > 0 ? (
              <Table variant="striped" colorScheme="green">
                <Thead>
                  <Tr>
                    <Th color="green.600">ID</Th>
                    <Th color="green.600">Status</Th>
                    <Th color="green.600">Depósito</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {userInfo.additionalInfo.history.map((transaction) => (
                    <Tr key={transaction.htc_transactionid}>
                      <Td color="green.600">{transaction.htc_transactionid}</Td>
                      <Td>
                        {transaction.htc_status === 'completed' ? (
                          <Flex align="center">
                            <CheckCircleIcon color="green.500" mr={2} />
                            <Text color="green.600">Concluído</Text>
                          </Flex>
                        ) : (
                          <Flex align="center">
                            <CloseIcon color="red.500" mr={2} />
                            <Text color="red.600">Pendente</Text>
                          </Flex>
                        )}
                      </Td>
                      <Td color="green.600">R$ {transaction.htc_deposito.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text color="green.600">Nenhuma transação encontrada.</Text>
            )}
          </>
        )}

        {/* Additional Data */}
        {(userType === 'cliente' ||
          userType === 'admin' ||
          userType === 'colaborador') && (
          <>
            <Divider my={6} />

            <Heading size="md" mb={4} color="green.700">
              Dados Adicionais
            </Heading>
            {userType === 'cliente' && (
              <>
                {userProfile.cli_idcolaborador ? (
                  <Text color="green.600">
                    <strong>ID do Colaborador:</strong> {userProfile.cli_idcolaborador}
                  </Text>
                ) : (
                  <Text color="green.600">Nenhum dado adicional cadastrado.</Text>
                )}
              </>
            )}
            {userType === 'admin' && (
              <>
                <Text color="green.600">
                  <strong>ID do Admin:</strong> {userProfile.id}
                </Text>
                {/* Add other specific fields for Admin if needed */}
              </>
            )}
            {userType === 'colaborador' && (
              <>
                <Text color="green.600">
                  <strong>ID do Colaborador:</strong> {userProfile.col_id}
                </Text>
                {/* Add other specific fields for Colaborador if needed */}
              </>
            )}
          </>
        )}

        {/* Password Change Form */}
        <Divider my={6} />

        <Heading size="md" mb={4} color="green.700">
          Alterar Senha
        </Heading>
        <Box maxW="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Current Password */}
            {!codeSent && (
              <>
                <FormControl isInvalid={errors.currentPassword} mb={4}>
                  <FormLabel color="green.600">Senha Atual</FormLabel>
                  <Input
                    type="password"
                    placeholder="Digite sua senha atual"
                    {...register('currentPassword', {
                      required: 'Senha atual é obrigatória',
                    })}
                  />
                  <FormErrorMessage>
                    {errors.currentPassword && errors.currentPassword.message}
                    </FormErrorMessage>
                </FormControl>

                {/* New Password */}
                <FormControl isInvalid={errors.newPassword} mb={4}>
                  <FormLabel color="green.600">Nova Senha</FormLabel>
                  <Input
                    type="password"
                    placeholder="Digite sua nova senha"
                    {...register('newPassword', {
                      required: 'Nova senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'A nova senha deve ter pelo menos 6 caracteres',
                      },
                    })}
                  />
                  <FormErrorMessage>
                    {errors.newPassword && errors.newPassword.message}
                  </FormErrorMessage>
                </FormControl>

                {/* Confirm New Password */}
                <FormControl isInvalid={errors.confirmPassword} mb={4}>
                  <FormLabel color="green.600">Confirmar Nova Senha</FormLabel>
                  <Input
                    type="password"
                    placeholder="Confirme sua nova senha"
                    {...register('confirmPassword', {
                      required: 'Confirmação de senha é obrigatória',
                      validate: (value) =>
                        value === watch('newPassword') ||
                        'As senhas não coincidem',
                    })}
                  />
                  <FormErrorMessage>
                    {errors.confirmPassword && errors.confirmPassword.message}
                  </FormErrorMessage>
                </FormControl>

                {/* Submit Button */}
                <Button type="submit" colorScheme="green" width="full" mb={4}>
                  Enviar Código de Confirmação
                </Button>
              </>
            )}

            {/* Confirmation Code Field */}
            {codeSent && (
              <>
                <FormControl isInvalid={errors.code} mb={4}>
                  <FormLabel color="green.600">Código de Confirmação</FormLabel>
                  <Input
                    type="text"
                    placeholder="Digite o código enviado por e-mail"
                    {...register('code', {
                      required: 'O código de confirmação é obrigatório',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'O código deve ter 6 dígitos numéricos',
                      },
                    })}
                  />
                  <FormErrorMessage>
                    {errors.code && errors.code.message}
                  </FormErrorMessage>
                </FormControl>

                {/* Submit Button */}
                <Button type="submit" colorScheme="green" width="full">
                  Confirmar Troca de Senha
                </Button>
              </>
            )}
          </form>
        </Box>
      </Box>
    </Container>
  );
};

export default Profile;