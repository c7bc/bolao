'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  Spinner,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import axios from 'axios';

const ClienteDetails = ({ cliente, onClose }) => {
  const [historico, setHistorico] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/cliente/historico?clienteId=${cliente.cli_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHistorico(response.data);
      } catch (error) {
        setHistorico(null);
      } finally {
        setLoading(false);
      }
    };

    if (cliente) {
      fetchHistorico();
    }
  }, [cliente]);

  if (!cliente) return null;

  if (loading) {
    return (
      <Modal isOpen={!!cliente} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Carregando Detalhes</ModalHeader>
          <ModalBody>
            <Spinner />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={!!cliente} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4}>
            <Text><strong>Nome:</strong> {cliente.cli_nome}</Text>
            <Text><strong>Email:</strong> {cliente.cli_email}</Text>
            <Text><strong>Telefone:</strong> {cliente.cli_telefone}</Text>
            <Text><strong>Status:</strong> {cliente.cli_status === 'active' ? 'Ativo' : 'Desativado'}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(cliente.cli_datacriacao).toLocaleDateString()}</Text>
          </Box>

          {/* Jogos Participados */}
          {
          /* <Box mb={6}>
            <Heading size="md" mb={2}>Jogos Participados</Heading>
            {!historico?.jogosParticipados?.length ? (
              <Text>Nenhum jogo encontrado.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome do Jogo</Th>
                    <Th>Data de Início</Th>
                    <Th>Data de Fim</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {historico.jogosParticipados.map((jogo) => (
                    <Tr key={jogo.jog_id}>
                      <Td>{jogo.jog_nome}</Td>
                      <Td>{new Date(jogo.data_inicio).toLocaleDateString()}</Td>
                      <Td>{new Date(jogo.data_fim).toLocaleDateString()}</Td>
                      <Td>{jogo.status}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>

          {/* Pontuações */}
          {/* <Box mb={6}>
            <Heading size="md" mb={2}>Pontuações</Heading>
            {!historico?.pontuacoes?.length ? (
              <Text>Nenhuma pontuação encontrada.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Jogo</Th>
                    <Th>Pontuação</Th>
                    <Th>Data</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {historico.pontuacoes.map((score) => (
                    <Tr key={score.score_id}>
                      <Td>{score.jog_nome}</Td>
                      <Td>{score.pontuacao}</Td>
                      <Td>{new Date(score.data).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box> */}

          {/* Histórico Financeiro */}
          {/* <Box mb={6}>
            <Heading size="md" mb={2}>Histórico Financeiro</Heading>
            {!historico?.financeiro?.length ? (
              <Text>Nenhum registro financeiro encontrado.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Transação</Th>
                    <Th>Valor</Th>
                    <Th>Data</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {historico.financeiro.map((finance) => (
                    <Tr key={finance.fin_id}>
                      <Td>{finance.fin_tipo}</Td>
                      <Td>R$ {finance.fin_valor}</Td>
                      <Td>{new Date(finance.fin_data).toLocaleDateString()}</Td>
                      <Td>{finance.fin_status}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box> */}

          {/* Apostas */}
          {/* <Box mb={6}>
            <Heading size="md" mb={2}>Apostas</Heading>
            {!historico?.apostas?.length ? (
              <Text>Nenhuma aposta encontrada.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome do Jogo</Th>
                    <Th>Números Escolhidos</Th>
                    <Th>Valor</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {historico.apostas.map((aposta) => (
                    <Tr key={aposta.aposta_id}>
                      <Td>{aposta.jogo_nome}</Td>
                      <Td>{aposta.numeros_escolhidos.join(', ')}</Td>
                      <Td>R$ {aposta.valor.toFixed(2)}</Td>
                      <Td>{aposta.status}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box> */}

          {/* Premiações */}
          {/* <Box mb={6}>
            <Heading size="md" mb={2}>Premiações</Heading>
            {!historico?.premiacoes?.length ? (
              <Text>Nenhuma premiação encontrada.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome do Jogo</Th>
                    <Th>Categoria</Th>
                    <Th>Prêmio</Th>
                    <Th>Pago</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {historico.premiacoes.map((premiacao) => (
                    <Tr key={premiacao.premiacao_id}>
                      <Td>{premiacao.jogo_nome}</Td>
                      <Td>{premiacao.categoria}</Td>
                      <Td>R$ {premiacao.premio.toFixed(2)}</Td>
                      <Td>{premiacao.pago ? 'Sim' : 'Não'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box> */}
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClienteDetails;