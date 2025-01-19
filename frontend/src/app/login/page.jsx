// frontend/src/app/login/page.jsx
'use client'
import { Box } from '@chakra-ui/react'
import Header from '../components/HeaderSection'
import Footer from '../components/Footer'
import SignIn from '../components/SignIn'

export default function Home() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box flex="1">
        <SignIn />
      </Box>
      <Footer />
    </Box>
  )
}