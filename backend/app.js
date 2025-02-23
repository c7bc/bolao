const express = require("express");
const cors = require("cors");
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const axios = require("axios");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Validação das credenciais AWS
if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
  console.error(
    "Erro: AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY devem ser definidos nas variáveis de ambiente."
  );
  process.exit(1);
}

// Chaves e Tokens Configurados
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "43027bae66101fbad9c1ef4eb02e8158f5e2afa34b60f11144da6ea80dbdce68";
const BASE_URL = "https://api.bolaodepremios.com.br";
const FRONTEND_URL = "https://bolaodepremios.com.br";

// Configuração de CORS mais robusta e permissiva
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
    maxAge: 86400,
  })
);

// Aumentar limite de payload
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Inicialização do cliente DynamoDB com configuração de retry
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  maxAttempts: 5,
  retryMode: "adaptive",
});

// Função para buscar configurações de integração do DynamoDB
let integrationConfigCache = null;
const fetchIntegrationConfig = async () => {
  if (integrationConfigCache) {
    return integrationConfigCache;
  }

  try {
    const result = await dynamoDbClient.send(
      new GetItemCommand({
        TableName: "personalization-config",
        Key: marshall({ id: "personalization-config" }),
      })
    );

    if (result.Item) {
      const config = unmarshall(result.Item);
      integrationConfigCache = config.integration || {};
      return integrationConfigCache;
    } else {
      console.warn("Configurações de integração não encontradas no DynamoDB.");
      return {};
    }
  } catch (error) {
    console.error("Erro ao buscar configurações de integração:", error);
    return {};
  }
};

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Erro de validação",
      details: err.message,
      code: "VALIDATION_ERROR",
    });
  }

  if (err.name === "PaymentProcessingError") {
    return res.status(422).json({
      error: "Erro no processamento do pagamento",
      details: err.message,
      code: "PAYMENT_PROCESSING_ERROR",
    });
  }

  res.status(500).json({
    error: "Erro interno do servidor",
    details: "Um erro inesperado ocorreu",
    code: "INTERNAL_SERVER_ERROR",
  });
};

// Middleware de autenticação melhorado
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: "Token não fornecido",
        code: "TOKEN_MISSING",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const userParams = {
        TableName: "Cliente",
        Key: marshall({
          cli_id: decoded.cli_id,
        }),
      };

      const userResult = await dynamoDbClient.send(
        new GetItemCommand(userParams)
      );

      if (!userResult.Item) {
        return res.status(401).json({
          error: "Usuário não encontrado",
          code: "USER_NOT_FOUND",
        });
      }

      const user = unmarshall(userResult.Item);

      // Validação de status mais robusta
      const activeStatuses = [
        "active",
        "ativo",
        "ACTIVE",
        "ATIVO",
        1,
        "1",
        true,
      ];
      if (!activeStatuses.includes(user.cli_status)) {
        return res.status(403).json({
          error: "Usuário inativo",
          details:
            "Sua conta está atualmente inativa. Entre em contato com o suporte para mais informações.",
          code: "USER_INACTIVE",
        });
      }

      req.user = {
        cli_id: decoded.cli_id,
        email: user.email,
        name: user.nome,
        status: user.cli_status,
      };

      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Token inválido",
          code: "INVALID_TOKEN",
        });
      }
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expirado",
          code: "TOKEN_EXPIRED",
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// Validação aprimorada dos dados da aposta
const validateBetData = async (req, res, next) => {
  try {
    const { jogo_id, bilhetes, valor_total, return_url } = req.body;

    if (!jogo_id || typeof jogo_id !== "string") {
      throw new Error("jogo_id inválido ou não fornecido");
    }

    // Buscar informações do jogo no DynamoDB
    const jogoResult = await dynamoDbClient.send(
      new GetItemCommand({
        TableName: "Jogos",
        Key: marshall({ jog_id: jogo_id }),
      })
    );

    if (!jogoResult.Item) {
      throw new Error("Jogo não encontrado");
    }

    const jogo = unmarshall(jogoResult.Item);

    if (!Array.isArray(bilhetes) || bilhetes.length === 0) {
      throw new Error("bilhetes deve ser um array não vazio");
    }

    if (bilhetes.length > 100) {
      throw new Error("número máximo de bilhetes excedido (max: 100)");
    }

    for (const bilhete of bilhetes) {
      if (
        !Array.isArray(bilhete.palpite_numbers) ||
        bilhete.palpite_numbers.length === 0
      ) {
        throw new Error(
          "cada bilhete deve conter um array não vazio de palpite_numbers"
        );
      }

      if (bilhete.palpite_numbers.length !== jogo.numeroPalpites) {
        throw new Error(
          `cada bilhete deve conter exatamente ${jogo.numeroPalpites} palpites`
        );
      }

      if (
        !bilhete.palpite_numbers.every(
          (num) =>
            Number.isInteger(num) &&
            num >= jogo.numeroInicial &&
            num <= jogo.numeroFinal
        )
      ) {
        throw new Error(
          `todos os palpites devem ser números inteiros entre ${jogo.numeroInicial} e ${jogo.numeroFinal}`
        );
      }

      if (
        new Set(bilhete.palpite_numbers).size !== bilhete.palpite_numbers.length
      ) {
        throw new Error("todos os palpites devem ser números diferentes");
      }
    }

    if (
      typeof valor_total !== "number" ||
      valor_total <= 0 ||
      !Number.isFinite(valor_total)
    ) {
      throw new Error("valor_total deve ser um número positivo válido");
    }

    if (return_url && typeof return_url !== "string") {
      throw new Error("return_url deve ser uma string válida");
    }

    next();
  } catch (error) {
    res.status(400).json({
      error: "Dados inválidos",
      details: error.message,
      code: "INVALID_DATA",
    });
  }
};

// Função auxiliar para validar o status do jogo
const validateGameStatus = async (jog_id) => {
  const jogoResult = await dynamoDbClient.send(
    new GetItemCommand({
      TableName: "Jogos",
      Key: marshall({ jog_id }),
    })
  );

  if (!jogoResult.Item) {
    throw new Error("Jogo não encontrado");
  }

  const jogo = unmarshall(jogoResult.Item);

  if (jogo.jog_status !== "aberto") {
    throw new Error("Este jogo não está aberto para apostas");
  }

  return jogo;
};

// Função auxiliar para salvar pagamento
const savePagamento = async (pagamentoData) => {
  try {
    await dynamoDbClient.send(
      new PutItemCommand({
        TableName: "Pagamentos",
        Item: marshall(pagamentoData, { removeUndefinedValues: true }),
        ConditionExpression: "attribute_not_exists(pagamentoId)",
      })
    );
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("Pagamento já existe");
    }
    throw error;
  }
};

// Função para validar a assinatura do webhook
const validateSignature = (headers, body, secret) => {
  const signature = headers["x-hub-signature"];
  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
};

// Definição das rotas
const router = express.Router();

// Rota para criar aposta
router.post(
  "/apostas/criar-aposta",
  authMiddleware,
  validateBetData,
  async (req, res, next) => {
    const transaction = {
      pagamentoId: null,
      paymentUrl: null,
    };

    try {
      const { jogo_id, bilhetes, valor_total, return_url, slug } = req.body;

      // Validar status do jogo
      const jogo = await validateGameStatus(jogo_id);

      // Validar valor total
      const valorPorBilhete = parseFloat(jogo.jog_valorBilhete || 0);
      const valorTotalEsperado = valorPorBilhete * bilhetes.length;

      if (Math.abs(valor_total - valorTotalEsperado) > 0.01) {
        throw new Error(
          `Valor total inválido. Esperado: ${valorTotalEsperado}`
        );
      }

      // Gerar ID único para o pagamento
      transaction.pagamentoId = uuidv4();

      const baseReturnUrl = return_url || `${BASE_URL}/bolao`;

      // Buscar configurações de integração
      const integrationConfig = await fetchIntegrationConfig();

      if (!integrationConfig.EFI_API_URL || !integrationConfig.EFI_API_KEY) {
        throw new Error(
          "Configurações de integração incompletas. Verifique EFI_API_URL e EFI_API_KEY."
        );
      }

      // Criar requisição de pagamento na Efí Payments
      const paymentData = {
        amount: valor_total * 100, // Assumindo que a API espera o valor em centavos
        currency: "BRL",
        description: `${bilhetes.length} Bilhete(s) - ${
          jogo.jog_nome || "Bolão"
        }`,
        callback_url: `${BASE_URL}/api/webhook/efipayments`, // URL do webhook
        return_url: `${FRONTEND_URL}/bolao/${slug}/?payment_id=${transaction.pagamentoId}&status=approved`,
        metadata: {
          pagamentoId: transaction.pagamentoId,
          jogo_id,
          bilhetes,
        },
      };

      console.log(
        "Dados do pagamento para Efí Payments:",
        JSON.stringify(paymentData, null, 2)
      );

      try {
        const response = await axios.post(
          `${integrationConfig.EFI_API_URL}/payments`,
          paymentData,
          {
            headers: {
              Authorization: `Bearer ${integrationConfig.EFI_API_KEY}`,
            },
          }
        );

        if (!response.data || !response.data.payment_url) {
          console.error("Erro: Resposta inválida da Efí Payments");
          throw new Error("Falha ao criar requisição de pagamento");
        }

        transaction.paymentUrl = response.data.payment_url;
        console.log(
          "Requisição de pagamento criada com sucesso:",
          JSON.stringify(response.data, null, 2)
        );
      } catch (error) {
        console.error("Erro ao criar requisição de pagamento:", error);
        throw new Error(
          "Falha ao criar requisição de pagamento: " + error.message
        );
      }

      // Salvar informações do pagamento
      const pagamento = {
        pagamentoId: transaction.pagamentoId,
        cli_id: req.user.cli_id,
        jog_id: jogo_id,
        valor_total,
        status: "pendente",
        metodo_pagamento: "efipayments",
        efi_payment_id: response.data.payment_id, // Assumindo que a API retorna um ID
        bilhetes: bilhetes.map((bilhete) => ({
          ...bilhete,
          status: "pendente",
          data_criacao: new Date().toISOString(),
        })),
        tentativas: 0,
        data_criacao: new Date().toISOString(),
        ultima_atualizacao: new Date().toISOString(),
      };

      await savePagamento(pagamento);

      // Retornar dados do checkout
      res.json({
        checkout_url: transaction.paymentUrl,
        paymentId: transaction.pagamentoId,
      });
    } catch (error) {
      // Rollback em caso de erro
      if (transaction.pagamentoId) {
        try {
          await dynamoDbClient.send(
            new UpdateItemCommand({
              TableName: "Pagamentos",
              Key: marshall({ pagamentoId: transaction.pagamentoId }),
              UpdateExpression:
                "SET #status = :status, ultima_atualizacao = :now",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: marshall({
                ":status": "erro",
                ":now": new Date().toISOString(),
              }),
            })
          );
        } catch (rollbackError) {
          console.error("Erro no rollback:", rollbackError);
        }
      }

      next(error);
    }
  }
);

// Webhook da Efí Payments com logs robustos e validação de assinatura
router.post("/webhook/efipayments", async (req, res) => {
  const startTime = Date.now();
  console.log("========== INÍCIO WEBHOOK EFÍ PAYMENTS ==========");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("Payload Recebido (RAW):", JSON.stringify(req.body, null, 2));

  try {
    // Buscar configurações de integração para obter o segredo do webhook
    const integrationConfig = await fetchIntegrationConfig();

    if (!integrationConfig.EFI_WEBHOOK_SECRET) {
      console.error("ERRO: Segredo do webhook não configurado");
      return res.status(400).json({ error: "Segredo do webhook não configurado" });
    }

    // Validação da assinatura do webhook
    if (!validateSignature(req.headers, req.body, integrationConfig.EFI_WEBHOOK_SECRET)) {
      console.error("ERRO: Assinatura do webhook inválida");
      return res.status(400).json({ error: "Assinatura do webhook inválida" });
    }

    // Validações iniciais de payload
    if (!req.body || !req.body.event) {
      console.error("ERRO: Payload vazio ou inválido");
      return res.status(400).json({
        error: "Payload inválido",
        details: "Nenhum dado recebido ou evento não especificado",
      });
    }

    const { event, data } = req.body;
    console.log("Tipo de evento:", event);

    switch (event) {
      case "payment_status":
        console.log("Dados do pagamento:", JSON.stringify(data, null, 2));

        // Buscar detalhes do pagamento
        const pagamentoId = data.metadata.pagamentoId;
        if (!pagamentoId) {
          console.error("ERRO: Metadata não encontrada");
          return res
            .status(400)
            .json({ error: "Referência do pagamento não encontrada" });
        }

        // Buscar pagamento no DynamoDB
        const pagamentoResult = await dynamoDbClient.send(
          new GetItemCommand({
            TableName: "Pagamentos",
            Key: marshall({ pagamentoId }),
          })
        );

        if (!pagamentoResult.Item) {
          console.error(`Pagamento não encontrado: ${pagamentoId}`);
          return res.status(404).json({ error: "Pagamento não encontrado" });
        }

        const pagamento = unmarshall(pagamentoResult.Item);

        // Verificar se o pagamento já foi processado
        if (pagamento.status === "confirmado") {
          console.log(`Pagamento ${pagamentoId} já processado anteriormente`);
          return res.json({ message: "Pagamento já processado" });
        }

        // Processar status do pagamento
        let novoStatus = "pendente";
        if (data.status === "approved") {
          novoStatus = "confirmado";
        } else if (
          ["rejected", "cancelled", "refunded"].includes(data.status)
        ) {
          novoStatus = "falha";
        }

        // Atualizar status do pagamento no DynamoDB
        await dynamoDbClient.send(
          new UpdateItemCommand({
            TableName: "Pagamentos",
            Key: marshall({ pagamentoId }),
            UpdateExpression:
              "SET #status = :status, efi_status = :efiStatus, ultima_atualizacao = :now",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: marshall({
              ":status": novoStatus,
              ":efiStatus": data.status,
              ":now": new Date().toISOString(),
            }),
          })
        );

        // Se o pagamento foi aprovado, registrar as apostas
        if (novoStatus === "confirmado") {
          console.log("Iniciando registro das apostas...");
          const apostasPromises = pagamento.bilhetes.map(async (bilhete) => {
            const apostaData = {
              aposta_id: uuidv4(),
              cli_id: pagamento.cli_id,
              jog_id: pagamento.jog_id,
              palpite_numbers: bilhete.palpite_numbers,
              valor: pagamento.valor_total / pagamento.bilhetes.length,
              pagamentoId: pagamentoId,
              status: "confirmada",
              metodo_pagamento: "efipayments",
              efi_payment_id: data.payment_id,
              data_criacao: new Date().toISOString(),
              ultima_atualizacao: new Date().toISOString(),
            };

            try {
              await dynamoDbClient.send(
                new PutItemCommand({
                  TableName: "Apostas",
                  Item: marshall(apostaData),
                  ConditionExpression: "attribute_not_exists(aposta_id)",
                })
              );
              console.log(
                `Aposta registrada com sucesso: ${apostaData.aposta_id}`
              );
              return apostaData;
            } catch (error) {
              console.error(`Erro ao registrar aposta:`, error);
              throw error;
            }
          });

          try {
            await Promise.all(apostasPromises);
            console.log("Todas as apostas foram registradas com sucesso");
          } catch (error) {
            console.error("Erro ao registrar apostas:", error);
          }
        }
        break;

      // Adicionar outros casos conforme a documentação da Efí Payments
      default:
        console.log("Tipo de evento desconhecido:", event);
        return res
          .status(400)
          .json({ error: "Tipo de evento desconhecido" });
    }

    const processTime = Date.now() - startTime;
    console.log("========== FIM WEBHOOK EFÍ PAYMENTS ==========");
    console.log(`Tempo de Processamento: ${processTime}ms`);

    res.status(200).json({
      success: true,
      message: `Notificação do tipo ${event} processada com sucesso`,
      processTime,
    });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    res.status(500).json({
      error: "Erro interno no processamento",
      message: error.message,
    });
  }
});

// Rota para verificar status do pagamento
router.get(
  "/pagamentos/:pagamentoId/status",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { pagamentoId } = req.params;

      const pagamentoResult = await dynamoDbClient.send(
        new GetItemCommand({
          TableName: "Pagamentos",
          Key: marshall({ pagamentoId }),
        })
      );

      if (!pagamentoResult.Item) {
        return res.status(404).json({
          error: "Pagamento não encontrado",
          code: "PAYMENT_NOT_FOUND",
        });
      }

      const pagamento = unmarshall(pagamentoResult.Item);

      // Verificar autorização
      if (pagamento.cli_id !== req.user.cli_id) {
        return res.status(403).json({
          error: "Acesso não autorizado",
          code: "UNAUTHORIZED_ACCESS",
        });
      }

      // Buscar configurações de integração
      const integrationConfig = await fetchIntegrationConfig();

      // Se o pagamento estiver pendente, verificar status na Efí Payments
      if (pagamento.status === "pendente" && pagamento.efi_payment_id) {
        if (!integrationConfig.EFI_API_URL || !integrationConfig.EFI_API_KEY) {
          console.warn(
            "Configurações de integração incompletas. Não é possível verificar o status do pagamento."
          );
        } else {
          try {
            const response = await axios.get(
              `${integrationConfig.EFI_API_URL}/payments/${pagamento.efi_payment_id}/status`,
              {
                headers: {
                  Authorization: `Bearer ${integrationConfig.EFI_API_KEY}`,
                },
              }
            );

            if (response.data && response.data.status) {
              let novoStatus = "pendente";
              if (response.data.status === "approved") {
                novoStatus = "confirmado";
              } else if (
                ["rejected", "cancelled", "refunded"].includes(response.data.status)
              ) {
                novoStatus = "falha";
              }

              await dynamoDbClient.send(
                new PutItemCommand({
                  TableName: "Pagamentos",
                  Item: marshall(
                    {
                      ...pagamento,
                      status: novoStatus,
                      efi_status: response.data.status,
                      efi_status_detail: response.data.status_detail,
                      ultima_atualizacao: new Date().toISOString(),
                    },
                    { removeUndefinedValues: true }
                  ),
                })
              );

              pagamento.status = novoStatus;
            }
          } catch (error) {
            console.error("Erro ao verificar status na Efí Payments:", error);
            // Continuar com o status local em caso de erro
          }
        }
      }

      // Retornar informações do pagamento
      res.json({
        pagamentoId,
        status: pagamento.status,
        data_criacao: pagamento.data_criacao,
        ultima_atualizacao: pagamento.ultima_atualizacao,
        valor_total: pagamento.valor_total,
        quantidade_bilhetes: pagamento.bilhetes?.length || 0,
        efi_status: pagamento.efi_status,
        efi_status_detail: pagamento.efi_status_detail,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Health Check
app.get("/health", async (req, res) => {
  try {
    // Buscar configurações de integração
    const integrationConfig = await fetchIntegrationConfig();

    if (integrationConfig.EFI_API_URL && integrationConfig.EFI_API_KEY) {
      await axios.get(`${integrationConfig.EFI_API_URL}/health`, {
        headers: {
          Authorization: `Bearer ${integrationConfig.EFI_API_KEY}`,
        },
      });
    } else {
      console.warn(
        "Configurações de integração incompletas. Pulando a verificação de saúde da Efí Payments."
      );
    }

    // Verificar conexão com DynamoDB
    await dynamoDbClient
      .send(
        new GetItemCommand({
          TableName: "Jogos",
          Key: marshall({ jog_id: "test" }),
        })
      )
      .catch(() => null);

    res.json({
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      services: {
        efipayments: !!integrationConfig.EFI_API_URL && !!integrationConfig.EFI_API_KEY,
        dynamodb: true,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Rota de teste
app.get("/test", (req, res) => {
  res.json({
    message: "API está funcionando!",
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    frontendUrl: FRONTEND_URL,
  });
});

// Usar o router para as rotas da API
app.use("/api", router);

// Registrar middleware de erro
app.use(errorHandler);

// Inicialização do servidor com verificações
const startServer = async () => {
  try {
    // Buscar configurações de integração
    const integrationConfig = await fetchIntegrationConfig();

    if (integrationConfig.EFI_API_URL && integrationConfig.EFI_API_KEY) {
      await axios.get(`${integrationConfig.EFI_API_URL}/health`, {
        headers: {
          Authorization: `Bearer ${integrationConfig.EFI_API_KEY}`,
        },
      });
    } else {
      console.warn(
        "Configurações de integração incompletas. Pulando a verificação de saúde da Efí Payments na inicialização."
      );
    }

    await dynamoDbClient
      .send(
        new GetItemCommand({
          TableName: "Jogos",
          Key: marshall({ jog_id: "test" }),
        })
      )
      .catch(() => null);

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
      console.log(`Frontend URL: ${FRONTEND_URL}`);
      console.log(`Base URL: ${BASE_URL}`);
      console.log("Rotas disponíveis:");
      console.log("- GET /health");
      console.log("- GET /test");
      console.log("- POST /api/apostas/criar-aposta");
      console.log("- POST /api/webhook/efipayments");
      console.log("- GET /api/pagamentos/:pagamentoId/status");
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();