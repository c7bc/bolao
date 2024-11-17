'use client'
import { Box, Flex, Text, Link, Icon, Container, useBreakpointValue } from '@chakra-ui/react'
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";

const footerContent = {
  socialLinks: [
    { name: 'Instagram', icon: FaInstagram, link: 'https://www.instagram.com/bolao' },
    { name: 'Telegram', icon: FaTelegramPlane, link: 'https://t.me/bolao' }
  ],
  contact: [
    { title: "Atendimento ao Cliente:", phone: "(75) 9 9809-1153" }
  ],
  pages: [
    { name: 'Início', link: '#' },
    { name: 'Ganhadores', link: '#' },
    { name: 'Regulamento', link: '#' },
    { name: 'FAQ', link: '#' },
    { name: 'Contatos', link: '#' },
    { name: 'Área Restrita', link: '#' }
  ],
  copyright: [
    "© 2019-2024 Bolão do Neneu. Todos os direitos reservados."
  ]
}

export default function Footer() {
  const containerMaxWidth = useBreakpointValue({ base: "container.sm", md: "container.xl" })

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
            <Text fontSize="2xl" fontWeight="bold" fontFamily="Nunito Sans, sans-serif">
              Bolão do Neneu
            </Text>
          </Box>

          {/* Links das redes sociais */}
          <Box mb={{ base: 6, md: 0 }} textAlign="right" flex={{ base: "none", md: "1" }}>
            <Text fontSize="lg" mb={3} fontFamily="Nunito Sans, sans-serif">Siga-nos</Text>
            <Flex justify="right" gap={4} align="right" width="100%">
              {footerContent.socialLinks.map((social, index) => (
                <Link key={index} href={social.link} isExternal>
                  <Icon as={social.icon} boxSize={6} _hover={{ color: 'green.400' }} />
                </Link>
              ))}
            </Flex>
          </Box>

          {/* Atendimento ao Cliente */}
          <Box mb={{ base: 6, md: 0 }} textAlign="right" flex={{ base: "none", md: "auto" }}>
            {footerContent.contact.map((item, index) => (
              <div key={index}>
                <Text fontSize="lg" mb={2} fontFamily="Nunito Sans, sans-serif">{item.title}</Text>
                <Text fontSize="md" fontFamily="Nunito Sans, sans-serif">{item.phone}</Text>
              </div>
            ))}
          </Box>
        </Flex>

        {/* Links das páginas */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="center"
          align="center"
          wrap="wrap"
          gap={6}
          mt={6}
        >
          {footerContent.pages.map((page, index) => (
            <Link
              key={index}
              href={page.link}
              fontSize="md"
              color="white"
              fontFamily="Nunito Sans, sans-serif"
              _hover={{ color: 'green.400' }}
            >
              {page.name}
            </Link>
          ))}
        </Flex>

        {/* Copyright */}
        <Box mt={6} textAlign="center">
          {footerContent.copyright.map((item, index) => (
            <Text key={index} fontSize="sm" color="gray.300" fontFamily="Nunito Sans, sans-serif">
              {item}
            </Text>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
