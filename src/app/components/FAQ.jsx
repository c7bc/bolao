'use client'
import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Icon, Container } from '@chakra-ui/react';
import { FaQuestionCircle, FaRegCheckCircle } from 'react-icons/fa';

// Mapeamento de ícones disponíveis
const iconMap = {
  FaQuestionCircle: FaQuestionCircle,
  FaRegCheckCircle: FaRegCheckCircle
  // Adicione mais ícones aqui caso necessário
};

const FAQ = () => {
  const [faq, setFaq] = useState(null);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const res = await fetch('/api/save', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.faq) {
            setFaq(data.faq);
          } else {
            console.warn('Nenhum dado de FAQ encontrado.');
          }
        } else {
        }
      } catch (error) {
      }
    };

    fetchFAQ();
  }, []);

  if (!faq) {
    return (
      <Container maxW="4xl" py={8}>
        <Text>Carregando Perguntas Frequentes...</Text>
      </Container>
    );
  }

  const { title, items } = faq;

  return (
    <Container maxW="4xl" py={8}>
      {title && (
        <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
          {title}
        </Heading>
      )}

      <Box p={4} bg="white" boxShadow="xl" borderRadius="md">
        <Accordion allowMultiple>
          {items && items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || FaQuestionCircle;

            return (
              <AccordionItem key={index} borderBottom="1px solid #e2e8f0">
                <h2>
                  <AccordionButton _expanded={{ bg: "green.500", color: "white" }} p={4}>
                    <Box flex="1" textAlign="left" fontSize="lg" fontWeight="bold" display="flex" alignItems="center">
                      <Icon as={IconComponent} color="green.500" boxSize={5} mr={3} />
                      {item.question}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text fontSize="md" color="green.700" whiteSpace="pre-wrap">
                    {item.answer}
                  </Text>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Box>
    </Container>
  );
};

export default FAQ;
