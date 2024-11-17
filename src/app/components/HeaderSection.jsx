'use client'
import { useState } from 'react'
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Button, 
  Container,
  ButtonGroup,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure,
  useBreakpointValue
} from '@chakra-ui/react'
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons'

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, lg: false })

  // Array para os links de navegação
  const navLinks = [
    { text: 'Início', link: '#' },
    { text: 'Concursos', link: '#' },
    { text: 'Perguntas Frequentes', link: '#' },
    { text: 'Contatos', link: '#' },
  ]

  const bolaoLinks = [
    { text: 'Bolão da Segunda: 22 - Vendas Abertas', link: '#' },
    { text: 'Bolão da Sábado: 151 - Vendas Abertas', link: '#' },
    { text: 'Bolão da Quarta: 290 - Finalizado', link: '#' },
  ]

  const NavLinks = ({ isMobile = false, onClose = () => {} }) => (
    <Flex
      gap={isMobile ? 4 : 8}
      align={isMobile ? "flex-start" : "center"}
      direction={isMobile ? "column" : "row"}
      w={isMobile ? "full" : "auto"}
    >
      {/* Iterando sobre os links de navegação */}
      {navLinks.map(({ text, link }, index) => (
        <Text 
          key={index}
          fontSize="md" 
          fontFamily="Nunito Sans, sans-serif"
          color="gray.600"
          fontWeight="500"
          _hover={{ color: 'green.400' }} // Verde Claro
          cursor="pointer"
          onClick={isMobile ? onClose : undefined}
        >
          {text}
        </Text>
      ))}

      {/* Menu de Bolões */}
      {isMobile ? (
        <VStack align="flex-start" spacing={2} w="full">
          <Text
            fontSize="md"
            fontFamily="Nunito Sans, sans-serif"
            color="gray.600"
            fontWeight="500"
          >
            Bolões
          </Text>
          <VStack align="flex-start" pl={4} spacing={2} w="full">
            {bolaoLinks.map(({ text, link }, index) => (
              <Text
                key={index}
                fontSize="sm"
                color="gray.600"
                _hover={{ color: 'green.400' }} // Verde Claro
                cursor="pointer"
              >
                {text}
              </Text>
            ))}
          </VStack>
        </VStack>
      ) : (
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            variant="ghost"
            color="gray.600"
            fontFamily="Nunito Sans, sans-serif"
            fontWeight="500"
            _hover={{ color: 'green.400', bg: 'gray.50' }} // Verde Claro
          >
            Bolões
          </MenuButton>
          <MenuList 
            shadow="lg" 
            border="1px" 
            borderColor="gray.100"
          >
            {bolaoLinks.map(({ text, link }, index) => (
              <MenuItem 
                key={index}
                _hover={{ bg: 'gray.50', color: 'green.400' }} // Verde Claro
                fontSize="sm"
              >
                {text}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )}
    </Flex>
  )

  const AuthButtons = ({ isMobile = false }) => (
    <ButtonGroup 
      spacing={4} 
      display="flex" 
      flexDir={isMobile ? "column" : "row"}
      align="center" // Centralizando os botões
      justify="center" // Centralizando os botões
      textAlign="center" // Garantindo que o conteúdo dos botões também será centralizado
    >
      <Button
        variant="outline"
        color="green.400" // Verde Claro
        borderColor="green.400" // Verde Claro
        fontFamily="Nunito Sans, sans-serif"
        fontWeight="500"
        size="md"
        _hover={{
          bg: 'green.50' // Verde Claro
        }}
      >
        Criar Conta
      </Button>
      <Button
        bg="green.400" // Verde Claro
        color="white"
        fontFamily="Nunito Sans, sans-serif"
        fontWeight="500"
        size="md"
        _hover={{
          bg: 'green.500' // Verde Claro
        }}
        mt={isMobile ? 4 : 0} // Adicionando margin-top no botão "Entrar" no mobile
        mr={isMobile ? 4 : 0}
      >
        Entrar
      </Button>
    </ButtonGroup>
  )

  return (
    <Box 
      bg="white" 
      borderBottom="1px" 
      borderColor="gray.100" 
      py={4}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between">
          {/* Logo */}
          <Heading 
            as="h1" 
            size={{ base: "md", md: "lg" }}
            fontFamily="Nunito Sans, sans-serif"
            bgGradient="linear(to-r, green.400, teal.500)"
            bgClip="text"
            fontWeight="bold"
          >
            Logo
          </Heading>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <NavLinks />
              <AuthButtons />
            </>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              display={{ base: 'flex', lg: 'none' }}
              onClick={onOpen}
              variant="ghost"
              aria-label="Open menu"
              icon={<HamburgerIcon boxSize={6} />}
            />
          )}

          {/* Mobile Drawer */}
          <Drawer
            isOpen={isOpen}
            placement="right"
            onClose={onClose}
            size="full"
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader 
                borderBottomWidth="1px"
                bgGradient="linear(to-r, green.400, teal.500)"
                color="white"
              >
                Menu
              </DrawerHeader>

              <DrawerBody pt={8}>
                <VStack spacing={8} align="stretch">
                  <NavLinks isMobile onClose={onClose} />
                  <Box pt={4} borderTopWidth="1px">
                    <AuthButtons isMobile />
                  </Box>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </Flex>
      </Container>
    </Box>
  )
}
