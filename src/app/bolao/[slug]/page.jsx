'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Box, Text } from '@chakra-ui/react';  // Importando Box e Text
import PoolDetailsCard from '../../components/PoolDetailsCard';  // Importando o novo componente de renderização
import HeaderSection from '../../components/HeaderSection';
import Footer from '../../components/Footer';

// Dados fictícios dos bolões
export const poolsData = [
  {
    slug: 'bolao-de-segunda',
    title: "Bolão de Segunda",
    entryValue: "R$ 10,00",
    prizeValue: "R$ 50.000,00",
    startTime: "2024-11-18T15:00:00",
    requiredPoints: "10 pontos",
    status: "open",
    totalPrizes: 3,
    participants: 245,
    acceptedPayments: ['Cartão de Crédito', 'Pix', 'Boleto']
  },
  {
    slug: 'bolao-da-sorte',
    title: "Bolão da Sorte",
    entryValue: "R$ 5,00",
    prizeValue: "R$ 25.000,00",
    startTime: "2024-11-19T14:00:00",
    requiredPoints: "8 pontos",
    status: "upcoming",
    totalPrizes: 5,
    participants: 180,
    acceptedPayments: ['Pix', 'Boleto']
  },
  {
    slug: 'super-bolao',
    title: "Super Bolão",
    entryValue: "R$ 15,00",
    prizeValue: "R$ 75.000,00",
    startTime: "2024-11-19T14:00:00",
    requiredPoints: "12 pontos",
    status: "upcoming",
    totalPrizes: 5,
    participants: 12000,
    acceptedPayments: ['Pix', 'Boleto']
  }
  // Adicione mais bolões conforme necessário
];

export default function PoolDetails() {
  // Acessando o parâmetro da URL (slug) usando useParams
  const { slug } = useParams();

  // Buscando os dados do bolão com base no slug
  const pool = poolsData.find(pool => pool.slug === slug);

  if (!pool) {
    return (
      <Box p={4}>
        <Text>Bolão não encontrado.</Text>
      </Box>
    );
  }

  return (
    <>
      <HeaderSection />
      <PoolDetailsCard pool={pool} />
      <Footer />
    </>
  );
}
