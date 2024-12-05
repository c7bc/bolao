import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  useToast, 
  Button,
  Spinner,
  Center 
} from '@chakra-ui/react';
import axios from 'axios';
import JogosAtivos from './JogosAtivos';
import JogosFinalizados from './JogosFinalizados';
import ListaJogos from './ListaJogos';
import GameFormModalColaborador from './GameFormModalColaborador';

const Jogos = ({ col_id }) => {
  const [loading, setLoading] = useState(true);
  const [jogosAtivos, setJogosAtivos] = useState([]);
  const [jogosFinalizados, setJogosFinalizados] = useState([]);
  const [listaJogos, setListaJogos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const [responseJogos, responseListaJogos] = await Promise.all([
        axios.get('/api/colaborador/jogos', {
          headers: { Authorization: `Bearer ${token}` },
          params: { col_id },
        }),
        axios.get('/api/jogos', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setJogosAtivos(responseJogos.data.jogosAtivos);
      setJogosFinalizados(responseJogos.data.jogosFinalizados);
      setListaJogos(responseListaJogos.data.jogos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados.',
        description: error.response?.data?.error || error.message || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [col_id, toast]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  if (loading) {
    return (
      <Center p={8}>
        <Spinner size="xl" color="green.500" />
      </Center>
    );
  }

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Painel do Colaborador
      </Heading>

      <Tabs variant="enclosed" colorScheme="green">
        <TabList>
          <Tab>Meus Jogos Ativos</Tab>
          <Tab>Jogos Finalizados</Tab>
          <Tab>Lista de Jogos</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <JogosAtivos jogos={jogosAtivos} />
            <Button 
              colorScheme="blue" 
              mt={4} 
              onClick={handleOpenModal}
              leftIcon={<span>+</span>}
            >
              Criar Novo Jogo
            </Button>
          </TabPanel>

          <TabPanel>
            <JogosFinalizados jogos={jogosFinalizados} />
          </TabPanel>

          <TabPanel>
            <ListaJogos listaJogos={listaJogos} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <GameFormModalColaborador
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refreshList={fetchDados}
      />
    </Box>
  );
};

export default Jogos;