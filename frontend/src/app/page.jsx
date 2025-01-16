'use client'
import Header from './components/HeaderSection'
import HeroSection from './components/HeroSection'
import StatisticsBlock from './components/StatisticsBlock'
import HowToPlayBlock from './components/HowToPlayBlock'
import AboutUsBlock from './components/AboutUsBlock';
import Footer from './components/Footer'

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
