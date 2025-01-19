// frontend/src/app/perguntas-frequentes/page.jsx
'use client'
import { Box } from '@chakra-ui/react'
import Header from '../components/HeaderSection'
import Footer from '../components/Footer'
import FAQ from '../components/FAQ'

export default function Home() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box flex="1">
        <FAQ />
      </Box>
      <Footer />
    </Box>
  )
}