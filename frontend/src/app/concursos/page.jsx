'use client'; // Ensure this is at the very top of the file

import { useEffect } from 'react'; // Import useEffect
import axios from 'axios'; // Import axios
import { Box } from '@chakra-ui/react';
import Header from '../components/HeaderSection';
import Footer from '../components/Footer';
import ConcursosBlock from '../components/ConcursosBlock';

export default function Concursos() {
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

    updateGameStatus();
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
    >
      <Header />
      <Box flex="1">
        <ConcursosBlock />
      </Box>
      <Footer />
    </Box>
  );
}
