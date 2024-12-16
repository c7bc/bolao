// src/app/components/dashboard/Admin/ResultadosManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Stack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';

const ResultadosManagement = () => {
  const [jogos, setJogos] = useState([]);
  const [tipoJogo, setTipoJogo] = useState('');
  const [selectedJogo, setSelectedJogo] = useState('');
  const [numeros, setNumeros] = useState('');
  const [dezena, setDezena] = useState('');
  const [horario, setHorario] = useState('');
  const [dataSorteio, setDataSorteio] = useState('');
  const [premio, setPremio] = useState('');
  const [resultados, setResultados] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const toast = useToast();

  const animalOptions = [
    'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
    'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
    'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
    'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
    'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
  ];

  const gameTypeOptions = {
    MEGA: { min: 6, max: 60 },
    LOTOFACIL: { min: 15, max: 25 },
    JOGO_DO_BICHO: { min: 6, max: 25 },
  };

  const fetchJogos = useCallback(async () => {
    try {
      const response = await axios.get('/api/jogos/list', { params: { status: 'open' } });
      setJogos(response.data.jogos);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: 'Erro ao buscar jogos.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const fetchResultados = useCallback(async () => {
    try {
      if (!selectedJogo) {
        setResultados([]);
        return;
      }
      const response = await axios.get(`/api/resultados/${selectedJogo}`);
      setResultados(response.data.resultados);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      toast({
        title: 'Erro ao buscar resultados.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [selectedJogo, toast]);

  useEffect(() => {
    fetchJogos();
  }, [fetchJogos]);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  const handleSubmit = async () => {
    try {
      if (!selectedJogo || !tipoJogo || !dataSorteio || !premio) {
        toast({
          title: 'Por favor, preencha todos os campos obrigatórios.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const payload = {
        jogo_slug: selectedJogo,
        tipo_jogo: tipoJogo,
        data_sorteio: dataSorteio,
        premio: parseFloat(premio),
      };

      if (tipoJogo !== 'JOGO_DO_BICHO') {
        if (!numeros) {
          toast({
            title: 'Por favor, insira os números sorteados.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        payload.numeros = numeros;
      } else {
        if (!dezena || !horario) {
          toast({
            title: 'Por favor, insira a dezena e o horário do sorteio.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        payload.dezena = dezena;
        payload.horario = horario;
      }

      const token = localStorage.getItem('token');
      await axios.post('/api/resultados/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Resultado registrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Resetar campos
      setSelectedJogo('');
      setTipoJogo('');
      setNumeros('');
      setDezena('');
      setHorario('');
      setDataSorteio('');
      setPremio('');
      setResultados([]);
      setAutoGenerate(false);
    } catch (error) {
      console.error('Erro ao registrar resultado:', error);
      toast({
        title: 'Erro ao registrar resultado.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Função para gerar números automaticamente
  const generateAutoNumbers = () => {
    if (!tipoJogo) {
      toast({
        title: 'Selecione o tipo de jogo primeiro.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      setAutoGenerate(false);
      return;
    }

    const { min, max } = gameTypeOptions[tipoJogo];
    let generated;

    if (tipoJogo !== 'JOGO_DO_BICHO') {
      // Gerar números únicos
      const count = min; // Definindo a quantidade como o mínimo
      const numbersSet = new Set();
      while (numbersSet.size < count) {
        const num = Math.floor(Math.random() * max) + 1;
        numbersSet.add(num);
      }
      generated = Array.from(numbersSet).sort((a, b) => a - b).join(',');
      setNumeros(generated);
    } else {
      // Gerar animais únicos
      const count = min; // Definindo a quantidade como o mínimo
      const shuffled = animalOptions.sort(() => 0.5 - Math.random());
      generated = shuffled.slice(0, count).join(',');
      setDezena(''); // Limpar dezena anterior
      setHorario(''); // Limpar horário anterior
      setHorario('');
      // Para JOGO_DO_BICHO, a dezena e o horário são necessários, então apenas animas
      // Dependendo da lógica, talvez queira gerar dezena e horário também
      // Aqui apenas os animais são gerados
      // Se desejar gerar dezena e horário automaticamente, você pode adicionar aqui
      // Por exemplo:
      const generatedDezena = Math.floor(Math.random() * 25) + 1;
      const horarios = ["09h", "11h", "14h", "16h", "18h", "21h"];
      const generatedHorario = horarios[Math.floor(Math.random() * horarios.length)];
      setDezena(generatedDezena.toString());
      setHorario(generatedHorario);
      setNumeros(generated); // Animais
    }

    toast({
      title: 'Seleções geradas automaticamente.',
      description: 'Os números/animais foram gerados conforme o tipo de jogo selecionado.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        Registrar Resultados dos Sorteios
      </Heading>
      <Stack spacing={4} mb={6}>
        <FormControl isRequired>
          <FormLabel>Jogo</FormLabel>
          <Select
            placeholder="Selecione o jogo"
            value={selectedJogo}
            onChange={(e) => setSelectedJogo(e.target.value)}
          >
            {jogos.map((jogo) => (
              <option key={jogo.jog_id} value={jogo.slug}>
                {jogo.jog_nome}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Tipo de Jogo</FormLabel>
          <Select
            placeholder="Selecione o tipo de jogo"
            value={tipoJogo}
            onChange={(e) => {
              setTipoJogo(e.target.value);
              setNumeros('');
              setDezena('');
              setHorario('');
              setAutoGenerate(false);
            }}
          >
            <option value="MEGA">Mega-Sena</option>
            <option value="LOTOFACIL">Lotofácil</option>
            <option value="JOGO_DO_BICHO">Jogo do Bicho</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Data do Sorteio</FormLabel>
          <Input
            type="date"
            value={dataSorteio}
            onChange={(e) => setDataSorteio(e.target.value)}
          />
        </FormControl>
        {/* Switch para gerar números automaticamente */}
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="autoGenerate" mb="0">
            Gerar Seleções Automaticamente?
          </FormLabel>
          <Switch
            id="autoGenerate"
            isChecked={autoGenerate}
            onChange={(e) => {
              setAutoGenerate(e.target.checked);
              if (e.target.checked) {
                generateAutoNumbers();
              } else {
                // Limpar seleções geradas automaticamente
                setNumeros('');
                setDezena('');
                setHorario('');
              }
            }}
            colorScheme="green"
          />
        </FormControl>
        {/* Condicionalmente renderizar campos de entrada com base no tipo de jogo */}
        {tipoJogo !== 'JOGO_DO_BICHO' ? (
          <FormControl isRequired={!autoGenerate}>
            <FormLabel>Números Sorteados (separados por vírgula)</FormLabel>
            <Input
              placeholder="Ex: 01,02,03,04,05,06"
              value={numeros}
              onChange={(e) => setNumeros(e.target.value)}
              isDisabled={autoGenerate}
            />
            {!autoGenerate && (
              <Button mt={2} size="sm" onClick={generateAutoNumbers}>
                Gerar Automaticamente
              </Button>
            )}
          </FormControl>
        ) : (
          <>
            <FormControl isRequired={!autoGenerate}>
              <FormLabel>Dezena Sorteada</FormLabel>
              <NumberInput
                min={1}
                max={25}
                value={dezena}
                onChange={(value) => setDezena(value)}
                isDisabled={autoGenerate}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {!autoGenerate && (
                <Button mt={2} size="sm" onClick={() => {
                  const generatedDezena = Math.floor(Math.random() * 25) + 1;
                  setDezena(generatedDezena.toString());
                  toast({
                    title: 'Dezena gerada automaticamente.',
                    description: `Dezena: ${generatedDezena}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}>
                  Gerar Dezena Automaticamente
                </Button>
              )}
            </FormControl>
            <FormControl isRequired={!autoGenerate}>
              <FormLabel>Horário do Sorteio</FormLabel>
              <Select
                placeholder="Selecione o horário"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                isDisabled={autoGenerate}
              >
                <option value="09h">09h</option>
                <option value="11h">11h</option>
                <option value="14h">14h</option>
                <option value="16h">16h</option>
                <option value="18h">18h</option>
                <option value="21h">21h</option>
              </Select>
              {!autoGenerate && (
                <Button mt={2} size="sm" onClick={() => {
                  const horarios = ["09h", "11h", "14h", "16h", "18h", "21h"];
                  const generatedHorario = horarios[Math.floor(Math.random() * horarios.length)];
                  setHorario(generatedHorario);
                  toast({
                    title: 'Horário gerado automaticamente.',
                    description: `Horário: ${generatedHorario}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}>
                  Gerar Horário Automaticamente
                </Button>
              )}
            </FormControl>
            <FormControl isRequired={!autoGenerate}>
              <FormLabel>Animais Sorteados (separados por vírgula)</FormLabel>
              <Input
                placeholder="Ex: Avestruz, Águia, Burro, etc."
                value={numeros}
                onChange={(e) => setNumeros(e.target.value)}
                isDisabled={autoGenerate}
              />
              {!autoGenerate && (
                <Button mt={2} size="sm" onClick={() => {
                  const shuffled = animalOptions.sort(() => 0.5 - Math.random());
                  const count = gameTypeOptions['JOGO_DO_BICHO'].min;
                  const generated = shuffled.slice(0, count).join(',');
                  setNumeros(generated);
                  toast({
                    title: 'Animais gerados automaticamente.',
                    description: `Animais: ${generated}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}>
                  Gerar Animais Automaticamente
                </Button>
              )}
            </FormControl>
          </>
        )}
        <FormControl isRequired>
          <FormLabel>Prêmio (R$)</FormLabel>
          <Input
            type="number"
            value={premio}
            onChange={(e) => setPremio(e.target.value)}
            placeholder="Ex: 1000000.00"
            min="0"
          />
        </FormControl>
        <Button colorScheme="blue" onClick={handleSubmit}>
          Registrar Resultado
        </Button>
      </Stack>
      {/* Tabela para exibir os resultados registrados */}
      {selectedJogo && (
        <Box>
          <Heading size="sm" mb={2}>
            Resultados Registrados
          </Heading>
          {resultados.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data do Sorteio</Th>
                  <Th>Tipo de Jogo</Th>
                  {tipoJogo !== 'JOGO_DO_BICHO' ? (
                    <Th>Números Sorteados</Th>
                  ) : (
                    <>
                      <Th>Dezena Sorteada</Th>
                      <Th>Horário</Th>
                      <Th>Animais Sorteados</Th>
                    </>
                  )}
                  <Th>Prêmio (R$)</Th>
                </Tr>
              </Thead>
              <Tbody>
                {resultados.map((resultado) => (
                  <Tr key={resultado.resultado_id}>
                    <Td>{new Date(resultado.data_sorteio).toLocaleDateString()}</Td>
                    <Td>
                      {resultado.tipo_jogo === 'MEGA' && 'Mega-Sena'}
                      {resultado.tipo_jogo === 'LOTOFACIL' && 'Lotofácil'}
                      {resultado.tipo_jogo === 'JOGO_DO_BICHO' && 'Jogo do Bicho'}
                    </Td>
                    {resultado.tipo_jogo !== 'JOGO_DO_BICHO' ? (
                      <Td>{resultado.numeros}</Td>
                    ) : (
                      <>
                        <Td>{resultado.dezena}</Td>
                        <Td>{resultado.horario}</Td>
                        <Td>{resultado.numeros}</Td>
                      </>
                    )}
                    <Td>{`R$ ${resultado.premio.toFixed(2)}`}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Box mt={4}>
              <Text>Nenhum resultado registrado para este jogo.</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ResultadosManagement;
