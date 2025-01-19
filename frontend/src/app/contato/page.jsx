// frontend/src/app/contato/page.jsx
'use client'
import { Box } from '@chakra-ui/react'
import Header from '../components/HeaderSection'
import Footer from '../components/Footer'
import Contact from '../components/Contact'

export default function Home() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box flex="1">
        <Contact />
      </Box>
      <Footer />
    </Box>
  )
}