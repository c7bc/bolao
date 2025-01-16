// components/home/HomeSection.jsx
import React from 'react';
import {
  VStack,
  Grid,
  GridItem,
  Input,
  Button,
  Card,
  CardBody,
  Heading,
  Textarea,
  FormControl,
  FormLabel,
  Box,
  Checkbox,
  Stack,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import PageSection from '../PageSection';
import ImageUpload from '../ImageUpload';

const DEFAULT_SLIDE = {
  image: '',
  showTitle: false,
  title: '',
  showSubtitle: false,
  subtitle: '',
  showCta: false,
  ctaText: '',
  ctaLink: ''
};

const HomeSection = ({
  hero,
  setHero,
  statistics,
  setStatistics,
  howToPlay,
  setHowToPlay,
  aboutUs,
  setAboutUs,
}) => {
  const toast = useToast();

  const addSlide = () => {
    setHero(prev => ({
      ...prev,
      slides: [...prev.slides, { ...DEFAULT_SLIDE }]
    }));
  };

  const removeSlide = (index) => {
    setHero(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
  };

  const handleSlideChange = (index, field, value) => {
    const newSlides = [...hero.slides];
    newSlides[index] = {
      ...newSlides[index],
      [field]: value
    };
    setHero({ ...hero, slides: newSlides });
  };

  const handleStatisticsChange = (index, field, value) => {
    const newSections = [...statistics.sections];
    newSections[index][field] = value;
    setStatistics({ ...statistics, sections: newSections });
  };

  const handleHowToPlayChange = (index, field, value) => {
    const newCards = [...howToPlay.cards];
    newCards[index][field] = value;
    setHowToPlay({ ...howToPlay, cards: newCards });
  };

  return (
    <>
      <PageSection title="Hero Section">
        <Box mb={4}>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={addSlide}
          >
            Adicionar Novo Slide
          </Button>
        </Box>

        {hero.slides.map((slide, index) => (
          <Card key={index} mb={4}>
            <CardBody>
              <Stack spacing={4}>
                <Heading size="sm" mb={2}>
                  Slide {index + 1}
                  <IconButton
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="sm"
                    ml={2}
                    onClick={() => removeSlide(index)}
                    isDisabled={hero.slides.length === 1}
                    aria-label="Remove slide"
                  />
                </Heading>

                <ImageUpload
                  label={`Imagem do Slide ${index + 1}`}
                  preview={slide.image}
                  onUpload={(url) => handleSlideChange(index, 'image', url)}
                />

                <FormControl>
                  <Checkbox
                    isChecked={slide.showTitle}
                    onChange={(e) => handleSlideChange(index, 'showTitle', e.target.checked)}
                  >
                    Incluir Título
                  </Checkbox>
                </FormControl>

                {slide.showTitle && (
                  <FormControl>
                    <FormLabel>Título</FormLabel>
                    <Input
                      placeholder="Título"
                      value={slide.title}
                      onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                    />
                  </FormControl>
                )}

                <FormControl>
                  <Checkbox
                    isChecked={slide.showSubtitle}
                    onChange={(e) => handleSlideChange(index, 'showSubtitle', e.target.checked)}
                  >
                    Incluir Subtítulo
                  </Checkbox>
                </FormControl>

                {slide.showSubtitle && (
                  <FormControl>
                    <FormLabel>Subtítulo</FormLabel>
                    <Input
                      placeholder="Subtítulo"
                      value={slide.subtitle}
                      onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                    />
                  </FormControl>
                )}

                <FormControl>
                  <Checkbox
                    isChecked={slide.showCta}
                    onChange={(e) => handleSlideChange(index, 'showCta', e.target.checked)}
                  >
                    Incluir Botão CTA
                  </Checkbox>
                </FormControl>

                {slide.showCta && (
                  <>
                    <FormControl>
                      <FormLabel>Texto do CTA</FormLabel>
                      <Input
                        placeholder="Texto do botão"
                        value={slide.ctaText}
                        onChange={(e) => handleSlideChange(index, 'ctaText', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Link do CTA</FormLabel>
                      <Input
                        placeholder="URL do botão"
                        value={slide.ctaLink}
                        onChange={(e) => handleSlideChange(index, 'ctaLink', e.target.value)}
                      />
                    </FormControl>
                  </>
                )}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </PageSection>

      <PageSection title="Nossos Números">
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          {statistics.sections.map((section, index) => (
            <GridItem key={index}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Ícone (ex: MdPerson)</FormLabel>
                  <Input
                    placeholder="Ícone"
                    value={section.icon || ''}
                    onChange={(e) => handleStatisticsChange(index, 'icon', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Título (ex: +100 mil)</FormLabel>
                  <Input
                    placeholder="Título"
                    value={section.title}
                    onChange={(e) => handleStatisticsChange(index, 'title', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Subtítulo (ex: Prêmios toda semana)</FormLabel>
                  <Input
                    placeholder="Subtítulo"
                    value={section.subtitle}
                    onChange={(e) => handleStatisticsChange(index, 'subtitle', e.target.value)}
                  />
                </FormControl>
              </VStack>
            </GridItem>
          ))}
        </Grid>
      </PageSection>

      <PageSection title="Como Jogar">
        <FormControl mb={4}>
          <FormLabel>Título da Seção</FormLabel>
          <Input
            placeholder="Título da Seção"
            value={howToPlay.title}
            onChange={(e) => setHowToPlay({ ...howToPlay, title: e.target.value })}
          />
        </FormControl>

        {/* Três cards, cada um com título e subtítulo */}
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          {howToPlay.cards.map((card, index) => (
            <GridItem key={index}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Título</FormLabel>
                  <Input
                    placeholder="Título"
                    value={card.title}
                    onChange={(e) => handleHowToPlayChange(index, 'title', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Subtítulo</FormLabel>
                  <Input
                    placeholder="Subtítulo"
                    value={card.subtitle}
                    onChange={(e) => handleHowToPlayChange(index, 'subtitle', e.target.value)}
                  />
                </FormControl>
              </VStack>
            </GridItem>
          ))}
        </Grid>

        {/* Um único botão para toda a seção Como Jogar */}
        <Box mt={4}>
          <FormControl>
            <FormLabel>Texto do Botão</FormLabel>
            <Input
              placeholder="Texto do Botão"
              value={howToPlay.buttonText || ''}
              onChange={(e) => setHowToPlay({ ...howToPlay, buttonText: e.target.value })}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Link do Botão</FormLabel>
            <Input
              placeholder="Link do Botão"
              value={howToPlay.buttonLink || ''}
              onChange={(e) => setHowToPlay({ ...howToPlay, buttonLink: e.target.value })}
            />
          </FormControl>
        </Box>
      </PageSection>

      <PageSection title="Sobre Nós">
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Título</FormLabel>
            <Input
              placeholder="Título"
              value={aboutUs.title}
              onChange={(e) => setAboutUs({ ...aboutUs, title: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Subtítulo</FormLabel>
            <Textarea
              placeholder="Subtítulo"
              value={aboutUs.subtitle}
              onChange={(e) => setAboutUs({ ...aboutUs, subtitle: e.target.value })}
            />
          </FormControl>
        </VStack>
      </PageSection>
    </>
  );
};

export default HomeSection;
