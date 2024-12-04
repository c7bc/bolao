import React, { useEffect, useState } from 'react';
import { Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, Button } from '@chakra-ui/react';
import axios from 'axios';
import JogosAtivos from './JogosAtivos';
import JogosFinalizados from './JogosFinalizados';
import ListaJogos from './ListaJogos';
import GameFormModalColaborador from './GameFormModalColaborador';  // Importando o modal de criação de jogo

const Jogos = ({ col_id }) => {
  const [loading, setLoading] = useState(true);
  const [jogosAtivos, setJogosAtivos] = useState([]);
  const [jogosFinalizados, setJogosFinalizados] = useState([]);
  const [listaJogos, setListaJogos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a abertura do modal
  const toast = useToast();

  // Função para buscar os dados necessários
  const fetchDados = async () => {
    try {
      const token = localStorage.getItem('token');

      // Buscar jogos ativos e finalizados para o colaborador
      const responseJogos = await axios.get('/api/colaborador/jogos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { col_id },
      });

      setJogosAtivos(responseJogos.data.jogosAtivos);
      setJogosFinalizados(responseJogos.data.jogosFinalizados);

      // Buscar lista de jogos (sem filtro)
      const responseListaJogos = await axios.get('/api/jogos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListaJogos(responseListaJogos.data.jogos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [col_id]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <Box p={6}>
      <Heading as="h2" size="xl" color="green.800" mb={6}>
        Painel do Colaborador
      </Heading>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <Tabs variant="enclosed" colorScheme="green">
          <TabList>
            <Tab>Meus Jogos Ativos</Tab>
            <Tab>Jogos Finalizados</Tab>
            <Tab>Lista de Jogos</Tab>
          </TabList>

          <TabPanels>
            {/* Aba Meus Jogos Ativos */}
            <TabPanel>
              <JogosAtivos jogos={jogosAtivos} />
              <Button colorScheme="blue" mt={4} onClick={handleOpenModal}>
                Criar Novo Jogo
              </Button>
            </TabPanel>

            {/* Aba Jogos Finalizados */}
            <TabPanel>
              <JogosFinalizados jogos={jogosFinalizados} />
            </TabPanel>

            {/* Aba Lista de Jogos */}
            <TabPanel>
              <ListaJogos listaJogos={listaJogos} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {/* Modal de criação de jogo */}
      <GameFormModalColaborador
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refreshList={fetchDados}  // Passando a função de atualização para o modal
      />
    </Box>
  );
};

export default Jogos;
