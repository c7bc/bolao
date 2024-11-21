// src/app/components/dashboard/Colaborador/Jogos.jsx

'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  useBreakpointValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Input,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const Jogos = () => {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const toast = useToast();

  // Estados para gerenciar o modal de detalhes
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [jogoSelecionado, setJogoSelecionado] = useState(null);

  // Estados para inserir resultados (exemplo)
  const [resultado, setResultado] = useState('');

  // Função para buscar jogos associados ao colaborador
  const fetchJogos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/colaborador/jogos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { status: 'ativo' },
      });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: 'Erro ao carregar jogos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para abrir o modal com os detalhes do jogo
  const handleDetalhes = (jogo) => {
    setJogoSelecionado(jogo);
    onOpen();
  };

  // Função para inserir resultados do jogo (exemplo)
  const handleInserirResultado = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/colaborador/jogos/${jogoSelecionado.jog_id}/resultado`,
        { resultado },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: 'Resultado inserido com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      fetchJogos(); // Atualiza a lista de jogos
    } catch (error) {
      console.error('Erro ao inserir resultado:', error);
      toast({
        title: 'Erro ao inserir resultado.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Jogos Associados
      </Heading>

      {loading ? (
        <Text>Carregando jogos...</Text>
      ) : jogos.length === 0 ? (
        <Text>Você ainda não está associado a nenhum jogo.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {jogos.map((jogo) => (
            <Box
              key={jogo.jog_id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="md"
            >
              <Heading as="h3" size="md" color="green.700" mb={2}>
                {jogo.jog_nome}
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Valor: R$ {jogo.jog_valorjogo}
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Início: {new Date(jogo.jog_data_inicio).toLocaleDateString()}
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Fim: {new Date(jogo.jog_data_fim).toLocaleDateString()}
              </Text>
              <Button
                colorScheme="blue"
                size={buttonSize}
                onClick={() => handleDetalhes(jogo)}
              >
                Detalhes
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Modal de Detalhes do Jogo */}
      {jogoSelecionado && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Detalhes do Jogo: {jogoSelecionado.jog_nome}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={2}>
                <strong>Tipo do Jogo:</strong> {jogoSelecionado.jog_tipodojogo}
              </Text>
              <Text mb={2}>
                <strong>Valor do Jogo:</strong> R$ {jogoSelecionado.jog_valorjogo}
              </Text>
              <Text mb={2}>
                <strong>Quantidade Total de Números:</strong> {jogoSelecionado.jog_numeros_totais}
              </Text>
              <Text mb={2}>
                <strong>Quantidade Mínima de Números:</strong> {jogoSelecionado.jog_quantidade_minima}
              </Text>
              <Text mb={2}>
                <strong>Quantidade Máxima de Números:</strong> {jogoSelecionado.jog_quantidade_maxima}
              </Text>
              <Text mb={2}>
                <strong>Expiração:</strong> {new Date(jogoSelecionado.jog_expiracao).toLocaleDateString()}
              </Text>
              <Text mb={4}>
                <strong>Status:</strong> {jogoSelecionado.jog_status}
              </Text>

              {/* Inserir Resultado (apenas se o jogo estiver ativo) */}
              {jogoSelecionado.jog_status === 'ativo' && (
                <FormControl mb={4}>
                  <FormLabel>Inserir Resultado</FormLabel>
                  <Input
                    placeholder="Digite o resultado do jogo"
                    value={resultado}
                    onChange={(e) => setResultado(e.target.value)}
                  />
                </FormControl>
              )}

              {/* Tabela de Participantes */}
              <Heading size="md" mb={2}>
                Participantes
              </Heading>
              {jogoSelecionado.participantes.length === 0 ? (
                <Text>Nenhum participante até o momento.</Text>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Cliente</Th>
                      <Th>Números Selecionados</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {jogoSelecionado.participantes.map((participante) => (
                      <Tr key={participante.id}>
                        <Td>{participante.clienteNome}</Td>
                        <Td>{participante.numerosSelecionados.join(', ')}</Td>
                        <Td>{participante.status}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </ModalBody>

            <ModalFooter>
              {jogoSelecionado.jog_status === 'ativo' && (
                <Button colorScheme="green" mr={3} onClick={handleInserirResultado} isDisabled={!resultado}>
                  Inserir Resultado
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default Jogos;
