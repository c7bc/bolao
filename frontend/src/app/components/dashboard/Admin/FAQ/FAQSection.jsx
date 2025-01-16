// src/app/components/dashboard/Admin/FAQ/FAQSection.jsx
import React from 'react';
import {
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  IconButton,
  Textarea
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import PageSection from '../PageSection';

const FAQSection = ({ faq, setFaq }) => {
  const handleQuestionChange = (index, field, value) => {
    const newItems = [...faq.items];
    newItems[index][field] = value;
    setFaq({ ...faq, items: newItems });
  };

  const handleAddQuestion = () => {
    setFaq({
      ...faq,
      items: [...faq.items, { question: '', answer: '', icon: '' }]
    });
  };

  const handleDeleteQuestion = (index) => {
    const newItems = faq.items.filter((_, i) => i !== index);
    setFaq({ ...faq, items: newItems });
  };

  return (
    <PageSection title="Configurações do FAQ">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Título da Seção FAQ</FormLabel>
          <Input
            placeholder="Título da Seção (ex: Perguntas Frequentes)"
            value={faq.title}
            onChange={(e) => setFaq({ ...faq, title: e.target.value })}
          />
        </FormControl>

        <Heading size="sm" mb={2}>Perguntas</Heading>
        {faq.items.map((item, index) => (
          <VStack key={index} spacing={2} align="stretch" borderWidth={1} p={4} borderRadius="md">
            <FormControl>
              <FormLabel>Pergunta</FormLabel>
              <Input
                placeholder="Pergunta"
                value={item.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Resposta</FormLabel>
              <Textarea
                placeholder="Resposta"
                value={item.answer}
                onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Ícone (ex: FaQuestionCircle ou FaRegCheckCircle)</FormLabel>
              <Input
                placeholder="Ícone"
                value={item.icon || ''}
                onChange={(e) => handleQuestionChange(index, 'icon', e.target.value)}
              />
            </FormControl>
            <HStack justify="flex-end">
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                onClick={() => handleDeleteQuestion(index)}
                aria-label="Remover pergunta"
                size="sm"
              />
            </HStack>
          </VStack>
        ))}

        <Button
          leftIcon={<AddIcon />}
          onClick={handleAddQuestion}
          colorScheme="green"
          size="sm"
          mt={2}
        >
          Adicionar Pergunta
        </Button>
      </VStack>
    </PageSection>
  );
};

export default FAQSection;
