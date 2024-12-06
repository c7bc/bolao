'use client'
import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, Button, Stack, Icon, Flex, Link, Divider, useBreakpointValue, Container
} from '@chakra-ui/react';
import { FaWhatsapp, FaInstagram, FaTelegram } from 'react-icons/fa';

// Mapa de ícones disponíveis
const iconMap = {
  FaWhatsapp: FaWhatsapp,
  FaInstagram: FaInstagram,
  FaTelegram: FaTelegram
  // Adicione mais se necessário
};

const Contact = () => {
  const [contactData, setContactData] = useState(null);
  const buttonSize = useBreakpointValue({ base: "md", md: "lg" });

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch('/api/save', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.contact) {
            setContactData(data.contact);
          } else {
            console.warn('Nenhum dado de contato encontrado.');
          }
        } else {
          console.error('Falha ao buscar dados de contato:', await res.text());
        }
      } catch (error) {
        console.error('Erro ao buscar dados de contato:', error);
      }
    };

    fetchContact();
  }, []);

  if (!contactData) {
    return (
      <Container maxW="4xl" py={8}>
        <Text>Carregando informações de Contato...</Text>
      </Container>
    );
  }

  const {
    title,
    whatsappTitle,
    whatsappDescription,
    whatsappLinks,
    officialChannelsTitle,
    officialChannels,
    customerServiceNotice,
    customerServicePhone
  } = contactData;

  return (
    <Container maxW="4xl" py={8}>
      <Box p={6} bg="white" boxShadow="xl" borderRadius="md" mb={8}>
        {title && (
          <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
            {title}
          </Heading>
        )}

        <Stack spacing={6} direction="column" align="center">
          {/* WhatsApp Section */}
          {whatsappTitle && (
            <Box w="full" textAlign="center">
              <Text fontSize="lg" color="green.700" mb={4}>
                {whatsappTitle}
              </Text>
              {whatsappDescription && (
                <Text fontSize="md" color="green.700" mb={4}>
                  {whatsappDescription}
                </Text>
              )}

              {whatsappLinks && whatsappLinks.map((wa, index) => {
                const IconComponent = FaWhatsapp;
                return (
                  <React.Fragment key={index}>
                    <Button
                      as="a"
                      href={wa.url}
                      target="_blank"
                      leftIcon={<Icon as={IconComponent} color="white" boxSize={6} />}
                      colorScheme="green"
                      size={buttonSize}
                      w="full"
                      mb={index < whatsappLinks.length - 1 ? 4 : 0}
                    >
                      {wa.label}
                    </Button>
                  </React.Fragment>
                );
              })}
            </Box>
          )}

          {whatsappLinks && whatsappLinks.length > 0 && (
            <Divider orientation="horizontal" borderColor="green.200" w="full" />
          )}

          {/* Canais Oficiais */}
          {officialChannelsTitle && (
            <Box w="full" textAlign="center">
              <Text fontSize="lg" color="green.700" mb={4}>
                {officialChannelsTitle}
              </Text>

              {officialChannels && officialChannels.length > 0 && (
                <Flex justify="center" gap={6} flexWrap="wrap">
                  {officialChannels.map((chan, index) => {
                    const IconComponent = iconMap[chan.icon] || FaInstagram; // Ícone padrão caso não encontre
                    return (
                      <Link key={index} href={chan.url} isExternal>
                        <Button
                          leftIcon={<Icon as={IconComponent} color="white" boxSize={6} />}
                          colorScheme="green"
                          size={buttonSize}
                          variant="solid"
                          mb={4}
                        >
                          {chan.label}
                        </Button>
                      </Link>
                    );
                  })}
                </Flex>
              )}
            </Box>
          )}

          {officialChannels && officialChannels.length > 0 && (
            <Divider orientation="horizontal" borderColor="green.200" w="full" />
          )}

          {/* Atendimento ao Cliente */}
          {(customerServiceNotice || customerServicePhone) && (
            <Box w="full" textAlign="center">
              {customerServiceNotice && (
                <Text fontSize="lg" color="green.700" mb={4}>
                  {customerServiceNotice}
                </Text>
              )}
              {customerServicePhone && (
                <Text fontSize="xl" color="green.800" fontWeight="bold">
                  {customerServicePhone}
                </Text>
              )}
            </Box>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default Contact;
