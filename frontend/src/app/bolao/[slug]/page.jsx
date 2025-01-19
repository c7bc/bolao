// frontend/src/app/bolao/[slug]/page.jsx
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
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = verifyToken(token);
          setIsAuthenticated(!!decoded);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
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

          const custosAdministrativos =
            totalArrecadado * (jogo.premiation.fixedPremiation.custosAdministrativos / 100);
          premioEstimado = totalArrecadado - custosAdministrativos;
        }

        const availableNumbers = [];
        for (let i = parseInt(jogo.numeroInicial); i <= parseInt(jogo.numeroFinal); i++) {
          availableNumbers.push(i);
        }

        const mappedPool = {
          jog_id: jogo.jog_id,
          slug: slug,
          title: jogo.jog_nome,
          description: jogo.descricao,
          entryValue: parseFloat(jogo.jog_valorBilhete).toFixed(2),
          prizeValue: premioEstimado,
          status: jogo.jog_status,
          startTime: new Date(jogo.data_inicio),
          endTime: new Date(jogo.data_fim),
          participants: jogo.participantes || 0,
          acceptedPayments: ['Mercado Pago'],
          numeroInicial: parseInt(jogo.numeroInicial),
          numeroFinal: parseInt(jogo.numeroFinal),
          availableNumbers: availableNumbers,
          numeroPalpites: parseInt(jogo.numeroPalpites),
          pontosPorAcerto: parseInt(jogo.pontosPorAcerto),
          isAuthenticated,
        };

        setPool(mappedPool);
      } catch (err) {
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
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <HeaderSection />
        <Flex flex="1" justify="center" align="center">
          <Spinner size="xl" color="green.500" />
        </Flex>
        <Footer />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <HeaderSection />
        <Box flex="1">
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
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <HeaderSection />
      <Box flex="1" p={8}>
        <Container maxW="container.xl">
          <PoolDetailsCard
            pool={pool}
            onLogin={() => router.push('/login')}
            onRegister={() => router.push('/cadastro')}
          />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default PoolDetails;
