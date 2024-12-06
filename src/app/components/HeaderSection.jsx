'use client'
import { useState, useEffect } from 'react'
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
  useBreakpointValue,
  Image
} from '@chakra-ui/react'
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons'
import Link from 'next/link'
import axios from 'axios'

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, lg: false })

  const [headerConfig, setHeaderConfig] = useState({
    logo: '',
    navLinks: [
      { text: 'Início', link: '/' },
      { text: 'Concursos', link: '/concursos' },
      { text: 'Perguntas Frequentes', link: '/perguntas-frequentes' },
      { text: 'Contatos', link: '/contato' },
    ],
    bolaoLinks: [
      { text: 'Bolão da Segunda: 22 - Vendas Abertas', link: '#' },
      { text: 'Bolão da Sábado: 151 - Vendas Abertas', link: '#' },
      { text: 'Bolão da Quarta: 290 - Finalizado', link: '#' },
    ],
    styles: {
      height: '80px',
      backgroundColor: '#FFFFFF',
      textColor: '#4A5568',
      hoverColor: '#48BB78',
      isFixed: true,
      transparentOnScroll: false
    }
  })

  const authLinks = [
    { text: 'Criar Conta', link: '/cadastro' },
    { text: 'Entrar', link: '/login' },
  ]

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/save')
        if (response.data?.header) {
          setHeaderConfig(response.data.header)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do header:', error)
      }
    }

    fetchConfig()
  }, [])

  const NavLinks = ({ isMobile = false, onClose = () => {} }) => (
    <Flex
      gap={isMobile ? 4 : 8}
      align={isMobile ? "flex-start" : "center"}
      direction={isMobile ? "column" : "row"}
      w={isMobile ? "full" : "auto"}
    >
      {headerConfig.navLinks.map(({ text, link }, index) => (
        <Link href={link} key={index}>
          <Text 
            fontSize="md" 
            fontFamily="Nunito Sans, sans-serif"
            color={headerConfig.styles.textColor}
            fontWeight="500"
            _hover={{ color: headerConfig.styles.hoverColor }}
            cursor="pointer"
            onClick={isMobile ? onClose : undefined}
          >
            {text}
          </Text>
        </Link>
      ))}

      {isMobile ? (
        <VStack align="flex-start" spacing={2} w="full">
          <Text
            fontSize="md"
            fontFamily="Nunito Sans, sans-serif"
            color={headerConfig.styles.textColor}
            fontWeight="500"
          >
            Bolões
          </Text>
          <VStack align="flex-start" pl={4} spacing={2} w="full">
            {headerConfig.bolaoLinks.map(({ text, link }, index) => (
              <Link href={link} key={index}>
                <Text
                  fontSize="sm"
                  color={headerConfig.styles.textColor}
                  _hover={{ color: headerConfig.styles.hoverColor }}
                  cursor="pointer"
                >
                  {text}
                </Text>
              </Link>
            ))}
          </VStack>
        </VStack>
      ) : (
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            variant="ghost"
            color={headerConfig.styles.textColor}
            fontFamily="Nunito Sans, sans-serif"
            fontWeight="500"
            _hover={{ color: headerConfig.styles.hoverColor, bg: 'gray.50' }}
          >
            Bolões
          </MenuButton>
          <MenuList 
            shadow="lg" 
            border="1px" 
            borderColor="gray.100"
          >
            {headerConfig.bolaoLinks.map(({ text, link }, index) => (
              <Link href={link} key={index}>
                <MenuItem 
                  _hover={{ bg: 'gray.50', color: headerConfig.styles.hoverColor }}
                  fontSize="sm"
                >
                  {text}
                </MenuItem>
              </Link>
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
      align="center"
      justify="center"
      textAlign="center"
    >
      {authLinks.map(({ text, link }, index) => (
        <Button
          key={index}
          variant={text === 'Criar Conta' ? 'outline' : 'solid'}
          color={text === 'Criar Conta' ? headerConfig.styles.hoverColor : 'white'}
          borderColor={text === 'Criar Conta' ? headerConfig.styles.hoverColor : 'none'}
          bg={text === 'Criar Conta' ? 'transparent' : headerConfig.styles.hoverColor}
          fontFamily="Nunito Sans, sans-serif"
          fontWeight="500"
          size="md"
          _hover={{
            bg: text === 'Criar Conta' ? 'green.50' : 'green.500',
            color: text === 'Criar Conta' ? headerConfig.styles.hoverColor : 'white',
          }}
        >
          <Link href={link}>{text}</Link>
        </Button>
      ))}
    </ButtonGroup>
  )

  return (
    <Box 
      bg={headerConfig.styles.backgroundColor}
      borderBottom="1px" 
      borderColor="gray.100" 
      py={4}
      position={headerConfig.styles.isFixed ? "sticky" : "relative"}
      top={0}
      height={headerConfig.styles.height}
      zIndex={1000}
      boxShadow="sm"
      style={headerConfig.styles.transparentOnScroll ? {
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      } : {}}
    >
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between">
          {headerConfig.logo ? (
            <Image 
              src={headerConfig.logo} 
              alt="Logo"
              maxH="50px"
              objectFit="contain"
            />
          ) : (
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
          )}

          {!isMobile && (
            <>
              <NavLinks />
              <AuthButtons />
            </>
          )}

          {isMobile && (
            <IconButton
              display={{ base: 'flex', lg: 'none' }}
              onClick={onOpen}
              variant="ghost"
              aria-label="Open menu"
              icon={<HamburgerIcon boxSize={6} />}
            />
          )}

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