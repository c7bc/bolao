'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Card,
  CardBody,
  Text,
  VStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react';
import { DashboardClientStats } from './DashboardClientStats';
import ConcursosBlock from '../../ConcursosBlock';
import ClientPrizeCalculation from './ClientPrizeCalculation';
import Historico from './Historico';
import { useRouter } from 'next/navigation';

const ClienteDashboard = () => {
  const toast = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const cancelRef = React.useRef();

  // Verificar autenticação
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/login');
    }
  }, [router, toast]);

  // Handler para mudança de tab
  const handleTabChange = (index) => {
    setSelectedTabIndex(index);
  };

  // Confirmação de saída
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl" color="green.800">
            Dashboard do Cliente
          </Heading>
          <Button colorScheme="red" variant="ghost" onClick={onOpen}>
            Sair
          </Button>
        </Box>

        <DashboardClientStats />

        <Card boxShadow="md" bg="white">
          <CardBody>
            <Tabs 
              colorScheme="green" 
              variant="enclosed-colored" 
              isFitted
              index={selectedTabIndex}
              onChange={handleTabChange}
            >
              <TabList mb="1em">
                <Tab _selected={{ bg: 'green.500', color: 'white' }}>
                  Jogos Disponíveis
                </Tab>
                <Tab _selected={{ bg: 'green.500', color: 'white' }}>
                  Meus Jogos
                </Tab>
                {/* <Tab _selected={{ bg: 'green.500', color: 'white' }}>
                  Histórico
                </Tab> */}
              </TabList>

              <TabPanels>
                <TabPanel>
                  <ConcursosBlock />
                </TabPanel>
                
                <TabPanel>
                  <ClientPrizeCalculation />
                </TabPanel>
                
                {/* <TabPanel>
                  <Historico />
                </TabPanel> */}
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Diálogo de confirmação de logout */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Saída
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja sair da sua conta?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleLogout} ml={3}>
                Sair
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default ClienteDashboard;