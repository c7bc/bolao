'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Spinner,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import PoolDetailsCard from '../../components/PoolDetailsCard';
import HeaderSection from '../../components/HeaderSection';
import Footer from '../../components/Footer';
import { verifyToken } from '../../utils/auth';

const PoolDetails = () => {
  const { slug } = useParams();
  const router = useRouter();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = verifyToken(token);
        setIsAuthenticated(!!decoded);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jogos/${slug}`);

        if (!response.ok) {
          throw new Error('Falha ao buscar dados do bolão');
        }

        const data = await response.json();
        const jogo = data.jogo;

        // Calcular valor estimado do prêmio se o jogo estiver fechado
        let premioEstimado = null;
        if (jogo.jog_status === 'fechado') {
          const apostasResponse = await fetch(`/api/jogos/apostas?jogo_id=${jogo.jog_id}`);
          if (!apostasResponse.ok) {
            throw new Error('Falha ao buscar apostas do bolão');
          }
          const apostasData = await apostasResponse.json();

          const totalArrecadado = apostasData.apostas.reduce(
            (acc, aposta) => acc + parseFloat(aposta.valor_total),
            0
          );

          // Subtrair custos administrativos e calcular prêmio estimado
          const custosAdministrativos =
            totalArrecadado * (jogo.premiation.fixedPremiation.custosAdministrativos / 100);
          premioEstimado = totalArrecadado - custosAdministrativos;
        }

        // Mapear dados do jogo para o formato esperado pelo PoolDetailsCard
        const mappedPool = {
          jog_id: jogo.jog_id,
          slug: slug, // Adicionado o slug para uso no PoolDetailsCard
          title: jogo.jog_nome,
          description: jogo.descricao,
          entryValue: parseFloat(jogo.jog_valorBilhete).toFixed(2),
          prizeValue: premioEstimado,
          status: jogo.jog_status,
          startTime: new Date(jogo.data_inicio),
          endTime: new Date(jogo.data_fim),
          participants: jogo.participantes || 0,
          acceptedPayments: ['Mercado Pago'],
          numeroInicial: jogo.numeroInicial,
          numeroFinal: jogo.numeroFinal,
          numeroPalpites: jogo.numeroPalpites,
          pontosPorAcerto: jogo.pontosPorAcerto,
          isAuthenticated,
        };

        console.log('Start Time:', mappedPool.startTime, 'End Time:', mappedPool.endTime);

        setPool(mappedPool);
      } catch (err) {
        console.error(err);
        setError('Bolão não encontrado ou erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPoolData();
    }
  }, [slug, isAuthenticated]);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="green.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Erro ao carregar bolão
          </AlertTitle>
          <AlertDescription maxWidth="sm">{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <HeaderSection />
      <Box p={8}>
        <Container maxW="container.xl">
          <PoolDetailsCard
            pool={pool}
            onLogin={() => router.push('/login')}
            onRegister={() => router.push('/cadastro')}
          />
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default PoolDetails;
