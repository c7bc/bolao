import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Stack,
  Button,
  useBreakpointValue,
  Checkbox,
  CheckboxGroup,
  Grid,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import axios from 'axios';

const GameParticipation = () => {
  const router = useRouter();
  const { jog_id } = router.query;

  const [jogo, setJogo] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const fetchJogo = async () => {
      try {
        const response = await axios.get(`/api/jogos/${jog_id}`);
        setJogo(response.data.jogo);
      } catch (error) {
        console.error('Error fetching jogo:', error);
        alert('Erro ao carregar jogo.');
      } finally {
        setLoading(false);
      }
    };

    if (jog_id) {
      fetchJogo();
    }
  }, [jog_id]);

  const handleNumberSelect = (number) => {
    setSelectedNumbers((prevNumbers) => {
      if (prevNumbers.includes(number)) {
        return prevNumbers.filter((n) => n !== number);
      } else {
        if (prevNumbers.length < jogo.jog_quantidade_maxima) {
          return [...prevNumbers, number];
        } else {
          alert(
            `Você só pode selecionar até ${jogo.jog_quantidade_maxima} números.`
          );
          return prevNumbers;
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (
      selectedNumbers.length < jogo.jog_quantidade_minima ||
      selectedNumbers.length > jogo.jog_quantidade_maxima
    ) {
      alert(
        `Selecione entre ${jogo.jog_quantidade_minima} e ${jogo.jog_quantidade_maxima} números.`
      );
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/historico-cliente/create',
        {
          htc_transactionid: `txn_${Date.now()}`,
          htc_idjogo: jog_id,
          htc_deposito: jogo.jog_valorjogo,
          htc_cotas: selectedNumbers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        alert('Participação registrada com sucesso!');
        // Redirect to payment or confirmation page
        window.location.href = '/cliente/meus-jogos';
      } else {
        alert('Erro ao registrar participação.');
      }
    } catch (error) {
      console.error('Error submitting participation:', error);
      alert('Erro ao registrar participação.');
    }
  };

  if (loading) {
    return <Text>Carregando jogo...</Text>;
  }

  if (!jogo) {
    return <Text>Jogo não encontrado.</Text>;
  }

  // Generate numbers from 1 to jogo.jog_numeros_totais
  const totalNumbers = Array.from(
    { length: jogo.jog_numeros_totais },
    (_, i) => i + 1
  );

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        {jogo.jog_nome}
      </Heading>
      <Text fontSize="md" mb={4}>
        Selecione entre {jogo.jog_quantidade_minima} e{' '}
        {jogo.jog_quantidade_maxima} números.
      </Text>
      <Grid templateColumns="repeat(10, 1fr)" gap={2}>
        {totalNumbers.map((number) => (
          <Button
            key={number}
            onClick={() => handleNumberSelect(number)}
            colorScheme={selectedNumbers.includes(number) ? 'green' : 'gray'}
            variant={selectedNumbers.includes(number) ? 'solid' : 'outline'}
            size="sm"
          >
            {number}
          </Button>
        ))}
      </Grid>
      <Stack spacing={4} mt={6}>
        <Button
          colorScheme="green"
          size={buttonSize}
          onClick={handleSubmit}
          isDisabled={selectedNumbers.length < jogo.jog_quantidade_minima}
        >
          Confirmar Participação
        </Button>
      </Stack>
    </Box>
  );
};

export default GameParticipation;
