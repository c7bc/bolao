import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Grid,
  GridItem,
  IconButton,
  useToast,
  Card,
  CardBody,
  Heading,
  Textarea
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';

const PageSection = ({ title, children }) => (
  <Box mb={8}>
    <Heading size="md" mb={4} color="green.700">{title}</Heading>
    {children}
  </Box>
);

const ImageUpload = ({ onUpload, preview, label }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Here you would implement S3 upload
      const imageUrl = await uploadToS3(file);
      onUpload(imageUrl);
    }
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        display="none"
        id={`file-${label}`}
      />
      <Button
        as="label"
        htmlFor={`file-${label}`}
        cursor="pointer"
        colorScheme="green"
      >
        Upload Image
      </Button>
      {preview && (
        <Box mt={2}>
          <Image src={preview} alt="Preview" maxH="100px" />
        </Box>
      )}
    </FormControl>
  );
};

const PersonalizationComponent = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  
  // Common Elements State
  const [head, setHead] = useState({
    title: '',
    description: '',
    keywords: '',
    favicon: ''
  });

  const [header, setHeader] = useState({
    logo: '',
    navLinks: [
      { text: 'Início', link: '/' },
      { text: 'Concursos', link: '/concursos' },
      { text: 'Perguntas Frequentes', link: '/perguntas-frequentes' },
      { text: 'Contatos', link: '/contato' }
    ]
  });

  // Home Page State
  const [hero, setHero] = useState({
    slides: [
      { image: '', title: '', subtitle: '', ctaText: '', ctaLink: '' },
      { image: '', title: '', subtitle: '', ctaText: '', ctaLink: '' },
      { image: '', title: '', subtitle: '', ctaText: '', ctaLink: '' }
    ]
  });

  const [statistics, setStatistics] = useState({
    sections: [
      { title: '', subtitle: '' },
      { title: '', subtitle: '' },
      { title: '', subtitle: '' },
      { title: '', subtitle: '' }
    ]
  });

  const [howToPlay, setHowToPlay] = useState({
    title: '',
    cards: [
      { title: '', subtitle: '', buttonText: '', buttonLink: '' },
      { title: '', subtitle: '', buttonText: '', buttonLink: '' },
      { title: '', subtitle: '', buttonText: '', buttonLink: '' }
    ]
  });

  const [aboutUs, setAboutUs] = useState({
    title: '',
    subtitle: ''
  });

  // Footer State
  const [footer, setFooter] = useState({
    logo: '',
    links: [],
    socialMedia: [],
    phone: '',
    copyright: ''
  });

  const handleSave = async () => {
    try {
      // Here you would implement DynamoDB save
      await saveToDynamoDB({
        head,
        header,
        hero,
        statistics,
        howToPlay,
        aboutUs,
        footer
      });

      toast({
        title: 'Configurações salvas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Tabs onChange={setActiveTab} colorScheme="green">
        <TabList>
          <Tab>Head</Tab>
          <Tab>Header</Tab>
          <Tab>Home</Tab>
          <Tab>Footer</Tab>
        </TabList>

        <TabPanels>
          {/* Head Configuration */}
          <TabPanel>
            <PageSection title="Configurações do Head">
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Título do Site</FormLabel>
                  <Input
                    value={head.title}
                    onChange={(e) => setHead({...head, title: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    value={head.description}
                    onChange={(e) => setHead({...head, description: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Palavras-chave</FormLabel>
                  <Input
                    value={head.keywords}
                    onChange={(e) => setHead({...head, keywords: e.target.value})}
                  />
                </FormControl>
                <ImageUpload
                  label="Favicon"
                  preview={head.favicon}
                  onUpload={(url) => setHead({...head, favicon: url})}
                />
              </VStack>
            </PageSection>
          </TabPanel>

          {/* Header Configuration */}
          <TabPanel>
            <PageSection title="Configurações do Header">
              <VStack spacing={4} align="stretch">
                <ImageUpload
                  label="Logo"
                  preview={header.logo}
                  onUpload={(url) => setHeader({...header, logo: url})}
                />
                <Box>
                  <Heading size="sm" mb={2}>Links de Navegação</Heading>
                  {header.navLinks.map((link, index) => (
                    <HStack key={index} mb={2}>
                      <Input
                        placeholder="Texto"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...header.navLinks];
                          newLinks[index].text = e.target.value;
                          setHeader({...header, navLinks: newLinks});
                        }}
                      />
                      <Input
                        placeholder="Link"
                        value={link.link}
                        onChange={(e) => {
                          const newLinks = [...header.navLinks];
                          newLinks[index].link = e.target.value;
                          setHeader({...header, navLinks: newLinks});
                        }}
                      />
                    </HStack>
                  ))}
                </Box>
              </VStack>
            </PageSection>
          </TabPanel>

          {/* Home Page Configuration */}
          <TabPanel>
            <PageSection title="Hero Section">
              {hero.slides.map((slide, index) => (
                <Card key={index} mb={4}>
                  <CardBody>
                    <VStack spacing={4}>
                      <ImageUpload
                        label={`Slide ${index + 1}`}
                        preview={slide.image}
                        onUpload={(url) => {
                          const newSlides = [...hero.slides];
                          newSlides[index].image = url;
                          setHero({...hero, slides: newSlides});
                        }}
                      />
                      <Input
                        placeholder="Título"
                        value={slide.title}
                        onChange={(e) => {
                          const newSlides = [...hero.slides];
                          newSlides[index].title = e.target.value;
                          setHero({...hero, slides: newSlides});
                        }}
                      />
                      <Input
                        placeholder="Subtítulo"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const newSlides = [...hero.slides];
                          newSlides[index].subtitle = e.target.value;
                          setHero({...hero, slides: newSlides});
                        }}
                      />
                      <Input
                        placeholder="Texto do CTA"
                        value={slide.ctaText}
                        onChange={(e) => {
                          const newSlides = [...hero.slides];
                          newSlides[index].ctaText = e.target.value;
                          setHero({...hero, slides: newSlides});
                        }}
                      />
                      <Input
                        placeholder="Link do CTA"
                        value={slide.ctaLink}
                        onChange={(e) => {
                          const newSlides = [...hero.slides];
                          newSlides[index].ctaLink = e.target.value;
                          setHero({...hero, slides: newSlides});
                        }}
                      />
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </PageSection>

            <PageSection title="Nossos Números">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {statistics.sections.map((section, index) => (
                  <GridItem key={index}>
                    <VStack spacing={4}>
                      <Input
                        placeholder="Título"
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...statistics.sections];
                          newSections[index].title = e.target.value;
                          setStatistics({...statistics, sections: newSections});
                        }}
                      />
                      <Input
                        placeholder="Subtítulo"
                        value={section.subtitle}
                        onChange={(e) => {
                          const newSections = [...statistics.sections];
                          newSections[index].subtitle = e.target.value;
                          setStatistics({...statistics, sections: newSections});
                        }}
                      />
                    </VStack>
                  </GridItem>
                ))}
              </Grid>
            </PageSection>

            <PageSection title="Como Jogar">
              <Input
                placeholder="Título da Seção"
                value={howToPlay.title}
                onChange={(e) => setHowToPlay({...howToPlay, title: e.target.value})}
                mb={4}
              />
              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                {howToPlay.cards.map((card, index) => (
                  <GridItem key={index}>
                    <VStack spacing={4}>
                      <Input
                        placeholder="Título"
                        value={card.title}
                        onChange={(e) => {
                          const newCards = [...howToPlay.cards];
                          newCards[index].title = e.target.value;
                          setHowToPlay({...howToPlay, cards: newCards});
                        }}
                      />
                      <Input
                        placeholder="Subtítulo"
                        value={card.subtitle}
                        onChange={(e) => {
                          const newCards = [...howToPlay.cards];
                          newCards[index].subtitle = e.target.value;
                          setHowToPlay({...howToPlay, cards: newCards});
                        }}
                      />
                      <Input
                        placeholder="Texto do Botão"
                        value={card.buttonText}
                        onChange={(e) => {
                          const newCards = [...howToPlay.cards];
                          newCards[index].buttonText = e.target.value;
                          setHowToPlay({...howToPlay, cards: newCards});
                        }}
                      />
                      <Input
                        placeholder="Link do Botão"
                        value={card.buttonLink}
                        onChange={(e) => {
                          const newCards = [...howToPlay.cards];
                          newCards[index].buttonLink = e.target.value;
                          setHowToPlay({...howToPlay, cards: newCards});
                        }}
                      />
                    </VStack>
                  </GridItem>
                ))}
              </Grid>
            </PageSection>

            <PageSection title="Sobre Nós">
              <VStack spacing={4}>
                <Input
                  placeholder="Título"
                  value={aboutUs.title}
                  onChange={(e) => setAboutUs({...aboutUs, title: e.target.value})}
                />
                <Textarea
                  placeholder="Subtítulo"
                  value={aboutUs.subtitle}
                  onChange={(e) => setAboutUs({...aboutUs, subtitle: e.target.value})}
                />
              </VStack>
            </PageSection>
          </TabPanel>

          {/* Footer Configuration */}
          <TabPanel>
            <PageSection title="Configurações do Footer">
              <VStack spacing={4} align="stretch">
                <ImageUpload
                  label="Logo do Footer"
                  preview={footer.logo}
                  onUpload={(url) => setFooter({...footer, logo: url})}
                />
                <FormControl>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={footer.phone}
                    onChange={(e) => setFooter({...footer, phone: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Texto de Copyright</FormLabel>
                  <Input
                    value={footer.copyright}
                    onChange={(e) => setFooter({...footer, copyright: e.target.value})}
                  />
                </FormControl>
                
                <Box>
                  <Heading size="sm" mb={2}>Links do Footer</Heading>
                  {footer.links.map((link, index) => (
                    <HStack key={index} mb={2}>
                      <Input
                        placeholder="Texto"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...footer.links];
                          newLinks[index].text = e.target.value;
                          setFooter({...footer, links: newLinks});
                        }}
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...footer.links];
                          newLinks[index].url = e.target.value;
                          setFooter({...footer, links: newLinks});
                        }}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => {
                          const newLinks = footer.links.filter((_, i) => i !== index);
                          setFooter({...footer, links: newLinks});
                        }}
                      />
                    </HStack>
                  ))}
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={() => {
                      setFooter({
                        ...footer,
                        links: [...footer.links, { text: '', url: '' }]
                      });
                    }}
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
                        placeholder="Plataforma"
                        value={social.platform}
                        onChange={(e) => {
                          const newSocial = [...footer.socialMedia];
                          newSocial[index].platform = e.target.value;
                          setFooter({...footer, socialMedia: newSocial});
                        }}
                      />
                      <Input
                        placeholder="URL"
                        value={social.url}
                        onChange={(e) => {
                          const newSocial = [...footer.socialMedia];
                          newSocial[index].url = e.target.value;
                          setFooter({...footer, socialMedia: newSocial});
                        }}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => {
                          const newSocial = footer.socialMedia.filter((_, i) => i !== index);
                          setFooter({...footer, socialMedia: newSocial});
                        }}
                      />
                    </HStack>
                  ))}
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={() => {
                      setFooter({
                        ...footer,
                        socialMedia: [...footer.socialMedia, { platform: '', url: '' }]
                      });
                    }}
                    colorScheme="green"
                    size="sm"
                    mt={2}
                  >
                    Adicionar Rede Social
                  </Button>
                </Box>
              </VStack>
            </PageSection>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Button
        colorScheme="green"
        size="lg"
        position="fixed"
        bottom="4"
        right="4"
        onClick={handleSave}
      >
        Salvar Alterações
      </Button>
    </Container>
  );
};

// Helper functions for S3 and DynamoDB integration
const uploadToS3 = async (file) => {
  // Implement S3 upload logic here
  // Return the uploaded file URL
};

const saveToDynamoDB = async (data) => {
  // Implement DynamoDB save logic here
};

export default PersonalizationComponent;