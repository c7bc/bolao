// Caminho: src/app/components/dashboard/Admin/Configuracoes.jsx
// src/app/components/dashboard/Admin/Configuracoes.jsx

'use client';

import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import TaxasComissaoConfig from './TaxasComissaoConfig'; // Importação do componente de configuração de taxas

const Configuracoes = () => {
  return (
    <Tabs isFitted variant="enclosed" colorScheme="green">
      <TabList mb="1em">
        <Tab>Geral</Tab>
        <Tab>Taxas de Comissão</Tab> {/* Nova aba adicionada */}
        {/* Adicione mais abas conforme necessário */}
      </TabList>
      <TabPanels>
        <TabPanel>
          {/* Conteúdo da aba "Geral" */}
          <p>Configurações gerais do sistema.</p>
        </TabPanel>
        <TabPanel>
          {/* Conteúdo da aba "Taxas de Comissão" */}
          <TaxasComissaoConfig />
        </TabPanel>
        {/* Adicione mais TabPanels conforme as abas adicionadas */}
      </TabPanels>
    </Tabs>
  );
};

export default Configuracoes;
