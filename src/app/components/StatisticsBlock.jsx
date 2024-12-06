'use client'

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Icon, useBreakpointValue, Container } from '@chakra-ui/react';
import { MdPerson, MdAssignment, MdPersonOutline } from 'react-icons/md';

// Mapeando strings de ícones para os ícones reais importados
const iconMap = {
  MdPerson: MdPerson,
  MdAssignment: MdAssignment,
  MdPersonOutline: MdPersonOutline
};

export default function StatisticsBlock() {
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const iconSize = useBreakpointValue({ base: "40px", md: "50px" });
  const numberSize = useBreakpointValue({ base: "2xl", md: "3xl" });
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" });

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
          if (data.statistics && data.statistics.sections) {
            setSections(data.statistics.sections);
            setTitle(data.statistics.title || '');
          } else {
            console.warn('Nenhum dado encontrado para Nossos Números.');
          }
        } else {
          console.error('Falha ao buscar dados de estatísticas:', await res.text());
        }
      } catch (error) {
        console.error('Erro ao buscar dados de estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Container maxW={containerMaxWidth} py={8} px={4} textAlign="center">
        Carregando dados...
      </Container>
    );
  }

  if (sections.length === 0) {
    return (
      <Container maxW={containerMaxWidth} py={8} px={4} textAlign="center">
        Nenhuma estatística cadastrada.
      </Container>
    );
  }

  return (
    <Container maxW={containerMaxWidth} py={8} px={4}>
      {/* Renderizando o título obtido do BD */}
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
        align="center"
        w="100%"
        direction={{ base: "column", md: "row" }}
        gap={{ base: 6, md: 8 }}
        textAlign="center"
      >
        {sections.map((stat, index) => {
          const SelectedIcon = iconMap[stat.icon] || MdPersonOutline; // Caso não encontre o ícone, usa um default
          return (
            <Box
              key={index}
              textAlign="center"
              flex="1"
              minW="200px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              gap={4}
              mb={{ base: 6, md: 0 }}
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
                <Icon as={SelectedIcon} color="white" boxSize="24px" />
              </Box>
              <Box>
                <Text
                  fontSize={numberSize}
                  fontFamily="Nunito Sans, sans-serif"
                  fontWeight="bold"
                  color="green.800"
                >
                  {stat.title}
                </Text>
                <Text
                  fontSize="md"
                  fontFamily="Nunito Sans, sans-serif"
                  color="green.600"
                >
                  {stat.subtitle}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Flex>
    </Container>
  );
}
