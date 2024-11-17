'use client'
import { Box, Text, Container, Flex, Heading } from '@chakra-ui/react'

const aboutUsContent = [
  {
    title: "SOBRE NÓS",
    description: "Nossa empresa está no ramo de jogos de apostas desde o ano de 2019. Somos uma empresa séria e buscamos sempre trazer inovações para mudar o seu jeito de jogar, com isso, ampliamos ainda mais as possibilidades de você ganhar!"
  }
]

export default function AboutUsBlock() {
  return (
    <Container maxW="container.xl" py={{ base: 8, md: 16 }} px={4}>
      {aboutUsContent.map((item, index) => (
        <Box
          key={index}
          textAlign="center"
          mb={12}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color="green.800"
            mb={6}
            fontFamily="Nunito Sans, sans-serif"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {item.title}
          </Heading>
          <Text
            fontSize="lg"
            color="green.600"
            fontFamily="Nunito Sans, sans-serif"
            lineHeight="1.6"
            maxW="700px"
            mx="auto"
            px={{ base: 4, md: 0 }}
          >
            {item.description}
          </Text>
        </Box>
      ))}
    </Container>
  )
}
