// Caminho: src/app/components/dashboard/Colaborador/ResultadosManagementColaborador.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';

const ResultadosManagementColaborador = () => {
  const [jogos, setJogos] = useState([]);
  const [selectedJogo, setSelectedJogo] = useState('');
  const [formData, setFormData] = useState({
    numeros: '',
    data_sorteio: '',
    premio: '',
  });
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Buscar jogos disponíveis
  const fetchJogos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token ausente.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.get('/api/colaborador/jogos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJogos(response.data.jogos || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar jogos',
        description: error.response?.data?.error || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Buscar resultados existentes
  const fetchResultados = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token ausente.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.get('/api/colaborador/resultados', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResultados(response.data.resultados || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar resultados',
        description: error.response?.data?.error || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchJogos();
    fetchResultados();
  }, [fetchJogos, fetchResultados]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (!selectedJogo || !formData.numeros || !formData.data_sorteio || !formData.premio) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const jogo = jogos.find((j) => j.jog_id === selectedJogo);
      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }

      // Validar números com base no tipo do jogo
      if (jogo.jog_tipodojogo !== 'JOGO_DO_BICHO') {
        const numerosArray = formData.numeros.split(',').map((num) => num.trim());
        const min = parseInt(jogo.jog_quantidade_minima, 10);
        const max = parseInt(jogo.jog_quantidade_maxima, 10);

        if (numerosArray.length < min || numerosArray.length > max) {
          toast({
            title: `A quantidade de números deve estar entre ${min} e ${max}`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }

        const numerosValidos = numerosArray.every((num) => /^\d+$/.test(num));
        if (!numerosValidos) {
          toast({
            title: 'Os números devem conter apenas dígitos',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token ausente.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      await axios.post(
        '/api/colaborador/resultados/create',
        {
          jogo_id: selectedJogo,
          ...formData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Resultado registrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setSelectedJogo('');
      setFormData({
        numeros: '',
        data_sorteio: '',
        premio: '',
      });
      onClose();
      fetchResultados();
    } catch (error) {
      toast({
        title: 'Erro ao registrar resultado',
        description: error.response?.data?.error || error.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Button colorScheme="green" onClick={onOpen} mb={4}>
        Registrar Novo Resultado
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registrar Novo Resultado</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Jogo</FormLabel>
                <Select
                  placeholder="Selecione o jogo"
                  value={selectedJogo}
                  onChange={(e) => setSelectedJogo(e.target.value)}
                >
                  {jogos.map((jogo) => (
                    <option key={jogo.jog_id} value={jogo.jog_id}>
                      {jogo.jog_nome}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Números Sorteados</FormLabel>
                <Input
                  name="numeros"
                  value={formData.numeros}
                  onChange={handleInputChange}
                  placeholder="Ex: 1,2,3,4,5,6"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Data do Sorteio</FormLabel>
                <Input
                  name="data_sorteio"
                  type="datetime-local"
                  value={formData.data_sorteio}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Valor do Prêmio</FormLabel>
                <Input
                  name="premio"
                  type="number"
                  value={formData.premio}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={loading}>
              Salvar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {resultados.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Jogo</Th>
              <Th>Números Sorteados</Th>
              <Th>Data do Sorteio</Th>
              <Th>Prêmio</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {resultados.map((resultado) => (
              <Tr key={resultado.resultado_id}>
                <Td>{resultado.jogo_nome}</Td>
                <Td>{resultado.numeros}</Td>
                <Td>{new Date(resultado.data_sorteio).toLocaleString()}</Td>
                <Td>R$ {parseFloat(resultado.premio).toFixed(2)}</Td>
                <Td>{resultado.status}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          <Text>Nenhum resultado registrado.</Text>
        </Alert>
      )}
    </Box>
  );
};

export default ResultadosManagementColaborador;
