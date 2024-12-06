import React, { useState } from 'react';
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
  Divider,
  SimpleGrid,
  Text,
  Flex,
  useColorModeValue,
  Select,
  Switch,
  Tooltip,
  Badge,
  useToast,
  Collapse,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { HexColorPicker } from 'react-colorful';
import PageSection from '../PageSection';
import ImageUpload from '../ImageUpload';
import axios from 'axios';
import Image from 'next/image'

const HeaderSection = ({ header, setHeader }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorField, setActiveColorField] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const toast = useToast();
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const [bolaoLinks, setBolaoLinks] = useState(header.bolaoLinks || [
    { text: 'Bolão da Segunda: 22 - Vendas Abertas', link: '#' },
    { text: 'Bolão da Sábado: 151 - Vendas Abertas', link: '#' },
    { text: 'Bolão da Quarta: 290 - Finalizado', link: '#' },
  ]);

  const handleNavLinkChange = (index, field, value) => {
    const newNavLinks = [...header.navLinks];
    newNavLinks[index][field] = value;
    setHeader({ ...header, navLinks: newNavLinks });
  };

  const handleBolaoLinkChange = (index, field, value) => {
    const newBolaoLinks = [...bolaoLinks];
    newBolaoLinks[index][field] = value;
    setBolaoLinks(newBolaoLinks);
    setHeader({ ...header, bolaoLinks: newBolaoLinks });
  };

  const handleAddNavLink = () => {
    setHeader({
      ...header,
      navLinks: [...header.navLinks, { text: '', link: '' }],
    });
  };

  const handleAddBolaoLink = () => {
    const newBolaoLinks = [...bolaoLinks, { text: '', link: '' }];
    setBolaoLinks(newBolaoLinks);
    setHeader({ ...header, bolaoLinks: newBolaoLinks });
  };

  const handleDeleteNavLink = (index) => {
    const newNavLinks = header.navLinks.filter((_, i) => i !== index);
    setHeader({ ...header, navLinks: newNavLinks });
  };

  const handleDeleteBolaoLink = (index) => {
    const newBolaoLinks = bolaoLinks.filter((_, i) => i !== index);
    setBolaoLinks(newBolaoLinks);
    setHeader({ ...header, bolaoLinks: newBolaoLinks });
  };

  const handleStyleChange = (field, value) => {
    setHeader({
      ...header,
      styles: {
        ...header.styles,
        [field]: value,
      },
    });
  };

  const handleLogoUpload = async (file) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logos');
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.url) {
        setHeader({ ...header, logo: response.data.url });
        toast({
          title: 'Logo atualizada com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!header.logo) return;

    try {
      await axios.delete('/api/upload', {
        data: { fileUrl: header.logo }
      });

      setHeader({ ...header, logo: '' });
      toast({
        title: 'Logo removida com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast({
        title: 'Erro ao remover logo',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const saveToDatabase = async () => {
    try {
      const response = await axios.post('/api/save', {
        header: {
          logo: header.logo,
          navLinks: header.navLinks,
          bolaoLinks: header.bolaoLinks,
          styles: header.styles
        }
      });

      if (response.status === 200) {
        toast({
          title: 'Configurações salvas com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const ColorPickerField = ({ label, value, onChange, helpText }) => (
    <FormControl>
      <Flex align="center" mb={2}>
        <FormLabel mb={0}>{label}</FormLabel>
        {helpText && (
          <Tooltip label={helpText}>
            <InfoIcon ml={1} color="gray.500" />
          </Tooltip>
        )}
      </Flex>
      <Flex align="center">
        <Box
          w="40px"
          h="40px"
          borderRadius="md"
          bg={value}
          border="1px"
          borderColor={borderColor}
          cursor="pointer"
          onClick={() => {
            setActiveColorField(label);
            setShowColorPicker(!showColorPicker);
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          ml={2}
          maxW="200px"
        />
      </Flex>
    </FormControl>
  );

  return (
    <PageSection>
      <VStack spacing={8} align="stretch">
        <Box
          bg={bgCard}
          p={6}
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={6} color="green.500">
            Configurações do Header
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Box>
              <VStack align="stretch" spacing={6}>
                <FormControl>
                  <FormLabel>Logo do Site</FormLabel>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="logo-upload"
                  />
                  <HStack spacing={4}>
                    <Button
                      as="label"
                      htmlFor="logo-upload"
                      colorScheme="blue"
                      isLoading={uploadingLogo}
                    >
                      Upload Logo
                    </Button>
                    {header.logo && (
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={handleLogoDelete}
                        aria-label="Remover logo"
                      />
                    )}
                  </HStack>
                  {header.logo && (
                    <Box mt={2}>
                      <Image
                        src={header.logo}
                        alt="Logo Preview"
                        style={{ maxHeight: '50px' }}
                      />
                    </Box>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Altura do Header</FormLabel>
                  <Select
                    value={header.styles?.height || '80px'}
                    onChange={(e) => handleStyleChange('height', e.target.value)}
                  >
                    <option value="60px">Compacto (60px)</option>
                    <option value="80px">Médio (80px)</option>
                    <option value="100px">Grande (100px)</option>
                  </Select>
                </FormControl>

                <ColorPickerField
                  label="Cor de Fundo"
                  value={header.styles?.backgroundColor || '#FFFFFF'}
                  onChange={(value) => handleStyleChange('backgroundColor', value)}
                  helpText="Cor de fundo do header"
                />

                <ColorPickerField
                  label="Cor do Texto"
                  value={header.styles?.textColor || '#4A5568'}
                  onChange={(value) => handleStyleChange('textColor', value)}
                  helpText="Cor padrão dos textos no header"
                />
              </VStack>
            </Box>

            <Box>
              <VStack align="stretch" spacing={6}>
                <FormControl>
                  <FormLabel>Menu Fixo</FormLabel>
                  <Switch
                    isChecked={header.styles?.isFixed}
                    onChange={(e) => handleStyleChange('isFixed', e.target.checked)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Transparência no Scroll</FormLabel>
                  <Switch
                    isChecked={header.styles?.transparentOnScroll}
                    onChange={(e) => handleStyleChange('transparentOnScroll', e.target.checked)}
                  />
                </FormControl>

                <ColorPickerField
                  label="Cor do Hover"
                  value={header.styles?.hoverColor || '#48BB78'}
                  onChange={(value) => handleStyleChange('hoverColor', value)}
                  helpText="Cor quando o mouse passa sobre os links"
                />
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>

        <Box
          bg={bgCard}
          p={6}
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={6} color="green.500">
            Links de Navegação
          </Heading>

          <VStack spacing={4} align="stretch">
            {header.navLinks.map((link, index) => (
              <HStack key={index} spacing={4}>
                <Input
                  placeholder="Texto do link"
                  value={link.text}
                  onChange={(e) => handleNavLinkChange(index, 'text', e.target.value)}
                />
                <Input
                  placeholder="URL do link"
                  value={link.link}
                  onChange={(e) => handleNavLinkChange(index, 'link', e.target.value)}
                />
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => handleDeleteNavLink(index)}
                  aria-label="Remover link"
                />
              </HStack>
            ))}
            <Button
              leftIcon={<AddIcon />}
              onClick={handleAddNavLink}
              colorScheme="green"
              variant="ghost"
              alignSelf="flex-start"
            >
              Adicionar Link
            </Button>
          </VStack>
        </Box>

        <Box
          bg={bgCard}
          p={6}
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={6} color="green.500">
            Links do Bolão
          </Heading>

          <VStack spacing={4} align="stretch">
            {bolaoLinks.map((link, index) => (
              <HStack key={index} spacing={4}>
                <Input
                  placeholder="Texto do bolão"
                  value={link.text}
                  onChange={(e) => handleBolaoLinkChange(index, 'text', e.target.value)}
                />
                <Input
                  placeholder="URL do bolão"
                  value={link.link}
                  onChange={(e) => handleBolaoLinkChange(index, 'link', e.target.value)}
                />
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => handleDeleteBolaoLink(index)}
                  aria-label="Remover bolão"
                />
              </HStack>
            ))}
            <Button
              leftIcon={<AddIcon />}
              onClick={handleAddBolaoLink}
              colorScheme="green"
              variant="ghost"
              alignSelf="flex-start"
            >
              Adicionar Bolão
            </Button>
          </VStack>
        </Box>

        <Button
          colorScheme="green"
          size="lg"
          onClick={saveToDatabase}
          position="fixed"
          bottom="4"
          right="4"
        >
          Salvar Alterações
        </Button>
      </VStack>

      {showColorPicker && (
        <Box
          position="fixed"
          bottom="20px"
          right="20px"
          bg={bgCard}
          p={4}
          borderRadius="xl"
          boxShadow="lg"
          zIndex={1000}
        >
          <Text mb={2} fontWeight="bold">
            {activeColorField}
          </Text>
          <HexColorPicker
            color={header.styles?.[activeColorField.toLowerCase()] || '#FFFFFF'}
            onChange={(color) => handleStyleChange(activeColorField.toLowerCase(), color)}
          />
        </Box>
      )}
    </PageSection>
  );
};

export default HeaderSection;