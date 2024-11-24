// src/app/components/dashboard/Admin/Configuracoes.jsx

import React from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import JogosConfig from './JogosConfig';
import RecebimentoConfig from './RecebimentoConfig';
import PorcentagensConfig from './PorcentagensConfig';

const Configuracoes = () => {
  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Configurações
      </Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Jogos</Tab>
          <Tab>Recebimento</Tab>
          <Tab>Porcentagens</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <JogosConfig />
          </TabPanel>
          <TabPanel>
            <RecebimentoConfig />
          </TabPanel>
          <TabPanel>
            <PorcentagensConfig />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Configuracoes;
