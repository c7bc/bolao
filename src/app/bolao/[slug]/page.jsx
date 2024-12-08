// src/app/bolao/[slug]/page.jsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Box, Text, Flex, Spinner } from '@chakra-ui/react';
import PoolDetailsCard from '../../components/PoolDetailsCard';
import HeaderSection from '../../components/HeaderSection';
import Footer from '../../components/Footer';

// Function to fetch pool data via API using slug
const fetchPoolData = async (slug) => {
  const res = await fetch(`/api/jogos/${slug}`);
  if (!res.ok) {
    throw new Error('Failed to fetch pool data');
  }
  const data = await res.json();
  return data.jogo; // Returns the 'jogo' object
};

export default function PoolDetails() {
  const { slug } = useParams();

  const [pool, setPool] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (slug) {
      fetchPoolData(slug)
        .then((data) => {
          // Map API data to props expected by PoolDetailsCard
          const mappedPool = {
            title: data.jog_nome || 'Título Indefinido',
            entryValue: data.jog_valorjogo || 'N/A',
            prizeValue: data.jog_prizevalue || 'N/A',
            requiredPoints: data.jog_pontos_necessarios || 'N/A',
            status: data.jog_status || 'unknown',
            startTime: data.jog_data_inicio || null,
            participants: data.jog_participantes || 0,
            acceptedPayments: data.jog_pagamentos || [],
          };
          setPool(mappedPool);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Bolão não encontrado.');
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="green.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Text fontSize="2xl" color="red.500">
          {error}
        </Text>
      </Flex>
    );
  }

  return (
    <>
      <HeaderSection />
      <Box p={8}>
        <PoolDetailsCard pool={pool} />
      </Box>
      <Footer />
    </>
  );
}
