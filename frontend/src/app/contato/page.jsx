'use client';

import { useEffect, useState } from 'react';
import { Box, Center, VStack, Spinner, Text } from '@chakra-ui/react';
import Header from '../components/HeaderSection';
import Footer from '../components/Footer';
import Contact from '../components/Contact';
import axios from 'axios';
import Maintenance from '../components/Maintenance';
import Inactive from '../components/Inactive';

export default function ContactPage() {
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        <Contact />
      </Box>
      <Footer />
    </Box>
  );
}