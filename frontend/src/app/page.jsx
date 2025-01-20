'use client';

import { useEffect } from 'react'; // Don't forget to import useEffect
import Header from './components/HeaderSection';
import HeroSection from './components/HeroSection';
import StatisticsBlock from './components/StatisticsBlock';
import HowToPlayBlock from './components/HowToPlayBlock';
import AboutUsBlock from './components/AboutUsBlock';
import Footer from './components/Footer';
import axios from 'axios'; // Ensure axios is imported

export default function Home() {
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
