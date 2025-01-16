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

export default function HeroSection() {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Carrega os dados da API ao montar o componente
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/save', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Aqui assumimos que o objeto retornado possui `hero.slides`
          if (data.hero && data.hero.slides) {
            setSlides(data.hero.slides);
          } else {
            console.warn('Nenhum slide encontrado na resposta da API.');
          }
        } else {
        }
      } catch (error) {
      }
    }

    fetchData();
  }, []);

  const arrowSize = useBreakpointValue({ base: "md", md: "lg" });
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" });
  const headingSize = useBreakpointValue({ base: "xl", md: "3xl" });
  const textSize = useBreakpointValue({ base: "lg", md: "xl" });
  const arrowMarginTop = useBreakpointValue({ base: "auto", md: "0" });
  const arrowTopPosition = useBreakpointValue({ base: "73%", md: "50%" });

  const nextSlide = useCallback(() => {
    if (!isAnimating && slides.length > 0) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isAnimating, slides]);

  const prevSlide = useCallback(() => {
    if (!isAnimating && slides.length > 0) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isAnimating, slides]);

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        nextSlide();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [nextSlide, slides]);

  // Caso não tenha slides ainda carregados, podemos exibir um loader ou um fallback
  if (slides.length === 0) {
    return (
      <Box h={{ base: "400px", md: "500px" }} display="flex" alignItems="center" justifyContent="center">
        Carregando Hero...
      </Box>
    );
  }

  return (
    <Box position="relative" h={{ base: "400px", md: "500px" }} overflow="hidden">
      {slides.map((slide, index) => {
        const {
          image, showTitle, title, showSubtitle, subtitle, showCta, ctaText, ctaLink
        } = slide;

        // Caso não tenha cor de fundo definida, poderíamos colocar uma default.
        // Porém, suponhamos que a API possa fornecer configurações no futuro.
        // Por hora, definiremos um default:
        const bgColor = '#48BB78'; 
        const textColor = '#FFFFFF';

        return (
          <Box
            key={index}
            position="absolute"
            top="0"
            left="0"
            w="100%"
            h="100%"
            bg={bgColor}
            backgroundImage={image ? `url(${image})` : 'none'}
            backgroundSize="cover"
            backgroundPosition="center"
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
                color={textColor}
                textAlign="center"
                position="relative"
                zIndex={2}
                bg="rgba(0,0,0,0.4)" // overlay para melhor legibilidade do texto
                p={4}
              >
                {showTitle && (
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
                    {title}
                  </Heading>
                )}

                {showSubtitle && (
                  <Text
                    fontSize={textSize}
                    fontFamily="Poppins, sans-serif"
                    fontWeight="500"
                    mb={4}
                    opacity={currentSlide === index ? 1 : 0}
                    transform={`translateY(${currentSlide === index ? 0 : '20px'})`}
                    transition="all 0.6s ease-out 0.1s"
                  >
                    {subtitle}
                  </Text>
                )}

                {/* Caso queira adicionar uma descrição ou outro texto do slide, basta incluir no objeto e renderizar aqui */}
                
                {showCta && (
                  <Button
                    as="a"
                    href={ctaLink || '#'}
                    size="lg"
                    bg="white"
                    color={bgColor}
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
                    {ctaText || 'Saiba Mais'}
                  </Button>
                )}
              </Flex>
            </Container>
            
            {/* Gradient overlay se necessário */}
            {/* <Box
              position="absolute"
              top="0"
              left="0"
              w="100%"
              h="100%"
              bg="linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0))"
              zIndex={1}
            /> */}
          </Box>
        );
      })}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <Flex
          justify="space-between"
          position="absolute"
          top={arrowTopPosition}
          transform="translateY(-50%)"
          w="100%"
          px={4}
          zIndex={2}
          mt={arrowMarginTop}
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
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
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
      )}
    </Box>
  );
}
