// src/app/components/dashboard/Perfil/Profile.jsx

'use client';

import React, { useState } from 'react';
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

      await axios.post(
        '/api/user/send-code',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: 'Código enviado por e-mail.',
        description: 'Verifique seu e-mail para obter o código de confirmação.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setCodeSent(true);
    } catch (err) {
      console.error('Erro ao enviar o código:', err);
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
      // Primeiro passo: Enviar o código
      await onSendCode();
    } else {
      // Segundo passo: Verificar o código e alterar a senha
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

        await axios.put(
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
        toast({
          title: 'Senha atualizada com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        reset();
        setCodeSent(false);
      } catch (err) {
        console.error('Erro ao atualizar senha:', err);
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

  // Função para obter informações baseadas no role
  const getUserInfo = () => {
    switch (userType) {
      case 'cliente':
        return {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          status: userProfile.status,
          creationDate: userProfile.creationDate,
          additionalInfo: userProfile.additionalInfo, // Histórico de transações
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
          // Superadmin não possui telefone, status ou data de criação
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
        {/* Informações do Usuário */}
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

        {/* Informações Pessoais */}
        <VStack align="start" spacing={4}>
          {/* E-mail */}
          <Flex align="center">
            <EmailIcon mr={2} color="green.500" />
            <Text color="green.600">
              <strong>E-mail:</strong> {userInfo.email}
            </Text>
          </Flex>

          {/* Telefone - Não exibir para superadmin */}
          {userType !== 'superadmin' && userInfo.phone && (
            <Flex align="center">
              <PhoneIcon mr={2} color="green.500" />
              <Text color="green.600">
                <strong>Telefone:</strong> {userInfo.phone}
              </Text>
            </Flex>
          )}

          {/* Data de Criação - Não exibir para superadmin */}
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

        {/* Histórico de Transações (Apenas para Clientes) */}
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

        {/* Dados Adicionais */}
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
                  <Text color="green.600">Sem colaborador associado.</Text>
                )}
              </>
            )}
            {userType === 'admin' && (
              <>
                <Text color="green.600">
                  <strong>ID do Admin:</strong> {userProfile.id}
                </Text>
                {/* Adicione outros campos específicos para Admin, se necessário */}
              </>
            )}
            {userType === 'colaborador' && (
              <>
                <Text color="green.600">
                  <strong>ID do Colaborador:</strong> {userProfile.col_id}
                </Text>
                {/* Adicione outros campos específicos para Colaborador, se necessário */}
              </>
            )}
          </>
        )}

        {/* Formulário para Alterar Senha */}
        <Divider my={6} />

        <Heading size="md" mb={4} color="green.700">
          Alterar Senha
        </Heading>
        <Box maxW="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Senha Atual */}
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

                {/* Nova Senha */}
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

                {/* Confirmar Nova Senha */}
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

                {/* Botão de Envio */}
                <Button type="submit" colorScheme="green" width="full" mb={4}>
                  Enviar Código de Confirmação
                </Button>
              </>
            )}

            {/* Campo para Código de Confirmação */}
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

                {/* Botão de Submissão */}
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
