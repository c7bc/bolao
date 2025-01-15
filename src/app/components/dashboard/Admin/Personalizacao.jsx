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
import ContactSection from './Contact/ContactSection'; // Importamos o componente ContactSection
import axios from 'axios';

const PersonalizationComponent = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
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

  // Novo estado para Contatos
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
          contact: savedContact
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
        contact
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
    <Container maxW="container.xl" py={8}>
      <Tabs onChange={(index) => setActiveTab(index)} colorScheme="green">
        <TabList>
          <Tab>Head</Tab>
          <Tab>Header</Tab>
          <Tab>Home</Tab>
          <Tab>FAQ</Tab>
          <Tab>Contatos</Tab>
          <Tab>Footer</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <HeadSection head={head} setHead={setHead} />
          </TabPanel>

          <TabPanel>
            <HeaderSection header={header} setHeader={setHeader} />
          </TabPanel>

          <TabPanel>
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

          <TabPanel>
            <FAQSection faq={faq} setFaq={setFaq} />
          </TabPanel>

          <TabPanel>
            <ContactSection contact={contact} setContact={setContact} />
          </TabPanel>

          <TabPanel>
            <FooterSection footer={footer} setFooter={setFooter} />
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
        isLoading={loading}
        loadingText="Salvando..."
      >
        Salvar Alterações
      </Button>
    </Container>
  );
};

export default PersonalizationComponent;
