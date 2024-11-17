'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  Button,
  Container,
  Heading,
  IconButton,
  useBreakpointValue
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

const slides = [
  {
    title: "Mega da Virada 2024",
    subtitle: "Prêmio estimado em R$ 550 milhões",
    description: "Faça parte do maior prêmio do ano. Organize seu bolão agora!",
    bgColor: "green.400",  // Verde claro
    textColor: "white",
    ctaText: "Participar Agora",
  },
  {
    title: "Bolão Premiado",
    subtitle: "Aumente suas chances de ganhar",
    description: "Junte-se a outros jogadores e multiplique suas possibilidades de sucesso",
    bgColor: "green.400",  // Outro tom de verde
    textColor: "white",
    ctaText: "Criar Bolão",
  },
  {
    title: "Resultados Anteriores",
    subtitle: "Confira os últimos ganhadores",
    description: "Veja os números sorteados e os prêmios distribuídos nos últimos concursos",
    bgColor: "green.400",  // Verde mais intenso
    textColor: "white",
    ctaText: "Ver Resultados",
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const arrowSize = useBreakpointValue({ base: "md", md: "lg" })
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" })
  const headingSize = useBreakpointValue({ base: "xl", md: "3xl" })
  const textSize = useBreakpointValue({ base: "lg", md: "xl" })
  const arrowMarginTop = useBreakpointValue({ base: "auto", md: "0" }) // Mais para baixo em telas pequenas
  const arrowTopPosition = useBreakpointValue({ base: "73%", md: "50%" }) // Ajusta o top para 73% no mobile/tablet

  // Usar useCallback para evitar redefinir a função em cada renderização
  const nextSlide = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true)
      setCurrentSlide((prev) => (prev + 1) % slides.length)
      setTimeout(() => setIsAnimating(false), 500)
    }
  }, [isAnimating])

  const prevSlide = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true)
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      setTimeout(() => setIsAnimating(false), 500)
    }
  }, [isAnimating])

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(timer)
  }, [nextSlide]) // Agora nextSlide é uma dependência do useEffect

  return (
    <Box position="relative" h={{ base: "400px", md: "500px" }} overflow="hidden">
      {slides.map((slide, index) => (
        <Box
          key={index}
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg={slide.bgColor}
          opacity={currentSlide === index ? 1 : 0}
          transition="opacity 0.5s ease-in-out"
          zIndex={currentSlide === index ? 1 : 0}
        >
          <Container maxW={containerMaxWidth} h="100%">
            <Flex
              direction="column"
              justify="center"
              align="center"
              h="100%"
              color={slide.textColor}
              textAlign="center"
              position="relative"
              zIndex={2}
            >
              <Heading
                as="h2"
                size={headingSize}
                fontFamily="Poppins, sans-serif"
                fontWeight="700"
                mb={4}
                opacity={currentSlide === index ? 1 : 0}
                transform={`translateY(${currentSlide === index ? 0 : '20px'})`}
                transition="all 0.6s ease-out"
              >
                {slide.title}
              </Heading>
              
              <Text
                fontSize={textSize}
                fontFamily="Poppins, sans-serif"
                fontWeight="500"
                mb={4}
                opacity={currentSlide === index ? 1 : 0}
                transform={`translateY(${currentSlide === index ? 0 : '20px'})`}
                transition="all 0.6s ease-out 0.1s"
              >
                {slide.subtitle}
              </Text>
              
              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontFamily="Poppins, sans-serif"
                mb={8}
                maxW="600px"
                opacity={currentSlide === index ? 1 : 0}
                transform={`translateY(${currentSlide === index ? 0 : '20px'})`}
                transition="all 0.6s ease-out 0.2s"
              >
                {slide.description}
              </Text>
              
              <Button
                size="lg"
                bg="white"
                color={slide.bgColor}
                _hover={{
                  bg: "gray.100",
                }}
                fontFamily="Poppins, sans-serif"
                fontWeight="500"
                px={8}
                opacity={currentSlide === index ? 1 : 0}
                transform={`translateY(${currentSlide === index ? 0 : '20px'})`}
                transition="all 0.6s ease-out 0.3s"
              >
                {slide.ctaText}
              </Button>
            </Flex>
          </Container>
          
          {/* Gradient overlay */}
          <Box
            position="absolute"
            top="0"
            left="0"
            w="100%"
            h="100%"
            bg="linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0))"
            zIndex={1}
          />
        </Box>
      ))}

      {/* Navigation Arrows */}
      <Flex 
        justify="space-between" 
        position="absolute" 
        top={arrowTopPosition} 
        transform="translateY(-50%)" 
        w="100%" 
        px={4} 
        zIndex={2}
        mt={arrowMarginTop} // Movendo as setas para baixo em telas pequenas
      >
        <IconButton
          aria-label="Previous slide"
          icon={<ChevronLeftIcon />}
          onClick={prevSlide}
          size={arrowSize}
          rounded="full"
          bg="whiteAlpha.800"
          _hover={{ bg: "white" }}
          ml={{ base: 2, md: 8 }}
        />
        <IconButton
          aria-label="Next slide"
          icon={<ChevronRightIcon />}
          onClick={nextSlide}
          size={arrowSize}
          rounded="full"
          bg="whiteAlpha.800"
          _hover={{ bg: "white" }}
          mr={{ base: 2, md: 8 }}
        />
      </Flex>

      {/* Slide Indicators */}
      <Flex 
        position="absolute" 
        bottom="6"
        left="50%" 
        transform="translateX(-50%)"
        zIndex={2}
        gap={2}
      >
        {slides.map((_, index) => (
          <Box
            key={index}
            w="2"
            h="2"
            rounded="full"
            bg={currentSlide === index ? "white" : "whiteAlpha.600"}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </Flex>
    </Box>
  )
}
