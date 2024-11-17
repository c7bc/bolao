'use client'
import { Box, Flex, Text, Icon, Button, useBreakpointValue, Container } from '@chakra-ui/react'
import { MdInfo } from 'react-icons/md'

// Array de etapas para como jogar
const howToPlaySteps = [
  {
    title: "Compre seu bilhete",
    paragraph: "É fácil! Compre seu bilhete no ponto de venda mais próximo de você, ou diretamente com o vendedor da sua preferência."
  },
  {
    title: "Escolha 10 Dezenas",
    paragraph: "Escolha 10 Dezenas quaisquer entre as Dezenas de 00 até a dezena 99. O Bolão inicia na Quarta-Feira. Resultados Quarta: Federal e 21h BA. Continua na Quinta as 10h BA, depois 12h BA… As Dezenas do 1º ao 5º Premio, Frente e Fundo. <strong>São Sorteadas 10 Dezenas em cada Resultado.</strong>"
  },
  {
    title: "Agora só cruzar os dedos!",
    paragraph: "Você só começa a marcar o seu Bolão a partir da Quarta-Feira no Resultado da FEDERAL. A Cada Dezena que você acerta, ela vai somando. O Bolão só acaba quando houver um ganhador que acertar as 10 dezenas. Uma boa sorte!"
  }
]

// Array com título principal e texto do botão
const headerText = [
  { title: "Como jogar no Bolão do" },
  { buttonText: "CLIQUE E VEJA O REGULAMENTO" }
]

export default function HowToPlayBlock() {
  const iconSize = useBreakpointValue({ base: "40px", md: "50px" })
  const numberSize = useBreakpointValue({ base: "2xl", md: "3xl" })
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" })

  return (
    <Container maxW={containerMaxWidth} py={8} px={4}>
      {/* Título "Como jogar no Bolão do..." */}
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="bold"
        color="green.800"
        mb={6}
        textAlign="center"
        fontFamily="Poppins, sans-serif"
      >
        {headerText[0].title}
      </Text>

      <Flex
        justify="space-between"
        align="stretch"  // Isso vai garantir que os cards fiquem com altura igual
        w="100%"
        direction={{ base: "column", md: "row" }}
        gap={6}  // Ajustando o espaçamento entre as caixas
        textAlign="center"
      >
        {howToPlaySteps.map((step, index) => (
          <Box
            key={index}
            textAlign="center"
            flex="1"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-between"  // Ajusta o conteúdo para se alinhar
            gap={4}
            bg="green.100"  // Fundo claro para as caixas
            borderRadius="lg"
            boxShadow="md"
            p={6}
            height="auto"  // Garantindo que a altura se ajusta automaticamente
          >
            {/* Título do passo */}
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="green.800"
              fontFamily="Nunito Sans, sans-serif"
            >
              {step.title}
            </Text>
            {/* Parágrafo do passo */}
            <Box
              as="div"
              fontSize="md"
              color="green.600"
              fontFamily="Nunito Sans, sans-serif"
              textAlign="center"
              flex="1"  // Garante que o parágrafo ocupe o espaço disponível
              display="flex"
              flexDirection="column"
              justifyContent="flex-start"
              dangerouslySetInnerHTML={{
                __html: step.paragraph.replace(/<strong>/g, '<strong style="color: #2F6B33;">').replace(/<\/strong>/g, '</strong>') // Tornando o texto em strong verde escuro
              }}
            />
          </Box>
        ))}
      </Flex>

      {/* Botão com ícone */}
      <Flex justify="center" mt={8}>
        <Button
          leftIcon={<Icon as={MdInfo} />}
          colorScheme="green"
          variant="solid"
          fontFamily="Nunito Sans, sans-serif"
        >
          {headerText[1].buttonText}
        </Button>
      </Flex>
    </Container>
  )
}
