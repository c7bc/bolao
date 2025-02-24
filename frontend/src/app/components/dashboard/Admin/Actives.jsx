import React from 'react';
import {
    VStack,
    Radio,
    RadioGroup,
    FormControl,
    FormLabel,
    HStack,
    Box
} from '@chakra-ui/react';
import PageSection from './PageSection';

const ActivesSection = ({ actives, setActives }) => {
    const pages = [
        { label: "Início", path: "/" },
        { label: "Concursos", path: "/concursos" },
        { label: "Perguntas Frequentes", path: "/perguntas-frequentes" },
        { label: "Contatos", path: "/contato" },
        { label: "Bolão", path: "/bolao" }
    ];

    const handleChange = (path, value) => {
        setActives({
            ...actives,
            pages: {
                ...actives.pages,
                [path]: value
            }
        });
    };

    return (
        <PageSection title="Status das Páginas">
            <VStack spacing={4} align="stretch">
                {pages.map((page) => (
                    <Box key={page.path} borderWidth="1px" borderRadius="md" p={4}>
                        <FormControl>
                            <FormLabel>
                                {page.label} ({page.path})
                            </FormLabel>
                            <RadioGroup
                                onChange={(value) => handleChange(page.path, value)}
                                value={actives.pages[page.path] || 'active'}
                            >
                                <HStack spacing="24px">
                                    <Radio value="active">Ativo</Radio>
                                    <Radio value="maintenance">Manutenção</Radio>
                                    <Radio value="inactive">Inativo</Radio>
                                </HStack>
                            </RadioGroup>
                        </FormControl>
                    </Box>
                ))}
            </VStack>
        </PageSection>
    );
};

export default ActivesSection;