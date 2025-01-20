'use client'
import { Box } from '@chakra-ui/react'
import Header from '../components/HeaderSection'
import Footer from '../components/Footer'
import ConcursosBlock from '../components/ConcursosBlock'

useEffect(() => {
  const updateGameStatus = async () => {
    try {
      const response = await axios.post('/api/jogos/update-all', {});

      if (response.status !== 200) {
      } else {
        console.log('Status dos jogos atualizado com sucesso:', response.data);
      }
    } catch (error) {
    }
  };

  updateGameStatus();
}, []);

export default function Concursos() {
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
  )
}