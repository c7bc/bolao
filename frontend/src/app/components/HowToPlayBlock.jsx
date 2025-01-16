'use client'
import { useState, useEffect } from 'react'
import { Box, Flex, Text, Icon, Button, useBreakpointValue, Container } from '@chakra-ui/react'
import { MdInfo } from 'react-icons/md'

export default function HowToPlayBlock() {
  const [howToPlay, setHowToPlay] = useState(null);
  const iconSize = useBreakpointValue({ base: "40px", md: "50px" })
  const numberSize = useBreakpointValue({ base: "2xl", md: "3xl" })
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/save', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.howToPlay) {
            setHowToPlay(data.howToPlay);
          } else {
            console.warn('Nenhuma informação encontrada para "Como Jogar".');
          }
        } else {
        }
      } catch (error) {
      }
    };

    fetchData();
  }, []);

  if (!howToPlay) {
    return (
      <Container maxW={containerMaxWidth} py={8} px={4}>
        <Text>Carregando informações de &quot;Como Jogar&quot;...</Text>
      </Container>
    );
  }

  const { title, cards = [], buttonText, buttonLink } = howToPlay;

  return (
    <Container maxW={containerMaxWidth} py={8} px={4}>
      {title && (
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          color="green.800"
          mb={6}
          textAlign="center"
          fontFamily="Poppins, sans-serif"
        >
          {title}
        </Text>
      )}

      <Flex
        justify="space-between"
        align="stretch"
        w="100%"
        direction={{ base: "column", md: "row" }}
        gap={6}
        textAlign="center"
      >
        {cards.map((card, index) => (
          <Box
            key={index}
            textAlign="center"
            flex="1"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-between"
            gap={4}
            bg="green.100"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            height="auto"
          >
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="green.800"
              fontFamily="Nunito Sans, sans-serif"
            >
              {card.title}
            </Text>

            <Box
              as="div"
              fontSize="md"
              color="green.600"
              fontFamily="Nunito Sans, sans-serif"
              textAlign="center"
              flex="1"
              display="flex"
              flexDirection="column"
              justifyContent="flex-start"
              dangerouslySetInnerHTML={{
                __html: (card.subtitle || '')
                  .replace(/<strong>/g, '<strong style="color: #2F6B33;">')
                  .replace(/<\/strong>/g, '</strong>')
              }}
            />
          </Box>
        ))}
      </Flex>

      {buttonText && (
        <Flex justify="center" mt={8}>
          <Button
            as="a"
            href={buttonLink || '#'}
            leftIcon={<Icon as={MdInfo} />}
            colorScheme="green"
            variant="solid"
            fontFamily="Nunito Sans, sans-serif"
          >
            {buttonText}
          </Button>
        </Flex>
      )}
    </Container>
  )
}
