'use client'
import Header from './components/HeaderSection'
import HeroSection from './components/HeroSection'
import StatisticsBlock from './components/StatisticsBlock'
import HowToPlayBlock from './components/HowToPlayBlock'
import AboutUsBlock from './components/AboutUsBlock';
import Footer from './components/Footer'

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

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <StatisticsBlock />
      <HowToPlayBlock />
      <AboutUsBlock />
      <Footer />
    </>
  )
}
