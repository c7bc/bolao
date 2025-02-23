import React from 'react';
import {
  VStack,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import PageSection from '../PageSection';

const IntegrationSection = ({ integration, setIntegration }) => {
  const handleChange = (field, value) => {
    setIntegration({ ...integration, [field]: value });
  };

  return (
    <PageSection title="Configurações de Integração">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>EFI_API_URL</FormLabel>
          <Input
            value={integration.EFI_API_URL}
            onChange={(e) => handleChange('EFI_API_URL', e.target.value)}
            placeholder="URL da API da Efí Payments"
          />
        </FormControl>
        <FormControl>
          <FormLabel>EFI_API_KEY</FormLabel>
          <Input
            value={integration.EFI_API_KEY}
            onChange={(e) => handleChange('EFI_API_KEY', e.target.value)}
            placeholder="Chave da API da Efí Payments"
          />
        </FormControl>
        <FormControl>
          <FormLabel>EFI_WEBHOOK_SECRET</FormLabel>
          <Input
            value={integration.EFI_WEBHOOK_SECRET}
            onChange={(e) => handleChange('EFI_WEBHOOK_SECRET', e.target.value)}
            placeholder="Segredo do Webhook da Efí Payments"
          />
        </FormControl>
      </VStack>
    </PageSection>
  );
};

export default IntegrationSection;