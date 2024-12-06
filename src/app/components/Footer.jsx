// src/app/components/Footer.jsx
'use client'
import { useState, useEffect } from 'react'
import { Box, Flex, Text, Link, Icon, Container, useBreakpointValue, Image } from '@chakra-ui/react'
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";

// Dicionário de ícones disponíveis
const iconMap = {
  FaInstagram: FaInstagram,
  FaTelegramPlane: FaTelegramPlane
  // Adicione mais ícones aqui conforme necessário
};

export default function Footer() {
  const [footerData, setFooterData] = useState(null);

  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" });

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
          if (data.footer) {
            setFooterData(data.footer);
          } else {
            console.warn('Nenhum dado de footer encontrado.');
          }
        } else {
          console.error('Falha ao buscar dados do footer:', await res.text());
        }
      } catch (error) {
        console.error('Erro ao buscar dados do footer:', error);
      }
    };

    fetchData();
  }, []);

  if (!footerData) {
    return (
      <Box bg="green.800" color="white" py={8}>
        <Container maxW={containerMaxWidth}>
          <Text>Carregando informações do Footer...</Text>
        </Container>
      </Box>
    );
  }

  const { logo, links = [], socialMedia = [], phone, copyright } = footerData;

  return (
    <Box bg="green.800" color="white" py={8}>
      <Container maxW={containerMaxWidth}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={{ base: 6, md: 0 }}
        >
          {/* Logo à esquerda */}
          <Box mb={{ base: 6, md: 0 }} textAlign={{ base: "center", md: "left" }} flex={{ base: "none", md: "1" }}>
            {logo ? (
              <Image src={logo} alt="Logo" maxH="50px" objectFit="contain" />
            ) : (
              <Text fontSize="2xl" fontWeight="bold" fontFamily="Nunito Sans, sans-serif">
                Bolão
              </Text>
            )}
          </Box>

          {/* Links das redes sociais */}
          {socialMedia.length > 0 && (
            <Box mb={{ base: 6, md: 0 }} textAlign="right" flex={{ base: "none", md: "1" }}>
              <Text fontSize="lg" mb={3} fontFamily="Nunito Sans, sans-serif">Siga-nos</Text>
              <Flex justify="right" gap={4} align="right" width="100%">
                {socialMedia.map((social, index) => {
                  const IconComponent = iconMap[social.icon] || FaInstagram; // usa FaInstagram caso não encontre o ícone
                  return (
                    <Link key={index} href={social.url} isExternal>
                      <Icon as={IconComponent} boxSize={6} _hover={{ color: 'green.400' }} />
                    </Link>
                  )
                })}
              </Flex>
            </Box>
          )}

          {/* Atendimento ao Cliente */}
          {phone && (
            <Box mb={{ base: 6, md: 0 }} textAlign="right" flex={{ base: "none", md: "auto" }}>
              <Text fontSize="lg" mb={2} fontFamily="Nunito Sans, sans-serif">Atendimento ao Cliente:</Text>
              <Text fontSize="md" fontFamily="Nunito Sans, sans-serif">{phone}</Text>
            </Box>
          )}
        </Flex>

        {/* Links das páginas */}
        {links.length > 0 && (
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="center"
            align="center"
            wrap="wrap"
            gap={6}
            mt={6}
          >
            {links.map((page, index) => (
              <Link
                key={index}
                href={page.url}
                fontSize="md"
                color="white"
                fontFamily="Nunito Sans, sans-serif"
                _hover={{ color: 'green.400' }}
              >
                {page.text}
              </Link>
            ))}
          </Flex>
        )}

        {/* Copyright */}
        {copyright && (
          <Box mt={6} textAlign="center">
            <Text fontSize="sm" color="gray.300" fontFamily="Nunito Sans, sans-serif">
              {copyright}
            </Text>
          </Box>
        )}
      </Container>
    </Box>
  )
}
