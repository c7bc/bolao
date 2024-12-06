import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  IconButton,
  Textarea,
  Heading,
  Select,
  Divider
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import PageSection from '../PageSection';

// Ícones disponíveis (você pode adicionar mais conforme necessário)
const iconOptions = [
  { label: 'FaWhatsapp', value: 'FaWhatsapp' },
  { label: 'FaInstagram', value: 'FaInstagram' },
  { label: 'FaTelegram', value: 'FaTelegram' }
];

const ContactSection = ({ contact, setContact }) => {

  const handleWhatsAppChange = (index, field, value) => {
    const newLinks = [...contact.whatsappLinks];
    newLinks[index][field] = value;
    setContact({ ...contact, whatsappLinks: newLinks });
  };

  const handleAddWhatsApp = () => {
    setContact({
      ...contact,
      whatsappLinks: [...contact.whatsappLinks, { label: '', url: '' }]
    });
  };

  const handleDeleteWhatsApp = (index) => {
    const newLinks = contact.whatsappLinks.filter((_, i) => i !== index);
    setContact({ ...contact, whatsappLinks: newLinks });
  };

  const handleOfficialChange = (index, field, value) => {
    const newChannels = [...contact.officialChannels];
    newChannels[index][field] = value;
    setContact({ ...contact, officialChannels: newChannels });
  };

  const handleAddOfficial = () => {
    setContact({
      ...contact,
      officialChannels: [...contact.officialChannels, { label: '', url: '', icon: '' }]
    });
  };

  const handleDeleteOfficial = (index) => {
    const newChannels = contact.officialChannels.filter((_, i) => i !== index);
    setContact({ ...contact, officialChannels: newChannels });
  };

  return (
    <PageSection title="Configurações de Contato">
      <VStack spacing={4} align="stretch">

        <FormControl>
          <FormLabel>Título da Seção</FormLabel>
          <Input
            placeholder="Título da Seção (ex: Nossos Contatos)"
            value={contact.title}
            onChange={(e) => setContact({ ...contact, title: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Título do WhatsApp</FormLabel>
          <Input
            placeholder="Título (ex: Mande um WhatsApp)"
            value={contact.whatsappTitle}
            onChange={(e) => setContact({ ...contact, whatsappTitle: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Descrição do WhatsApp</FormLabel>
          <Textarea
            placeholder="Descrição sobre o WhatsApp"
            value={contact.whatsappDescription}
            onChange={(e) => setContact({ ...contact, whatsappDescription: e.target.value })}
          />
        </FormControl>

        <Heading size="sm" mb={2}>Links de WhatsApp</Heading>
        {contact.whatsappLinks.map((link, index) => (
          <HStack key={index} mb={2}>
            <Input
              placeholder="Label (ex: WhatsApp 1)"
              value={link.label}
              onChange={(e) => handleWhatsAppChange(index, 'label', e.target.value)}
            />
            <Input
              placeholder="URL do WhatsApp"
              value={link.url}
              onChange={(e) => handleWhatsAppChange(index, 'url', e.target.value)}
            />
            <IconButton
              icon={<DeleteIcon />}
              onClick={() => handleDeleteWhatsApp(index)}
              aria-label="Delete WhatsApp Link"
            />
          </HStack>
        ))}
        <Button
          leftIcon={<AddIcon />}
          onClick={handleAddWhatsApp}
          colorScheme="green"
          size="sm"
          mt={2}
        >
          Adicionar Link de WhatsApp
        </Button>

        <Divider />

        <FormControl>
          <FormLabel>Título dos Canais Oficiais</FormLabel>
          <Input
            placeholder="Título (ex: Nossos Canais Oficiais)"
            value={contact.officialChannelsTitle}
            onChange={(e) => setContact({ ...contact, officialChannelsTitle: e.target.value })}
          />
        </FormControl>

        <Heading size="sm" mb={2}>Canais Oficiais</Heading>
        {contact.officialChannels.map((chan, index) => (
          <VStack key={index} spacing={2} align="stretch" borderWidth={1} p={4} borderRadius="md">
            <FormControl>
              <FormLabel>Label (ex: Instagram)</FormLabel>
              <Input
                value={chan.label}
                onChange={(e) => handleOfficialChange(index, 'label', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>URL</FormLabel>
              <Input
                value={chan.url}
                onChange={(e) => handleOfficialChange(index, 'url', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Ícone</FormLabel>
              <Select
                placeholder="Selecione um ícone"
                value={chan.icon}
                onChange={(e) => handleOfficialChange(index, 'icon', e.target.value)}
              >
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </FormControl>

            <HStack justify="flex-end">
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                onClick={() => handleDeleteOfficial(index)}
                aria-label="Remover canal oficial"
                size="sm"
              />
            </HStack>
          </VStack>
        ))}

        <Button
          leftIcon={<AddIcon />}
          onClick={handleAddOfficial}
          colorScheme="green"
          size="sm"
          mt={2}
        >
          Adicionar Canal Oficial
        </Button>

        <FormControl mt={4}>
          <FormLabel>Texto Sobre Atendimento ao Cliente</FormLabel>
          <Textarea
            placeholder="Texto descritivo (ex: Somente esse número é o nosso contato...)"
            value={contact.customerServiceNotice}
            onChange={(e) => setContact({ ...contact, customerServiceNotice: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Número de Atendimento ao Cliente</FormLabel>
          <Input
            placeholder="(75) 9 9809-1153"
            value={contact.customerServicePhone}
            onChange={(e) => setContact({ ...contact, customerServicePhone: e.target.value })}
          />
        </FormControl>
      </VStack>
    </PageSection>
  );
};

export default ContactSection;