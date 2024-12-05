// components/home/HomeSection.js
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
} from '@chakra-ui/react';
import PageSection from '../PageSection';
import ImageUpload from '../ImageUpload';

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
  const handleSlideChange = (index, field, value) => {
    const newSlides = [...hero.slides];
    newSlides[index][field] = value;
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
        {hero.slides.map((slide, index) => (
          <Card key={index} mb={4}>
            <CardBody>
              <VStack spacing={4}>
                <ImageUpload
                  label={`Slide ${index + 1}`}
                  preview={slide.image}
                  onUpload={(url) => handleSlideChange(index, 'image', url)}
                />
                <FormControl>
                  <FormLabel>Título</FormLabel>
                  <Input
                    placeholder="Título"
                    value={slide.title}
                    onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Subtítulo</FormLabel>
                  <Input
                    placeholder="Subtítulo"
                    value={slide.subtitle}
                    onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Texto do CTA</FormLabel>
                  <Input
                    placeholder="Texto do CTA"
                    value={slide.ctaText}
                    onChange={(e) => handleSlideChange(index, 'ctaText', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Link do CTA</FormLabel>
                  <Input
                    placeholder="Link do CTA"
                    value={slide.ctaLink}
                    onChange={(e) => handleSlideChange(index, 'ctaLink', e.target.value)}
                  />
                </FormControl>
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
                <FormControl>
                  <FormLabel>Título</FormLabel>
                  <Input
                    placeholder="Título"
                    value={section.title}
                    onChange={(e) => handleStatisticsChange(index, 'title', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Subtítulo</FormLabel>
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
                <FormControl>
                  <FormLabel>Texto do Botão</FormLabel>
                  <Input
                    placeholder="Texto do Botão"
                    value={card.buttonText}
                    onChange={(e) => handleHowToPlayChange(index, 'buttonText', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Link do Botão</FormLabel>
                  <Input
                    placeholder="Link do Botão"
                    value={card.buttonLink}
                    onChange={(e) => handleHowToPlayChange(index, 'buttonLink', e.target.value)}
                  />
                </FormControl>
              </VStack>
            </GridItem>
          ))}
        </Grid>
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
