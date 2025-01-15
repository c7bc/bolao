// src/app/components/dashboard/Admin/GameFormModal.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Switch,
  useToast,
  NumberInput,
  NumberInputField,
  Textarea,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  FormHelperText,
} from "@chakra-ui/react";
import axios from "axios";
import slugify from "slugify";

const GameFormModal = ({ isOpen, onClose, refreshList }) => {
  const [gameTypes, setGameTypes] = useState([]);
  const [rateioConfig, setRateioConfig] = useState(null);
  const [formData, setFormData] = useState({
    jog_nome: "",
    slug: "",
    visibleInConcursos: true,
    jog_tipodojogo: "", // Alinhado com o backend
    data_inicio: "",
    data_fim: "",
    valorBilhete: "", // Alinhado com o backend
    ativo: true,
    descricao: "",
    numeroInicial: "",
    numeroFinal: "",
    pontosPorAcerto: "",
    numeroPalpites: "",
    status: "aberto",
  });
  const [premiationActive, setPremiationActive] = useState(false);
  const [fixedPremiation, setFixedPremiation] = useState({
    campeao: "",
    vice: "",
    ultimoColocado: "",
    custosAdministrativos: "",
  });
  const [pointPrizes, setPointPrizes] = useState([]);
  const toast = useToast();
  const [rateio, setRateio] = useState({
    rateio_10_pontos: "",
    rateio_9_pontos: "",
    rateio_menos_pontos: "",
    custos_administrativos: "",
  });

  const fetchRateio = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Token não encontrado",
          description: "Por favor, faça login novamente.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      const [configResponse, gameTypesResponse] = await Promise.all([
        axios.get("/api/configuracoes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get("/api/game-types/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (configResponse.data.configuracoes) {
        setRateio({
          rateio_10_pontos:
            parseFloat(configResponse.data.configuracoes.rateio_10_pontos) ||
            "",
          rateio_9_pontos:
            parseFloat(configResponse.data.configuracoes.rateio_9_pontos) || "",
          rateio_menos_pontos:
            parseFloat(configResponse.data.configuracoes.rateio_menos_pontos) ||
            "",
          custos_administrativos:
            parseFloat(
              configResponse.data.configuracoes.custos_administrativos
            ) || "",
        });
      } else {
        setRateio({
          rateio_10_pontos: "",
          rateio_9_pontos: "",
          rateio_menos_pontos: "",
          custos_administrativos: "",
        });
      }

      setGameTypes(gameTypesResponse.data.gameTypes);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error.response?.data?.error ||
          "Não foi possível carregar as configurações de rateio.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Calcular a soma das porcentagens fixas
  const totalFixedPercentage = Object.values(fixedPremiation).reduce(
    (acc, val) => acc + (parseFloat(val) || 0),
    0
  );

  // Função para buscar tipos de jogos e rateio de configurações
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Token não encontrado.",
            description: "Por favor, faça login novamente.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const [gameTypesResponse, configuracoesResponse] = await Promise.all([
          axios.get("/api/game-types/list", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get("/api/configuracoes", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setGameTypes(gameTypesResponse.data.gameTypes);

        // Configurando rateioConfig e fixedPremiation
        const config = configuracoesResponse.data.configuracoes || {};
        setRateioConfig(config);
        setFixedPremiation({
          campeao: config.rateio_10_pontos || "",
          vice: config.rateio_9_pontos || "",
          ultimoColocado: config.rateio_menos_pontos || "",
          custosAdministrativos: config.custos_administrativos || "",
        });
      } catch (error) {
        toast({
          title: "Erro ao buscar dados.",
          description: error.response?.data?.error || "Erro desconhecido.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (isOpen) {
      fetchData();

      // Resetar o formulário ao abrir o modal
      setFormData({
        jog_nome: "",
        slug: "",
        visibleInConcursos: true,
        jog_tipodojogo: "", // Alinhado com o backend
        data_inicio: "",
        data_fim: "",
        valorBilhete: "",
        ativo: true,
        descricao: "",
        numeroInicial: "",
        numeroFinal: "",
        pontosPorAcerto: "",
        numeroPalpites: "",
        status: "aberto",
      });

      setPremiationActive(false);
      setPointPrizes([]);
    }
  }, [isOpen, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Função para verificar unicidade do slug
  const isSlugUnique = async (slug) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/jogos/list?slug=${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.jogos.length === 0) return true;
      return false;
    } catch (error) {
      return false;
    }
  };

  // Função para gerar um slug único baseado no nome
  const generateUniqueSlug = async (name) => {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (!(await isSlugUnique(uniqueSlug))) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    return uniqueSlug;
  };

  const handleSubmit = async () => {
    try {
      // Validações adicionais no frontend
      const requiredFields = [
        "jog_nome",
        "jog_tipodojogo", // Alinhado com o backend
        "data_inicio",
        "data_fim",
        "valorBilhete", // Alinhado com o backend
        "descricao",
        "pontosPorAcerto",
        "numeroPalpites",
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        toast({
          title: "Campos obrigatórios faltando.",
          description: `Por favor, preencha todos os campos obrigatórios: ${missingFields.join(
            ", "
          )}.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Se a premiação fixa estiver ativa, validar a soma das porcentagens
      let totalFixedPercentage = 0;
      if (!premiationActive) {
        totalFixedPercentage = Object.values(fixedPremiation).reduce(
          (acc, val) => acc + (parseFloat(val) || 0),
          0
        );
        if (totalFixedPercentage !== 100) {
          toast({
            title: "Distribuição inválida.",
            description: "A soma das porcentagens deve ser igual a 100%.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }

      // Verificar se o slug é único
      let finalSlug = formData.slug
        ? slugify(formData.slug, { lower: true, strict: true })
        : slugify(formData.jog_nome, { lower: true, strict: true });
      if (!(await isSlugUnique(finalSlug))) {
        finalSlug = await generateUniqueSlug(formData.jog_nome);
        toast({
          title: "Slug duplicado.",
          description: `O slug foi atualizado para ${finalSlug}.`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }

      // Converter datas para ISO 8601 completo
      const dataInicioISO = formData.data_inicio
        ? new Date(formData.data_inicio).toISOString()
        : null;
      const dataFimISO = formData.data_fim
        ? new Date(formData.data_fim).toISOString()
        : null;

      // Preparar payload com nomes de campos alinhados ao backend
      const payload = {
        jog_nome: formData.jog_nome,
        slug: finalSlug,
        visibleInConcursos: formData.visibleInConcursos,
        jog_tipodojogo: formData.jog_tipodojogo, // Alinhado
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        valorBilhete: parseFloat(formData.valorBilhete), // Alinhado
        ativo: formData.ativo,
        descricao: formData.descricao,
        numeroInicial: formData.numeroInicial,
        numeroFinal: formData.numeroFinal,
        pontosPorAcerto: parseInt(formData.pontosPorAcerto, 10),
        numeroPalpites: parseInt(formData.numeroPalpites, 10),
        status: formData.status,
        premiation: premiationActive
          ? {
              pointPrizes: pointPrizes.map((prize) => ({
                pontos: parseInt(prize.pontos, 10),
                premio: parseFloat(prize.premio),
              })),
              fixedPremiation: null,
            }
          : {
              fixedPremiation: {
                campeao: parseFloat(fixedPremiation.campeao),
                vice: parseFloat(fixedPremiation.vice),
                ultimoColocado: parseFloat(fixedPremiation.ultimoColocado),
                custosAdministrativos: parseFloat(
                  fixedPremiation.custosAdministrativos
                ),
              },
              pointPrizes: [],
            },
      };

      // Enviar dados para backend
      const token = localStorage.getItem("token");
      await axios.post("/api/jogos/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Jogo criado com sucesso.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Resetar formulário
      setFormData({
        jog_nome: "",
        slug: "",
        visibleInConcursos: true,
        jog_tipodojogo: "", // Alinhado com o backend
        data_inicio: "",
        data_fim: "",
        valorBilhete: "",
        ativo: true,
        descricao: "",
        numeroInicial: "",
        numeroFinal: "",
        pontosPorAcerto: "",
        numeroPalpites: "",
        status: "aberto",
      });
      setPremiationActive(false);
      setFixedPremiation({
        campeao: rateioConfig?.rateio_10_pontos || "",
        vice: rateioConfig?.rateio_9_pontos || "",
        ultimoColocado: rateioConfig?.rateio_menos_pontos || "",
        custosAdministrativos: rateioConfig?.custos_administrativos || "",
      });
      setPointPrizes([]);

      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao criar jogo.",
        description: error.response?.data?.error || "Erro desconhecido.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Funções para manipular a premiação por pontuação
  const handleTogglePremiation = () => {
    setPremiationActive(!premiationActive);
    if (premiationActive) {
      // Resetar premiação fixa ao desativar a premiação por pontuação
      setFixedPremiation({
        campeao: "",
        vice: "",
        ultimoColocado: "",
        custosAdministrativos: "",
      });
    } else {
      // Resetar premiação por pontuação ao ativar a premiação fixa
      setPointPrizes([]);
    }
  };

  const handleFixedPremiationChange = (e) => {
    const { name, value } = e.target;
    setFixedPremiation({
      ...fixedPremiation,
      [name]: value,
    });
  };

  const handlePointPrizeAdd = () => {
    setPointPrizes([...pointPrizes, { pontos: "", premio: "" }]);
  };

  const handlePointPrizeRemove = (index) => {
    const updated = pointPrizes.filter((_, idx) => idx !== index);
    setPointPrizes(updated);
  };

  const handlePointPrizeChange = (index, field, value) => {
    const updated = pointPrizes.map((prize, idx) => {
      if (idx === index) {
        return { ...prize, [field]: value };
      }
      return prize;
    });
    setPointPrizes(updated);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setFormData({
          jog_nome: "",
          slug: "",
          visibleInConcursos: true,
          jog_tipodojogo: "", // Alinhado com o backend
          data_inicio: "",
          data_fim: "",
          valorBilhete: "",
          ativo: true,
          descricao: "",
          numeroInicial: "",
          numeroFinal: "",
          pontosPorAcerto: "",
          numeroPalpites: "",
          status: "aberto",
        });
        setPremiationActive(false);
        setFixedPremiation({
          campeao: rateioConfig?.rateio_10_pontos || "",
          vice: rateioConfig?.rateio_9_pontos || "",
          ultimoColocado: rateioConfig?.rateio_menos_pontos || "",
          custosAdministrativos: rateioConfig?.custos_administrativos || "",
        });
        setPointPrizes([]);
        onClose();
      }}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cadastrar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="enclosed" colorScheme="green">
            <TabList>
              <Tab>Geral</Tab>
              <Tab>Premiação</Tab>
            </TabList>
            <TabPanels>
              {/* Aba Geral */}
              <TabPanel>
                <Stack spacing={4}>
                  {/* Nome do Jogo */}
                  <FormControl isRequired>
                    <FormLabel>Nome do Jogo</FormLabel>
                    <Input
                      name="jog_nome"
                      value={formData.jog_nome}
                      onChange={handleChange}
                      placeholder="Ex: Mega-Sena"
                    />
                  </FormControl>
                  {/* Slug */}
                  <FormControl isRequired>
                    <FormLabel>Slug</FormLabel>
                    <Input
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="exemplo-slug"
                    />
                    <FormHelperText>
                      O slug deve ser único e sem espaços.
                    </FormHelperText>
                  </FormControl>
                  {/* Visível em Concursos */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="visibleInConcursos" mb="0">
                      Visível em Concursos?
                    </FormLabel>
                    <Switch
                      id="visibleInConcursos"
                      name="visibleInConcursos"
                      isChecked={formData.visibleInConcursos}
                      onChange={handleChange}
                      colorScheme="green"
                    />
                  </FormControl>
                  {/* Ativo */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="ativo" mb="0">
                      Ativo?
                    </FormLabel>
                    <Switch
                      id="ativo"
                      name="ativo"
                      isChecked={formData.ativo}
                      onChange={handleChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  {/* Descrição */}
                  <FormControl isRequired>
                    <FormLabel>Descrição</FormLabel>
                    <Textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Descrição do jogo"
                    />
                  </FormControl>
                  {/* Tipo do Jogo */}
                  <FormControl isRequired>
                    <FormLabel>Tipo do Jogo</FormLabel>
                    <Select
                      name="jog_tipodojogo" // Alinhado com o backend
                      value={formData.jog_tipodojogo}
                      onChange={handleChange}
                      placeholder="Selecione o Tipo de Jogo"
                    >
                      {gameTypes.length > 0 ? (
                        gameTypes.map((type) => (
                          <option
                            key={type.game_type_id}
                            value={type.game_type_id}
                          >
                            {type.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>Carregando tipos de jogos...</option>
                      )}
                    </Select>
                  </FormControl>
                  {/* Data de Início */}
                  <FormControl isRequired>
                    <FormLabel>Data de Início</FormLabel>
                    <Input
                      type="datetime-local"
                      name="data_inicio"
                      value={formData.data_inicio}
                      onChange={handleChange}
                    />
                  </FormControl>
                  {/* Data de Fim */}
                  <FormControl isRequired>
                    <FormLabel>Data de Fim</FormLabel>
                    <Input
                      type="datetime-local"
                      name="data_fim"
                      value={formData.data_fim}
                      onChange={handleChange}
                    />
                  </FormControl>
                  {/* Valor do Bilhete */}
                  <FormControl isRequired>
                    <FormLabel>Valor do Bilhete (R$)</FormLabel>
                    <NumberInput precision={2} step={0.01}>
                      <NumberInputField
                        name="valorBilhete" // Alinhado com o backend
                        value={formData.valorBilhete}
                        onChange={handleChange}
                        placeholder="Ex: 10"
                      />
                    </NumberInput>
                  </FormControl>
                  {/* Número Inicial e Final */}
                  <HStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Número Inicial</FormLabel>
                      <Input
                        name="numeroInicial"
                        value={formData.numeroInicial}
                        onChange={handleChange}
                        placeholder="Ex: 1"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Número Final</FormLabel>
                      <Input
                        name="numeroFinal"
                        value={formData.numeroFinal}
                        onChange={handleChange}
                        placeholder="Ex: 60"
                      />
                    </FormControl>
                  </HStack>
                  {/* Pontos por Acerto */}
                  <FormControl isRequired>
                    <FormLabel>Pontos por Acerto</FormLabel>
                    <NumberInput min={1}>
                      <NumberInputField
                        name="pontosPorAcerto"
                        value={formData.pontosPorAcerto}
                        onChange={handleChange}
                        placeholder="Ex: 1"
                      />
                    </NumberInput>
                  </FormControl>
                  {/* Número de Palpites */}
                  <FormControl isRequired>
                    <FormLabel>Número de Palpites</FormLabel>
                    <NumberInput min={1}>
                      <NumberInputField
                        name="numeroPalpites"
                        value={formData.numeroPalpites}
                        onChange={handleChange}
                        placeholder="Ex: 10"
                      />
                    </NumberInput>
                  </FormControl>
                </Stack>
              </TabPanel>

              {/* Aba Premiação */}
              <TabPanel>
                <Stack spacing={4}>
                  {/* Toggle para Premiação por Pontuação */}
                  {/* <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="premiationActive" mb="0">
                      Premiação por Pontuação?
                    </FormLabel>
                    <Switch
                      id="premiationActive"
                      isChecked={premiationActive}
                      onChange={handleTogglePremiation}
                      colorScheme="green"
                    />
                  </FormControl> */}

                  {/* Premiação Fixa */}
                  {
                    // !premiationActive && (
                    <Stack spacing={4}>
                      {/* Campeão */}
                      <FormControl isRequired>
                        <FormLabel>Campeão (%)</FormLabel>
                        <NumberInput
                          min={0}
                          max={100}
                          value={fixedPremiation.campeao}
                          onChange={(valueString) =>
                            handleFixedPremiationChange({
                              target: { name: "campeao", value: valueString },
                            })
                          }
                        >
                          <NumberInputField
                            name="campeao"
                            placeholder="Ex: 50"
                          />
                        </NumberInput>
                      </FormControl>

                      {/* Vice */}
                      <FormControl isRequired>
                        <FormLabel>Vice (%)</FormLabel>
                        <NumberInput
                          min={0}
                          max={100}
                          value={fixedPremiation.vice}
                          onChange={(valueString) =>
                            handleFixedPremiationChange({
                              target: { name: "vice", value: valueString },
                            })
                          }
                        >
                          <NumberInputField name="vice" placeholder="Ex: 30" />
                        </NumberInput>
                      </FormControl>

                      {/* Último Colocado */}
                      <FormControl isRequired>
                        <FormLabel>Último Colocado (%)</FormLabel>
                        <NumberInput
                          min={0}
                          max={100}
                          value={fixedPremiation.ultimoColocado}
                          onChange={(valueString) =>
                            handleFixedPremiationChange({
                              target: {
                                name: "ultimoColocado",
                                value: valueString,
                              },
                            })
                          }
                        >
                          <NumberInputField
                            name="ultimoColocado"
                            placeholder="Ex: 10"
                          />
                        </NumberInput>
                      </FormControl>

                      {/* Custos Administrativos */}
                      <FormControl isRequired>
                        <FormLabel>Custos Administrativos (%)</FormLabel>
                        <NumberInput
                          min={0}
                          max={100}
                          value={fixedPremiation.custosAdministrativos}
                          onChange={(valueString) =>
                            handleFixedPremiationChange({
                              target: {
                                name: "custosAdministrativos",
                                value: valueString,
                              },
                            })
                          }
                        >
                          <NumberInputField
                            name="custosAdministrativos"
                            placeholder="Ex: 10"
                          />
                        </NumberInput>
                      </FormControl>

                      {/* Soma das Porcentagens */}
                      <Text
                        color={
                          totalFixedPercentage === 100 ? "green.500" : "red.500"
                        }
                      >
                        Soma das porcentagens: {totalFixedPercentage}%
                      </Text>
                      {totalFixedPercentage !== 100 && (
                        <Text color="red.500">
                          A soma das porcentagens deve ser igual a 100%.
                        </Text>
                      )}
                    </Stack>

                    // )
                  }

                  {/* Premiação por Pontuação */}
                  {
                    // premiationActive && (
                    //   <Stack spacing={4}>
                    //     {/* Lista de Premiações por Pontuação */}
                    //     {pointPrizes.map((prize, index) => (
                    //       <HStack key={index} spacing={4}>
                    //         <FormControl isRequired>
                    //           <FormLabel>Pontos</FormLabel>
                    //           <NumberInput min={1}>
                    //             <NumberInputField
                    //               value={prize.pontos}
                    //               onChange={(e) =>
                    //                 handlePointPrizeChange(index, 'pontos', e.target.value)
                    //               }
                    //               placeholder="Ex: 10"
                    //             />
                    //           </NumberInput>
                    //         </FormControl>
                    //         <FormControl isRequired>
                    //           <FormLabel>Valor do Prêmio (R$)</FormLabel>
                    //           <NumberInput min={0} precision={2} step={0.01}>
                    //             <NumberInputField
                    //               value={prize.premio}
                    //               onChange={(e) =>
                    //                 handlePointPrizeChange(index, 'premio', e.target.value)
                    //               }
                    //               placeholder="Ex: 1000.00"
                    //             />
                    //           </NumberInput>
                    //         </FormControl>
                    //         <Button
                    //           colorScheme="red"
                    //           onClick={() => handlePointPrizeRemove(index)}
                    //         >
                    //           Remover
                    //         </Button>
                    //       </HStack>
                    //     ))}
                    //     {/* Adicionar Premiação */}
                    //     <Button onClick={handlePointPrizeAdd} colorScheme="teal">
                    //       Adicionar Premiação
                    //     </Button>
                    //     {/* Soma das Porcentagens - Removida */}
                    //     {/* Não é necessário mostrar a soma das porcentagens quando é por pontuação */}
                    //   </Stack>
                    // )
                  }
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setFormData({
                jog_nome: "",
                slug: "",
                visibleInConcursos: true,
                jog_tipodojogo: "", // Alinhado com o backend
                data_inicio: "",
                data_fim: "",
                valorBilhete: "",
                ativo: true,
                descricao: "",
                numeroInicial: "",
                numeroFinal: "",
                pontosPorAcerto: "",
                numeroPalpites: "",
                status: "aberto",
              });
              setPremiationActive(false);
              setFixedPremiation({
                campeao: rateioConfig?.rateio_10_pontos || "",
                vice: rateioConfig?.rateio_9_pontos || "",
                ultimoColocado: rateioConfig?.rateio_menos_pontos || "",
                custosAdministrativos:
                  rateioConfig?.custos_administrativos || "",
              });
              setPointPrizes([]);
              onClose();
            }}
          >
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameFormModal;
