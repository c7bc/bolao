import React from 'react';
import { Box, Heading, Text, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Icon, Stack } from '@chakra-ui/react';
import { FaQuestionCircle, FaRegCheckCircle } from 'react-icons/fa';

const faqData = [
  {
    question: "Como funciona o Bolão de Prêmios?",
    answer: "Escolha 10 dezenas entre as dezenas de 00 até a 99 e monte seu jogo com suas 10 melhores dezenas.",
    icon: FaQuestionCircle,
  },
  {
    question: "Eu posso colocar dezenas repetidas no meu bilhete?",
    answer: "Sim, você pode colocar dezenas repetidas até no máximo 3 vezes. Exemplo: 00.11.14.20.40.51.18.23.51.51. Colocamos a dezena 51 três vezes no bilhete, então ela terá que aparecer três vezes nos sorteios.",
    icon: FaRegCheckCircle,
  },
  {
    question: "Quando inicia o Bolão de Prêmios?",
    answer: "Temos o Bolão de Segunda, o de Quarta e o de Sábado.",
    icon: FaQuestionCircle,
  },
  {
    question: "Como eu marco as dezenas do meu bilhete no Bolão de Prêmios?",
    answer: "O Bolão funciona como um Bingo. Toda vez que os resultados dos sorteios saem, você vai pontuando as dezenas que tiver em seu jogo e concorrendo a vários prêmios.",
    icon: FaRegCheckCircle,
  },
  {
    question: "E se eu ganhar algum desses prêmios com 2 ou mais pessoas?",
    answer: "O valor dos prêmios será dividido em partes iguais entre os ganhadores.",
    icon: FaQuestionCircle,
  },
  {
    question: "É seguro o Bolão de Prêmios?",
    answer: "Sim, com certeza! Antes de iniciar o Bolão, publicamos em todos os Grupos do WhatsApp do Bolão de Prêmios uma lista com o nome do apostador, a cidade e as dezenas de todos os participantes.",
    icon: FaRegCheckCircle,
  },
  {
    question: "O que tem nessa lista de participantes?",
    answer: "A lista contém o nome do apostador, a cidade e as 10 dezenas de cada participante do concurso do Bolão de Prêmios.",
    icon: FaQuestionCircle,
  },
  {
    question: "Como eu acompanho o Bolão de Prêmios?",
    answer: "Para acompanhar o Bolão, basta entrar em um dos Grupos do WhatsApp do Bolão de Prêmios ou acessar o site: [www.bolaodepremios.com.br](https://bolaodepremios.com.br/) e clicar na aba de Concursos. Lá, você pode visualizar os detalhes do concurso que está participando.",
    icon: FaRegCheckCircle,
  },
  {
    question: "E como eu entro em um dos grupos do Bolão de Prêmios?",
    answer: "Para entrar é simples, basta entrar em contato pelo WhatsApp ou ligar para o número (75) 9 9809-1153 que colocaremos você no grupo do WhatsApp do Bolão de Prêmios.",
    icon: FaQuestionCircle,
  },
  {
    question: "E quando acaba o concurso do Bolão de Prêmios?",
    answer: "Cada um dos nossos Bolões tem um regulamento específico e um modelo de funcionamento. Acesse nosso grupo e consulte o regulamento para mais detalhes.",
    icon: FaRegCheckCircle,
  },
  {
    question: "Se eu ganhar no Bolão de Prêmios, eu recebo meu prêmio?",
    answer: "Claro que sim! Fazemos questão de pagar o prêmio. Pagamos em dinheiro ou como o ganhador preferir. Sempre que o prêmio for pago, postamos o bilhete do ganhador nos grupos de WhatsApp do Bolão de Prêmios para informar a todos.",
    icon: FaQuestionCircle,
  },
  {
    question: "Como posso tirar uma dúvida que não encontrei aqui?",
    answer: "Basta ir na página de Contato no site: [www.bolaodepremios.com.br](https://bolaodepremios.com.br/), ou então entrar em contato conosco pelo WhatsApp ou por ligação no número (75) 9 9809-1153.",
    icon: FaRegCheckCircle,
  },
];

const FAQ = () => (
  <Box p={6} bg="white" boxShadow="xl" borderRadius="md" maxW="4xl" mx="auto" mb={8}>
    <Heading as="h2" size="xl" color="green.800" mb={6} textAlign="center">
      Perguntas Frequentes
    </Heading>

    <Accordion allowMultiple>
      {faqData.map((item, index) => (
        <AccordionItem key={index} borderBottom="1px solid #e2e8f0">
          <h2>
            <AccordionButton _expanded={{ bg: "green.500", color: "white" }} p={4}>
              <Box flex="1" textAlign="left" fontSize="lg" fontWeight="bold">
                <Icon as={item.icon} color="green.500" boxSize={5} mr={3} />
                {item.question}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text fontSize="md" color="green.700">{item.answer}</Text>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  </Box>
);

export default FAQ;
