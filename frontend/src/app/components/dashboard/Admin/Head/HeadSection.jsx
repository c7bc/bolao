import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Box,
  Grid,
  Text,
  useColorModeValue,
  Icon,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { Globe, Type, Key, Image as ImageIcon } from 'lucide-react';
import PageSection from '../PageSection';
import ImageUpload from '../ImageUpload';

const HeadSection = ({ head, setHead }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconColor = useColorModeValue('green.500', 'green.300');

  return (
    <PageSection>
      <Box
        p={8}
        bg={bgColor}
        borderRadius="xl"
        boxShadow="xl"
        border="1px"
        borderColor={borderColor}
      >
        <VStack spacing={8} align="stretch">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            textAlign="center"
            bgGradient="linear(to-r, green.400, teal.400)"
            bgClip="text"
            mb={4}
          >
            Configurações de SEO e Metadata
          </Text>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            <FormControl isRequired>
              <FormLabel fontWeight="medium">
                <Icon as={Type} className="mr-2" color={iconColor} />
                Título do Site
              </FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Type color={iconColor} />
                </InputLeftElement>
                <Input
                  value={head.title || ''}
                  onChange={(e) => setHead({ ...head, title: e.target.value })}
                  placeholder="Digite o título do site"
                  pl={10}
                  borderRadius="md"
                  _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px green.400' }}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium">
                <Icon as={Key} className="mr-2" color={iconColor} />
                Palavras-chave
              </FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Key color={iconColor} />
                </InputLeftElement>
                <Input
                  value={head.keywords || ''}
                  onChange={(e) => setHead({ ...head, keywords: e.target.value })}
                  placeholder="Palavras-chave separadas por vírgula"
                  pl={10}
                  borderRadius="md"
                  _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px green.400' }}
                />
              </InputGroup>
            </FormControl>
          </Grid>

          <FormControl isRequired>
            <FormLabel fontWeight="medium">
              <Icon as={Globe} className="mr-2" color={iconColor} />
              Descrição
            </FormLabel>
            <Textarea
              value={head.description || ''}
              onChange={(e) => setHead({ ...head, description: e.target.value })}
              placeholder="Digite a descrição do site"
              rows={4}
              borderRadius="md"
              _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px green.400' }}
            />
          </FormControl>

          <Box
            p={6}
            borderRadius="lg"
            bg={useColorModeValue('gray.50', 'gray.700')}
            border="1px dashed"
            borderColor={borderColor}
          >
            <FormControl>
              <FormLabel fontWeight="medium">
                <Icon as={ImageIcon} className="mr-2" color={iconColor} />
                Favicon
              </FormLabel>
              <ImageUpload
                label="Favicon"
                preview={head.favicon}
                onUpload={(url) => setHead({ ...head, favicon: url })}
                accept=".ico,.png,.jpg,.jpeg"
                maxSize={1024 * 1024}
              />
            </FormControl>
          </Box>
        </VStack>
      </Box>
    </PageSection>
  );
};

export default HeadSection;
