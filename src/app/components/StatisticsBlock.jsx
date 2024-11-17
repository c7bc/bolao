'use client'
import { Box, Flex, Text, Icon, useBreakpointValue, Container } from '@chakra-ui/react'
import { MdPerson, MdAssignment, MdPersonOutline } from 'react-icons/md'

const stats = [
  {
    icon: MdPerson,
    number: "+100 mil",
    label: "Prêmios toda semana"
  },
  {
    icon: MdAssignment,
    number: "+26 mil",
    label: "Ganhadores"
  },
  {
    icon: MdPersonOutline,
    number: "+11 milhões",
    label: "em Prêmios Pagos!"
  },
  {
    icon: MdPersonOutline,
    number: "+10 mil",
    label: "Bolões realizados"
  }
]

// Título armazenado em um array
const titleArray = ["Nossos Números"];

export default function StatisticsBlock() {
  const iconSize = useBreakpointValue({ base: "40px", md: "50px" })
  const numberSize = useBreakpointValue({ base: "2xl", md: "3xl" })
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" })

  return (
    <Container maxW={containerMaxWidth} py={8} px={4}>
      {/* Renderizando o título a partir do array */}
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="bold"
        color="green.800"
        mb={6}
        textAlign="center"
        fontFamily="Poppins, sans-serif"
      >
        {titleArray}
      </Text>

      <Flex
        justify="space-between"
        align="center"
        w="100%"
        direction={{ base: "column", md: "row" }}
        gap="auto"  // Ajusta o espaçamento automaticamente entre os itens
        textAlign="center"
      >
        {stats.map((stat, index) => (
          <Box
            key={index}
            textAlign="center"
            flex="1"  // Faz cada item ocupar uma largura proporcional
            minW="200px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={4}
          >
            <Box
              bg="green.400"
              borderRadius="lg"
              p={10}
              boxSize={iconSize}
              display="flex"
              justifyContent="center"
              alignItems="center"
              opacity={0.8}
            >
              <Icon as={stat.icon} color="white" boxSize="24px" />
            </Box>
            <Box>
              <Text
                fontSize={numberSize}
                fontFamily="Nunito Sans, sans-serif"
                fontWeight="bold"
                color="green.800"
              >
                {stat.number}
              </Text>
              <Text
                fontSize="md"
                fontFamily="Nunito Sans, sans-serif"
                color="green.600"
              >
                {stat.label}
              </Text>
            </Box>
          </Box>
        ))}
      </Flex>
    </Container>
  )
}
