'use client'
import { Box } from '@chakra-ui/react'
import Header from '../components/HeaderSection'
import Footer from '../components/Footer'
import ConcursosBlock from '../components/ConcursosBlock'

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