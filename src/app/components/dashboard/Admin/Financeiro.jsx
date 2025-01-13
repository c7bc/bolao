'use client';

import React, { useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Flex,
  Input,
  Text,
  Stack,
  Container,
  useToast,
  Tooltip,
  IconButton,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
} from '@chakra-ui/react';
import { CheckIcon, EmailIcon, PhoneIcon, AttachmentIcon } from '@chakra-ui/icons';

const Financeiro = () => {
  // Mock de dados com múltiplos premiados por categoria
  const [jogos, setJogos] = useState([
    {
      jog_id: '1',
      jog_nome: 'Bolão da Copa 2022',
      total_arrecadado: 10000.0,
      custos_administrativos: 1000.0, // 10% do total
      premiacoes_totais: {
        campeao: 4500.0, // 50% do líquido
        vice: 2700.0,    // 30% do líquido
        ultimo_colocado: 1800.0 // 20% do líquido
      },
      pontuacoes: {
        campeao: 10,
        vice: 9,
        ultimo_colocado: 3
      },
      premiacoes: {
        campeao: [
          { 
            cli_id: '101', 
            nome: 'João Silva', 
            telefone: '5511999999999', 
            email: 'joao@example.com', 
            premio: 2250, // Dividido entre 2 campeões
            pontos: 10,
            pago: false 
          },
          { 
            cli_id: '107', 
            nome: 'Ricardo Souza', 
            telefone: '5511999999991', 
            email: 'ricardo@example.com', 
            premio: 2250, // Dividido entre 2 campeões
            pontos: 10,
            pago: false 
          }
        ],
        vice: [
          { 
            cli_id: '102', 
            nome: 'Maria Santos', 
            telefone: '5511988888888', 
            email: 'maria@example.com', 
            premio: 900, // Dividido entre 3 vices
            pontos: 9,
            pago: false 
          },
          { 
            cli_id: '108', 
            nome: 'Paulo Mendes', 
            telefone: '5511988888881', 
            email: 'paulo@example.com', 
            premio: 900, // Dividido entre 3 vices
            pontos: 9,
            pago: false 
          },
          { 
            cli_id: '109', 
            nome: 'Carla Dias', 
            telefone: '5511988888882', 
            email: 'carla@example.com', 
            premio: 900, // Dividido entre 3 vices
            pontos: 9,
            pago: false 
          }
        ],
        ultimo_colocado: [
          { 
            cli_id: '103', 
            nome: 'Pedro Oliveira', 
            telefone: '5511977777777', 
            email: 'pedro@example.com', 
            premio: 600, // Dividido entre 3 últimos
            pontos: 3,
            pago: false 
          },
          { 
            cli_id: '110', 
            nome: 'Sandra Lima', 
            telefone: '5511977777771', 
            email: 'sandra@example.com', 
            premio: 600, // Dividido entre 3 últimos
            pontos: 3,
            pago: false 
          },
          { 
            cli_id: '111', 
            nome: 'Marco Antonio', 
            telefone: '5511977777772', 
            email: 'marco@example.com', 
            premio: 600, // Dividido entre 3 últimos
            pontos: 3,
            pago: false 
          }
        ],
      },
    },
    // Segundo jogo com estrutura similar
    {
      jog_id: '2',
      jog_nome: 'Bolão NBA 2023',
      total_arrecadado: 8000.0,
      custos_administrativos: 800.0, // 10% do total
      premiacoes_totais: {
        campeao: 3600.0, // 50% do líquido
        vice: 2160.0,    // 30% do líquido
        ultimo_colocado: 1440.0 // 20% do líquido
      },
      pontuacoes: {
        campeao: 10,
        vice: 9,
        ultimo_colocado: 3
      },
      premiacoes: {
        campeao: [
          { 
            cli_id: '104', 
            nome: 'Carlos Lima', 
            telefone: '5511966666666', 
            email: 'carlos@example.com', 
            premio: 1800, // Dividido entre 2 campeões
            pontos: 10,
            pago: true 
          },
          { 
            cli_id: '112', 
            nome: 'Felipe Santos', 
            telefone: '5511966666661', 
            email: 'felipe@example.com', 
            premio: 1800, // Dividido entre 2 campeões
            pontos: 10,
            pago: true 
          }
        ],
        vice: [
          { 
            cli_id: '105', 
            nome: 'Ana Paula', 
            telefone: '5511955555555', 
            email: 'ana@example.com', 
            premio: 720, // Dividido entre 3 vices
            pontos: 9,
            pago: true 
          },
          { 
            cli_id: '113', 
            nome: 'Roberto Silva', 
            telefone: '5511955555551', 
            email: 'roberto@example.com', 
            premio: 720, // Dividido entre 3 vices
            pontos: 9,
            pago: false 
          },
          { 
            cli_id: '114', 
            nome: 'Marina Costa', 
            telefone: '5511955555552', 
            email: 'marina@example.com', 
            premio: 720, // Dividido entre 3 vices
            pontos: 9,
            pago: false 
          }
        ],
        ultimo_colocado: [
          { 
            cli_id: '106', 
            nome: 'Luiz Costa', 
            telefone: '5511944444444', 
            email: 'luiz@example.com', 
            premio: 480, // Dividido entre 3 últimos
            pontos: 3,
            pago: false 
          },
          { 
            cli_id: '115', 
            nome: 'Beatriz Martins', 
            telefone: '5511944444441', 
            email: 'beatriz@example.com', 
            premio: 480, // Dividido entre 3 últimos
            pontos: 3,
            pago: false 
          },
          { 
            cli_id: '116', 
            nome: 'Gabriel Alves', 
            telefone: '5511944444442', 
            email: 'gabriel@example.com', 
            premio: 480, // Dividido entre 3 últimos
            pontos: 3,
            pago: false 
          }
        ],
      },
    },
  ]);

  const toast = useToast();

  const marcarComoPago = (jogoId, tipoPremiacao, clienteId) => {
    setJogos((prevJogos) =>
      prevJogos.map((jogo) => {
        if (jogo.jog_id === jogoId) {
          return {
            ...jogo,
            premiacoes: {
              ...jogo.premiacoes,
              [tipoPremiacao]: jogo.premiacoes[tipoPremiacao].map((premiado) =>
                premiado.cli_id === clienteId ? { ...premiado, pago: true } : premiado
              ),
            },
          };
        }
        return jogo;
      })
    );

    toast({
      title: 'Pagamento confirmado.',
      description: `Pagamento marcado como feito para o ${tipoPremiacao}.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const enviarNotificacao = (meio, contato) => {
    toast({
      title: 'Notificação enviada.',
      description: `Notificação enviada via ${meio} para ${contato}.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const calcularValorLiquido = (totalArrecadado, custosAdministrativos) => {
    return totalArrecadado - custosAdministrativos;
  };

  const getQuantidadePremiados = (jogo, categoria) => {
    return jogo.premiacoes[categoria].length;
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Stack spacing={8}>
        <Heading size="lg">Financeiro</Heading>
        {jogos.map((jogo) => (
          <Box key={jogo.jog_id} borderWidth="1px" borderRadius="lg" p={4} mb={6}>
            <Heading size="md" mb={4}>{jogo.jog_nome}</Heading>
            
            <StatGroup mb={4}>
              <Stat>
                <StatLabel>Total Arrecadado</StatLabel>
                <StatNumber>R$ {jogo.total_arrecadado.toFixed(2)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Custos Administrativos</StatLabel>
                <StatNumber>R$ {jogo.custos_administrativos.toFixed(2)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Valor Líquido para Premiação</StatLabel>
                <StatNumber>
                  R$ {calcularValorLiquido(jogo.total_arrecadado, jogo.custos_administrativos).toFixed(2)}
                </StatNumber>
              </Stat>
            </StatGroup>

            <Box mb={4}>
              <Heading size="sm" mb={2}>Distribuição das Premiações</Heading>
              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                {['campeao', 'vice', 'ultimo_colocado'].map((categoria) => (
                  <Box key={categoria} p={3} borderWidth="1px" borderRadius="md">
                    <Text fontWeight="bold">
                      {categoria.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text>Total: R$ {jogo.premiacoes_totais[categoria].toFixed(2)}</Text>
                    <Text>Premiados: {getQuantidadePremiados(jogo, categoria)}</Text>
                    <Text>Valor por premiado: R$ {(jogo.premiacoes_totais[categoria] / getQuantidadePremiados(jogo, categoria)).toFixed(2)}</Text>
                  </Box>
                ))}
              </Grid>
            </Box>

            <Table variant="simple" colorScheme="green">
              <Thead>
                <Tr>
                  <Th>Tipo de Premiação</Th>
                  <Th>Nome</Th>
                  <Th>Pontos</Th>
                  <Th>Prêmio (R$)</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {['campeao', 'vice', 'ultimo_colocado'].map((tipoPremiacao) => (
                  jogo.premiacoes[tipoPremiacao].map((premiado) => (
                    <Tr key={`${jogo.jog_id}-${tipoPremiacao}-${premiado.cli_id}`}>
                      <Td>
                        {tipoPremiacao.replace('_', ' ').toUpperCase()}
                        <Text fontSize="sm" color="gray.600">
                          {jogo.pontuacoes[tipoPremiacao]} pontos
                        </Text>
                      </Td>
                      <Td>{premiado.nome}</Td>
                      <Td>{premiado.pontos}</Td>
                      <Td>
                        R$ {premiado.premio.toFixed(2)}
                        <Text fontSize="sm" color="gray.600">
                          {((premiado.premio / jogo.premiacoes_totais[tipoPremiacao]) * 100).toFixed(1)}% da categoria
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={premiado.pago ? 'green' : 'yellow'}>
                          {premiado.pago ? 'Pago' : 'Pendente'}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex gap={2} align="center">
                          {!premiado.pago && (
                            <Button
                              size="sm"
                              colorScheme="green"
                              leftIcon={<CheckIcon />}
                              onClick={() => marcarComoPago(jogo.jog_id, tipoPremiacao, premiado.cli_id)}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                          <Tooltip label="Enviar Email">
                            <IconButton
                              size="sm"
                              colorScheme="blue"
                              icon={<EmailIcon />}
                              onClick={() => enviarNotificacao('email', premiado.email)}
                            />
                          </Tooltip>
                          <Tooltip label="Enviar SMS">
                            <IconButton
                              size="sm"
                              colorScheme="teal"
                              icon={<PhoneIcon />}
                              onClick={() => enviarNotificacao('SMS', premiado.telefone)}
                            />
                          </Tooltip>
                          <Tooltip label="Anexar Comprovante">
                            <IconButton
                              size="sm"
                              colorScheme="gray"
                              icon={<AttachmentIcon />}
                              onClick={() => toast({
                                title: 'Anexar Comprovante',
                                description: 'Funcionalidade ainda não implementada.',
                                status: 'info',
                                duration: 3000,
                                isClosable: true,
                              })}
                            />
                          </Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  ))
                ))}
              </Tbody>
            </Table>
          </Box>
        ))}
      </Stack>
    </Container>
  );
};

export default Financeiro;