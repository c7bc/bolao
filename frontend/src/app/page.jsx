'use client';

import { useEffect, useState } from 'react';
import Header from './components/HeaderSection';
import HeroSection from './components/HeroSection';
import StatisticsBlock from './components/StatisticsBlock';
import HowToPlayBlock from './components/HowToPlayBlock';
import AboutUsBlock from './components/AboutUsBlock';
import Footer from './components/Footer';
import axios from 'axios';
import Maintenance from './components/Maintenance';
import Inactive from './components/Inactive';
import { Spinner, Center, VStack, Text } from '@chakra-ui/react'; // Import Chakra UI components

export default function Home() {
  const [status, setStatus] = useState('active'); // Default to 'active'
  const [isLoading, setIsLoading] = useState(true); // Add loading state

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
        console.log("Response from /api/save:", response); // Debugging
        if (response.data && response.data.actives && response.data.actives.pages) {
          // Get the current page's path (pathname)
          const pathname = window.location.pathname;

          // Get the status for the current page, default to 'active' if not found
          const pageStatus = response.data.actives.pages[pathname] || 'active';
          console.log(`Status for ${pathname}:`, pageStatus); // Debugging

          setStatus(pageStatus);
        } else {
          console.log("Actives data not found, defaulting to active");
        }
      } catch (error) {
        console.error('Error fetching actives:', error);
      } finally {
        setIsLoading(false); // Set loading to false after fetch
      }
    };

    updateGameStatus();
    fetchActives();
  }, []);

  if (isLoading) {
    return (
      <Center h="100vh"> {/* Center vertically and horizontally */}
        <VStack spacing={4}> {/* Vertical stack for spinner and text */}
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
    <>
      <Header />
      <HeroSection />
      <StatisticsBlock />
      <HowToPlayBlock />
      <AboutUsBlock />
      <Footer />
    </>
  );
}