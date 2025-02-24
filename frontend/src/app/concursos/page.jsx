'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Center, VStack, Spinner, Text } from '@chakra-ui/react';
import Header from '../components/HeaderSection';
import Footer from '../components/Footer';
import ConcursosBlock from '../components/ConcursosBlock';
import Maintenance from '../components/Maintenance';
import Inactive from '../components/Inactive';

export default function Concursos() {
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateGameStatus = async () => {
      try {
        const response = await axios.post('/api/jogos/update-all', {});
        if (response.status !== 200) {
          console.error('Failed to update game status');
        } else {
          console.log('Status dos jogos atualizado com sucesso:', response.data);
        }
      } catch (error) {
        console.error('Error updating game status:', error);
      }
    };

    const fetchActives = async () => {
      try {
        const response = await axios.get('/api/save');
        console.log("Response from /api/save:", response);
        if (response.data && response.data.actives && response.data.actives.pages) {
          const pathname = window.location.pathname;
          const pageStatus = response.data.actives.pages[pathname] || 'active';
          console.log(`Status for ${pathname}:`, pageStatus);
          setStatus(pageStatus);
        } else {
          console.log("Actives data not found, defaulting to active");
        }
      } catch (error) {
        console.error('Error fetching actives:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updateGameStatus();
    fetchActives();
  }, []);

  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="green.500"
            size="xl"
          />
          <Text fontSize="xl">Carregando...</Text>
        </VStack>
      </Center>
    );
  }

  if (status === 'inactive') {
    return <Inactive />;
  }

  if (status === 'maintenance') {
    return <Maintenance />;
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box flex="1">
        <ConcursosBlock />
      </Box>
      <Footer />
    </Box>
  );
}