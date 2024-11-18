import React from 'react';
import { Box, Heading, Text, Button, Stack, Icon, Flex, Link, Divider, useBreakpointValue } from '@chakra-ui/react';
import { FaWhatsapp, FaInstagram, FaTelegram } from 'react-icons/fa';

const Contact = () => {
  const buttonSize = useBreakpointValue({ base: "md", md: "lg" });

  return (
    <Box p={6} bg="white" boxShadow="xl" borderRadius="md" maxW="4xl" mx="auto" mb={8}>
      <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
        Nossos Contatos
      </Heading>

      <Stack spacing={6} direction="column" align="center">
        {/* WhatsApp Button */}
        <Box w="full" textAlign="center">
          <Text fontSize="lg" color="green.700" mb={4}>
            Mande um WhatsApp
          </Text>
          <Text fontSize="md" color="green.700" mb={4}>
            Clique no botão verde e fale diretamente conosco pelo WhatsApp!
          </Text>

          <Button
            as="a"
            href="https://wa.me/5575998091153"
            target="_blank"
            leftIcon={<Icon as={FaWhatsapp} color="white" boxSize={6} />}
            colorScheme="green"
            size={buttonSize}
            w="full"
          >
            WhatsApp 1
          </Button>
        </Box>

        <Divider orientation="horizontal" borderColor="green.200" w="full" />

        {/* WhatsApp 2 */}
        <Box w="full" textAlign="center">
          <Button
            as="a"
            href="https://wa.me/5575998091153"
            target="_blank"
            leftIcon={<Icon as={FaWhatsapp} color="white" boxSize={6} />}
            colorScheme="green"
            size={buttonSize}
            w="full"
          >
            WhatsApp 2
          </Button>
        </Box>

        <Divider orientation="horizontal" borderColor="green.200" w="full" />

        {/* Canais Oficiais */}
        <Box w="full" textAlign="center">
          <Text fontSize="lg" color="green.700" mb={4}>
            Nossos Canais Oficiais
          </Text>

          <Flex justify="center" gap={6}>
            <Link href="https://www.instagram.com" isExternal>
              <Button
                leftIcon={<Icon as={FaInstagram} color="white" boxSize={6} />}
                colorScheme="green"
                size={buttonSize}
                variant="solid"
              >
                Instagram
              </Button>
            </Link>

            <Link href="https://t.me" isExternal>
              <Button
                leftIcon={<Icon as={FaTelegram} color="white" boxSize={6} />}
                colorScheme="green"
                size={buttonSize}
                variant="solid"
              >
                Telegram
              </Button>
            </Link>
          </Flex>
        </Box>

        <Divider orientation="horizontal" borderColor="green.200" w="full" />

        {/* Atendimento ao Cliente */}
        <Box w="full" textAlign="center">
          <Text fontSize="lg" color="green.700" mb={4}>
            Somente esse número é o nosso contato de Atendimento ao Cliente
          </Text>
          <Text fontSize="xl" color="green.800" fontWeight="bold">
            (75) 9 9809-1153
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};

export default Contact;
