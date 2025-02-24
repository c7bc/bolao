import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Button,
    useToast,
} from '@chakra-ui/react';
import HeadSection from './Head/HeadSection';
import HeaderSection from './Header/HeaderSection';
import HomeSection from './Home/HomeSection';
import FooterSection from './Footer/FooterSection';
import FAQSection from './FAQ/FAQSection';
import ContactSection from './Contact/ContactSection';
import IntegrationSection from './Integration/IntegrationSection';
import ActivesSection from './Actives';
import axios from 'axios';

const PersonalizationComponent = () => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);

    // Estados para todas as seções
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

    const [hero, setHero] = useState({
        slides: [
            { image: '', showTitle: false, title: '', showSubtitle: false, subtitle: '', showCta: false, ctaText: '', ctaLink: '' }
        ]
    });

    const [statistics, setStatistics] = useState({
        sections: [
            { icon: '', title: '', subtitle: '' },
            { icon: '', title: '', subtitle: '' },
            { icon: '', title: '', subtitle: '' },
            { icon: '', title: '', subtitle: '' }
        ]
    });

    const [howToPlay, setHowToPlay] = useState({
        title: '',
        cards: [
            { title: '', subtitle: '' },
            { title: '', subtitle: '' },
            { title: '', subtitle: '' }
        ],
        buttonText: '',
        buttonLink: ''
    });

    const [aboutUs, setAboutUs] = useState({
        title: '',
        subtitle: ''
    });

    const [footer, setFooter] = useState({
        logo: '',
        links: [],
        socialMedia: [],
        phone: '',
        copyright: ''
    });

    const [faq, setFaq] = useState({
        title: 'Perguntas Frequentes',
        items: []
    });

    const [contact, setContact] = useState({
        title: 'Nossos Contatos',
        whatsappTitle: 'Mande um WhatsApp',
        whatsappDescription: 'Clique no botão verde e fale diretamente conosco pelo WhatsApp!',
        whatsappLinks: [
            { label: 'WhatsApp 1', url: 'https://wa.me/5575998091153' },
            { label: 'WhatsApp 2', url: 'https://wa.me/5575998091153' }
        ],
        officialChannelsTitle: 'Nossos Canais Oficiais',
        officialChannels: [
            { label: 'Instagram', url: 'https://www.instagram.com', icon: 'FaInstagram' },
            { label: 'Telegram', url: 'https://t.me', icon: 'FaTelegram' }
        ],
        customerServiceNotice: 'Somente esse número é o nosso contato de Atendimento ao Cliente',
        customerServicePhone: '(75) 9 9809-1153'
    });

    const [integration, setIntegration] = useState({
        EFI_API_URL: '',
        EFI_API_KEY: '',
        EFI_WEBHOOK_SECRET: ''
    });

    // Aqui definimos o status para cada página individualmente.
    const [actives, setActives] = useState({
        pages: {
            "/": "active",
            "/concursos": "active",
            "/perguntas-frequentes": "active",
            "/contato": "active",
            "/bolao": "active"
        }
    });

    const fetchData = useCallback(async () => {
        try {
            const response = await axios.get('/api/save');
            if (response.data) {
                const {
                    head: savedHead,
                    header: savedHeader,
                    hero: savedHero,
                    statistics: savedStatistics,
                    howToPlay: savedHowToPlay,
                    aboutUs: savedAboutUs,
                    footer: savedFooter,
                    faq: savedFaq,
                    contact: savedContact,
                    integration: savedIntegration,
                    actives: savedActives
                } = response.data;

                if (savedHead) setHead(savedHead);
                if (savedHeader) setHeader(savedHeader);
                if (savedHero) setHero(savedHero);
                if (savedStatistics) setStatistics(savedStatistics);
                if (savedHowToPlay) setHowToPlay(savedHowToPlay);
                if (savedAboutUs) setAboutUs(savedAboutUs);
                if (savedFooter) setFooter(savedFooter);
                if (savedFaq) setFaq(savedFaq);
                if (savedContact) setContact(savedContact);
                if (savedIntegration) setIntegration(savedIntegration);
                if (savedActives) setActives(savedActives);
            }
        } catch (error) {
            toast({
                title: 'Erro ao carregar configurações',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const data = {
                head,
                header,
                hero,
                statistics,
                howToPlay,
                aboutUs,
                footer,
                faq,
                contact,
                integration,
                actives
            };

            const response = await axios.post('/api/save', data);

            if (response.status === 200) {
                toast({
                    title: 'Configurações salvas',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error('Falha ao salvar as configurações');
            }
        } catch (error) {
            toast({
                title: 'Erro ao salvar',
                description: error.response?.data?.message || error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
            <Tabs onChange={(index) => setActiveTab(index)} colorScheme="green" isLazy>
                <TabList
                    overflowX="auto"
                    whiteSpace="nowrap"
                    pb={2}
                    sx={{
                        '&::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }}
                >
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Head</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Header</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Home</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>FAQ</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Contatos</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Footer</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Integração</Tab>
                    <Tab fontSize={{ base: 'sm', md: 'md' }}>Status</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel px={0}>
                        <HeadSection head={head} setHead={setHead} />
                    </TabPanel>

                    <TabPanel px={0}>
                        <HeaderSection header={header} setHeader={setHeader} />
                    </TabPanel>

                    <TabPanel px={0}>
                        <HomeSection
                            hero={hero}
                            setHero={setHero}
                            statistics={statistics}
                            setStatistics={setStatistics}
                            howToPlay={howToPlay}
                            setHowToPlay={setHowToPlay}
                            aboutUs={aboutUs}
                            setAboutUs={setAboutUs}
                        />
                    </TabPanel>

                    <TabPanel px={0}>
                        <FAQSection faq={faq} setFaq={setFaq} />
                    </TabPanel>

                    <TabPanel px={0}>
                        <ContactSection contact={contact} setContact={setContact} />
                    </TabPanel>

                    <TabPanel px={0}>
                        <FooterSection footer={footer} setFooter={setFooter} />
                    </TabPanel>

                    <TabPanel px={0}>
                        <IntegrationSection integration={integration} setIntegration={setIntegration} />
                    </TabPanel>

                    <TabPanel px={0}>
                        <ActivesSection actives={actives} setActives={setActives} />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <Button
                colorScheme="green"
                size={{ base: 'md', md: 'lg' }}
                position="fixed"
                bottom={{ base: 4, md: 8 }}
                right={{ base: 4, md: 8 }}
                onClick={handleSave}
                isLoading={loading}
                loadingText="Salvando..."
                zIndex="sticky"
                boxShadow="lg"
            >
                Salvar Alterações
            </Button>
        </Container>
    );
};

export default PersonalizationComponent;