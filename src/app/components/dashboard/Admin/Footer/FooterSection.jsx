// src/app/components/dashboard/Admin/Footer/FooterSection.jsx
import React from 'react';
import {
  VStack,
  Box,
  Heading,
  HStack,
  Input,
  IconButton,
  Button,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import PageSection from '../PageSection';
import ImageUpload from '../ImageUpload';

const FooterSection = ({ footer, setFooter }) => {
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...footer.links];
    newLinks[index][field] = value;
    setFooter({ ...footer, links: newLinks });
  };

  const handleAddLink = () => {
    setFooter({
      ...footer,
      links: [...footer.links, { text: '', url: '' }],
    });
  };

  const handleDeleteLink = (index) => {
    const newLinks = footer.links.filter((_, i) => i !== index);
    setFooter({ ...footer, links: newLinks });
  };

  const handleSocialChange = (index, field, value) => {
    const newSocial = [...footer.socialMedia];
    newSocial[index][field] = value;
    setFooter({ ...footer, socialMedia: newSocial });
  };

  const handleAddSocial = () => {
    setFooter({
      ...footer,
      socialMedia: [...footer.socialMedia, { platform: '', url: '', icon: '' }],
    });
  };

  const handleDeleteSocial = (index) => {
    const newSocial = footer.socialMedia.filter((_, i) => i !== index);
    setFooter({ ...footer, socialMedia: newSocial });
  };

  return (
    <PageSection title="Configurações do Footer">
      <VStack spacing={4} align="stretch">
        <ImageUpload
          label="Logo do Footer"
          preview={footer.logo}
          onUpload={(url) => setFooter({ ...footer, logo: url })}
        />
        <FormControl>
          <FormLabel>Telefone</FormLabel>
          <Input
            value={footer.phone}
            onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Texto de Copyright</FormLabel>
          <Input
            value={footer.copyright}
            onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
          />
        </FormControl>
        
        <Box>
          <Heading size="sm" mb={2}>Links do Footer</Heading>
          {footer.links.map((link, index) => (
            <HStack key={index} mb={2}>
              <Input
                placeholder="Texto"
                value={link.text}
                onChange={(e) => handleLinkChange(index, 'text', e.target.value)}
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              />
              <IconButton
                icon={<DeleteIcon />}
                onClick={() => handleDeleteLink(index)}
                aria-label="Delete link"
              />
            </HStack>
          ))}
          <Button
            leftIcon={<AddIcon />}
            onClick={handleAddLink}
            colorScheme="green"
            size="sm"
            mt={2}
          >
            Adicionar Link
          </Button>
        </Box>

        <Box>
          <Heading size="sm" mb={2}>Redes Sociais</Heading>
          {footer.socialMedia.map((social, index) => (
            <HStack key={index} mb={2}>
              <Input
                placeholder="Plataforma (ex: Instagram)"
                value={social.platform}
                onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
              />
              <Input
                placeholder="URL"
                value={social.url}
                onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
              />
              <Input
                placeholder="Ícone (ex: FaInstagram)"
                value={social.icon}
                onChange={(e) => handleSocialChange(index, 'icon', e.target.value)}
              />
              <IconButton
                icon={<DeleteIcon />}
                onClick={() => handleDeleteSocial(index)}
                aria-label="Delete social media"
              />
            </HStack>
          ))}
          <Button
            leftIcon={<AddIcon />}
            onClick={handleAddSocial}
            colorScheme="green"
            size="sm"
            mt={2}
          >
            Adicionar Rede Social
          </Button>
        </Box>
      </VStack>
    </PageSection>
  );
};

export default FooterSection;
