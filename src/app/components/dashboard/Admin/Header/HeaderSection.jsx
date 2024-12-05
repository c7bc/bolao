// components/header/HeaderSection.js
import React from 'react';
import { VStack, Box, Heading, HStack, Input, IconButton, Button, FormControl, FormLabel } from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import PageSection from '../PageSection';
import ImageUpload from '../ImageUpload';

const HeaderSection = ({ header, setHeader }) => {
  const handleNavLinkChange = (index, field, value) => {
    const newNavLinks = [...header.navLinks];
    newNavLinks[index][field] = value;
    setHeader({ ...header, navLinks: newNavLinks });
  };

  const handleAddNavLink = () => {
    setHeader({
      ...header,
      navLinks: [...header.navLinks, { text: '', link: '' }],
    });
  };

  const handleDeleteNavLink = (index) => {
    const newNavLinks = header.navLinks.filter((_, i) => i !== index);
    setHeader({ ...header, navLinks: newNavLinks });
  };

  return (
    <PageSection title="Configurações do Header">
      <VStack spacing={4} align="stretch">
        <ImageUpload
          label="Logo"
          preview={header.logo}
          onUpload={(url) => setHeader({ ...header, logo: url })}
        />
        <Box>
          <Heading size="sm" mb={2}>Links de Navegação</Heading>
          {header.navLinks.map((link, index) => (
            <HStack key={index} mb={2}>
              <Input
                placeholder="Texto"
                value={link.text}
                onChange={(e) => handleNavLinkChange(index, 'text', e.target.value)}
              />
              <Input
                placeholder="Link"
                value={link.link}
                onChange={(e) => handleNavLinkChange(index, 'link', e.target.value)}
              />
              <IconButton
                icon={<DeleteIcon />}
                onClick={() => handleDeleteNavLink(index)}
                aria-label="Delete link"
              />
            </HStack>
          ))}
          <Button
            leftIcon={<AddIcon />}
            onClick={handleAddNavLink}
            colorScheme="green"
            size="sm"
            mt={2}
          >
            Adicionar Link
          </Button>
        </Box>
      </VStack>
    </PageSection>
  );
};

export default HeaderSection;
