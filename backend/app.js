const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand,
  UpdateItemCommand 
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3001;

// Validação das credenciais AWS
if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
  console.error('Erro: AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY devem ser definidos nas variáveis de ambiente.');
  process.exit(1);
}

// Chaves e Tokens Configurados
const JWT_SECRET = process.env.JWT_SECRET || '43027bae66101fbad9c1ef4eb02e8158f5e2afa34b60f11144da6ea80dbdce68';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-55618797280028-060818-4b48d75c9912358237e2665c842b4ef6-47598575';
const BASE_URL = 'https://api.bolaodepremios.com.br';
const FRONTEND_URL = 'https://bolaodepremios.com.br';

// Configuração de CORS mais robusta e permissiva
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://bolaodepremios.com.br',
      'https://www.bolaodepremios.com.br',
      'https://api.bolaodepremios.com.br',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Permitir requisições sem origin (como mobile apps ou Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400 // Cache preflight por 24 horas
}));

// Aumentar limite de payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Inicialização do cliente MercadoPago com retry e timeout
const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
  options: {
    timeout: 10000, // Aumentado para 10 segundos
    idempotencyKey: true,
    retries: 3
  }
});

// Inicialização do DynamoDB com configuração de retry
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  maxAttempts: 5,
  retryMode: 'adaptive'
});

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'PaymentProcessingError') {
    return res.status(422).json({
      error: 'Erro no processamento do pagamento',
      details: err.message,
      code: 'PAYMENT_PROCESSING_ERROR'
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    details: 'Um erro inesperado ocorreu',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

// Middleware de autenticação melhorado
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token não fornecido',
        code: 'TOKEN_MISSING'
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const userParams = {
        TableName: 'Cliente',
        Key: marshall({
          cli_id: decoded.cli_id
        })
      };

      const userResult = await dynamoDbClient.send(new GetItemCommand(userParams));

      if (!userResult.Item) {
        return res.status(401).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = unmarshall(userResult.Item);

      // Validação de status mais robusta
      const activeStatuses = ['active', 'ativo', 'ACTIVE', 'ATIVO', 1, '1', true];
      if (!activeStatuses.includes(user.cli_status)) {
        return res.status(403).json({
          error: 'Usuário inativo',
          details: 'Sua conta está atualmente inativa. Entre em contato com o suporte para mais informações.',
          code: 'USER_INACTIVE'
        });
      }

      req.user = {
        cli_id: decoded.cli_id,
        email: user.email,
        name: user.nome,
        status: user.cli_status
      };

      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// Validação aprimorada dos dados da aposta
const validateBetData = (req, res, next) => {
  try {
    const { jogo_id, bilhetes, valor_total, return_url } = req.body;

    if (!jogo_id || typeof jogo_id !== 'string') {
      throw new Error('jogo_id inválido ou não fornecido');
    }

    if (!Array.isArray(bilhetes) || bilhetes.length === 0) {
      throw new Error('bilhetes deve ser um array não vazio');
    }

    if (bilhetes.length > 100) {
      throw new Error('número máximo de bilhetes excedido (max: 100)');
    }

    for (const bilhete of bilhetes) {
      if (!Array.isArray(bilhete.palpite_numbers) || bilhete.palpite_numbers.length === 0) {
        throw new Error('cada bilhete deve conter um array não vazio de palpite_numbers');
      }

      if (!bilhete.palpite_numbers.every(num => Number.isInteger(num) && num > 0)) {
        throw new Error('todos os palpites devem ser números inteiros positivos');
      }
    }

    if (typeof valor_total !== 'number' || valor_total <= 0 || !Number.isFinite(valor_total)) {
      throw new Error('valor_total deve ser um número positivo válido');
    }

    if (return_url && typeof return_url !== 'string') {
      throw new Error('return_url deve ser uma string válida');
    }

    next();
  } catch (error) {
    res.status(400).json({
      error: 'Dados inválidos',
      details: error.message,
      code: 'INVALID_DATA'
    });
  }
};

// Função auxiliar para validar o status do jogo
const validateGameStatus = async (jog_id) => {
  const jogoResult = await dynamoDbClient.send(new GetItemCommand({
    TableName: 'Jogos',
    Key: marshall({ jog_id })
  }));

  if (!jogoResult.Item) {
    throw new Error('Jogo não encontrado');
  }

  const jogo = unmarshall(jogoResult.Item);
  
  if (jogo.jog_status !== 'aberto') {
    throw new Error('Este jogo não está aberto para apostas');
  }

  return jogo;
};

// Função auxiliar para salvar pagamento
const savePagamento = async (pagamentoData) => {
  try {
    await dynamoDbClient.send(new PutItemCommand({
      TableName: 'Pagamentos',
      Item: marshall(pagamentoData, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(pagamentoId)'
    }));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Pagamento já existe');
    }
    throw error;
  }
};

// Rota para criar aposta com tratamento de erros aprimorado
app.post('/api/apostas/criar-aposta', authMiddleware, validateBetData, async (req, res, next) => {
  const transaction = {
    pagamentoId: null,
    preference: null
  };

  try {
    const { jogo_id, bilhetes, valor_total, return_url } = req.body;
  
    // Validar status do jogo
    const jogo = await validateGameStatus(jogo_id);
  
    // Validar valor total
    const valorPorBilhete = parseFloat(jogo.jog_valorBilhete || 0);
    const valorTotalEsperado = valorPorBilhete * bilhetes.length;
  
    if (Math.abs(valor_total - valorTotalEsperado) > 0.01) {
      throw new Error(`Valor total inválido. Esperado: ${valorTotalEsperado}`);
    }
  
    // Gerar ID único para o pagamento
    transaction.pagamentoId = uuidv4();
    
    // Configurar URLs de retorno com base no slug do jogo
    const slug = jogo.slug || 'bolao'; // Assegure-se de que o jogo possui um slug
    const baseReturnUrl = return_url || `${BASE_URL}/bolao/${slug}`;
  
    // Criar preferência no MercadoPago
    const preference = new Preference(mpClient);
    
    const preferenceData = {
      items: [
        {
          id: jogo_id,
          title: `${bilhetes.length} Bilhete(s) - ${jogo.jog_nome || 'Bolão'}`,
          description: `${bilhetes.length} bilhete(s) para o bolão ${jogo.jog_nome}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: parseFloat(valor_total)
        }
      ],
      payer: {
        name: req.user.name,
        email: req.user.email
      },
      // Atualização dos métodos de pagamento para permitir todos os métodos
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 6, // Você pode querer permitir mais parcelas para pagamentos com cartão
      },
      external_reference: transaction.pagamentoId,
      back_urls: {
        success: `${baseReturnUrl}?payment_id=${transaction.pagamentoId}&status=approved`,
        failure: `${baseReturnUrl}?payment_id=${transaction.pagamentoId}&status=rejected`,
        pending: `${baseReturnUrl}?payment_id=${transaction.pagamentoId}&status=pending`
      },
      auto_return: "approved",
      notification_url: `${BASE_URL}/api/webhook/mercadopago`, // Atualizar com a nova URL do ngrok
      statement_descriptor: "BOLAO DE PREMIOS",
      metadata: {
        jogo_id,
        cli_id: req.user.cli_id,
        quantidade_bilhetes: bilhetes.length
      }
    };
  
    transaction.preference = await preference.create({ body: preferenceData });
  
    if (!transaction.preference.id) {
      throw new Error('Erro ao criar preferência de pagamento');
    }
  
    // Salvar informações do pagamento
    const pagamento = {
      pagamentoId: transaction.pagamentoId,
      cli_id: req.user.cli_id,
      jog_id: jogo_id,
      valor_total,
      status: 'pendente',
      mercadopago_id: transaction.preference.id,
      bilhetes: bilhetes.map(bilhete => ({
        ...bilhete,
        status: 'pendente',
        data_criacao: new Date().toISOString()
      })),
      tentativas: 0,
      data_criacao: new Date().toISOString(),
      ultima_atualizacao: new Date().toISOString()
    };
  
    await savePagamento(pagamento);
  
    // Retornar dados do checkout
    res.json({
      checkout_url: transaction.preference.init_point,
      preference_id: transaction.preference.id,
      pagamentoId: transaction.pagamentoId
    });
  
  } catch (error) {
    // Rollback em caso de erro
    if (transaction.pagamentoId) {
      try {
        await dynamoDbClient.send(new UpdateItemCommand({
          TableName: 'Pagamentos',
          Key: marshall({ pagamentoId: transaction.pagamentoId }),
          UpdateExpression: 'SET #status = :status, ultima_atualizacao = :now',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: marshall({
            ':status': 'erro',
            ':now': new Date().toISOString()
          })
        }));
      } catch (rollbackError) {
        console.error('Erro no rollback:', rollbackError);
      }
    }
  
    next(error);
  }
});

// Webhook do MercadoPago aprimorado
app.post('/api/webhook/mercadopago', async (req, res) => {
  const startTime = Date.now();
  console.log('Webhook recebido:', JSON.stringify(req.body));

  try {
    const { type, data } = req.body;

    if (type !== 'payment') {
      return res.json({ message: 'Evento ignorado', type });
    }

    const payment = new Payment(mpClient);
    const paymentData = await payment.get({ id: data.id });
    
    if (!paymentData) {
      throw new Error('Payment data not found');
    }

    const pagamentoId = paymentData.external_reference;
    if (!pagamentoId) {
      throw new Error('External reference not found');
    }

    const pagamentoResult = await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Pagamentos',
      Key: marshall({ pagamentoId })
    }));

    if (!pagamentoResult.Item) {
      throw new Error('Payment not found in database');
    }

    const pagamento = unmarshall(pagamentoResult.Item);
    
    // Handle different payment statuses
    let novoStatus = 'pendente';
    if (['approved', 'in_process'].includes(paymentData.status)) {
      novoStatus = 'confirmado';
    } else if (['rejected', 'cancelled', 'refunded'].includes(paymentData.status)) {
      novoStatus = 'falha';
    }

    // Evitar processamento duplicado
    if (pagamento.status === novoStatus) {
      return res.json({ 
        message: 'Status já atualizado',
        pagamentoId,
        status: novoStatus
      });
    }

    // Processar pagamento aprovado
    if (['approved', 'in_process'].includes(paymentData.status) && pagamento.status !== 'confirmado') {
      try {
        // Verificar se o jogo ainda está aberto
        const jogoResult = await dynamoDbClient.send(new GetItemCommand({
          TableName: 'Jogos',
          Key: marshall({ jog_id: pagamento.jog_id })
        }));

        if (!jogoResult.Item) {
          throw new Error('Jogo não encontrado');
        }

        const jogo = unmarshall(jogoResult.Item);
        if (jogo.jog_status !== 'aberto') {
          // Se o jogo não estiver mais aberto, iniciar processo de reembolso
          const refund = new Payment(mpClient);
          await refund.refund({ payment_id: data.id });
          
          throw new Error('Jogo não está mais aberto para apostas. Reembolso iniciado.');
        }

        // Registrar apostas em transação
        const apostasPromises = pagamento.bilhetes.map(async (bilhete) => {
          const aposta = {
            aposta_id: uuidv4(),
            cli_id: pagamento.cli_id,
            jog_id: pagamento.jog_id,
            palpite_numbers: bilhete.palpite_numbers,
            valor: pagamento.valor_total / pagamento.bilhetes.length,
            pagamentoId: pagamentoId,
            status: 'confirmada',
            mercadopago_payment_id: data.id,
            data_criacao: new Date().toISOString(),
            ultima_atualizacao: new Date().toISOString()
          };

          try {
            await dynamoDbClient.send(new PutItemCommand({
              TableName: 'Apostas',
              Item: marshall(aposta, { removeUndefinedValues: true }),
              ConditionExpression: 'attribute_not_exists(aposta_id)'
            }));
            return aposta;
          } catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
              console.warn('Aposta já registrada:', aposta.aposta_id);
              return null;
            }
            throw error;
          }
        });

        await Promise.all(apostasPromises);
      } catch (error) {
        // Em caso de erro no processamento da aposta aprovada
        await dynamoDbClient.send(new PutItemCommand({
          TableName: 'Pagamentos',
          Item: marshall({
            ...pagamento,
            status: 'erro_processamento',
            erro_mensagem: error.message,
            ultima_atualizacao: new Date().toISOString(),
            tentativas: (pagamento.tentativas || 0) + 1
          }, { removeUndefinedValues: true })
        }));

        throw error;
      }
    }

    // Atualizar status do pagamento
    await dynamoDbClient.send(new PutItemCommand({
      TableName: 'Pagamentos',
      Item: marshall({
        ...pagamento,
        status: novoStatus,
        mercadopago_status: paymentData.status,
        mercadopago_status_detail: paymentData.status_detail,
        ultima_atualizacao: new Date().toISOString(),
        tentativas: (pagamento.tentativas || 0) + 1
      }, { removeUndefinedValues: true })
    }));

    const processTime = Date.now() - startTime;
    console.log(`Webhook processado em ${processTime}ms:`, {
      pagamentoId,
      status: novoStatus,
      mercadopago_status: paymentData.status
    });

    res.json({ 
      success: true,
      pagamentoId,
      status: novoStatus,
      processTime
    });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);

    // Log detalhado do erro
    const errorDetail = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      body: req.body
    };

    console.error('Detalhes do erro:', JSON.stringify(errorDetail));

    res.status(500).json({ 
      error: 'Erro no processamento do webhook',
      message: error.message,
      code: 'WEBHOOK_PROCESSING_ERROR'
    });
  }
});

// Rota para verificar status do pagamento com retry
app.get('/api/pagamentos/:pagamentoId/status', authMiddleware, async (req, res, next) => {
  try {
    const { pagamentoId } = req.params;

    const pagamentoResult = await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Pagamentos',
      Key: marshall({ pagamentoId })
    }));

    if (!pagamentoResult.Item) {
      return res.status(404).json({ 
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    const pagamento = unmarshall(pagamentoResult.Item);

    // Verificar autorização
    if (pagamento.cli_id !== req.user.cli_id) {
      return res.status(403).json({ 
        error: 'Acesso não autorizado',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Se o pagamento estiver pendente, verificar status no MercadoPago
    if (pagamento.status === 'pendente' && pagamento.mercadopago_id) {
      try {
        const payment = new Payment(mpClient);
        const mpPayment = await payment.get({ id: pagamento.mercadopago_id });

        if (mpPayment && mpPayment.status !== pagamento.mercadopago_status) {
          // Atualizar status localmente
          let novoStatus = 'pendente';
          if (['approved', 'in_process'].includes(mpPayment.status)) {
            novoStatus = 'confirmado';
          } else if (['rejected', 'cancelled', 'refunded'].includes(mpPayment.status)) {
            novoStatus = 'falha';
          }

          await dynamoDbClient.send(new PutItemCommand({
            TableName: 'Pagamentos',
            Item: marshall({
              ...pagamento,
              status: novoStatus,
              mercadopago_status: mpPayment.status,
              mercadopago_status_detail: mpPayment.status_detail,
              ultima_atualizacao: new Date().toISOString()
            }, { removeUndefinedValues: true })
          }));

          pagamento.status = novoStatus;
        }
      } catch (error) {
        console.error('Erro ao verificar status no MercadoPago:', error);
        // Continuar com o status local em caso de erro
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
      mercadopago_status: pagamento.mercadopago_status,
      mercadopago_status_detail: pagamento.mercadopago_status_detail
    });

  } catch (error) {
    next(error);
  }
});

// Health Check aprimorado
app.get('/health', async (req, res) => {
  try {
    // Verificar conexão com MercadoPago
    const payment = new Payment(mpClient);
    await payment.get({ id: '1' }).catch(() => null); // ID inválido apenas para testar conexão

    // Verificar conexão com DynamoDB
    await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Jogos',
      Key: marshall({ jog_id: 'test' })
    })).catch(() => null);

    res.json({ 
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        mercadopago: true,
        dynamodb: true
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    frontendUrl: FRONTEND_URL
  });
});

// Registrar middleware de erro
app.use(errorHandler);

// Inicialização do servidor com verificações
const startServer = async () => {
  try {
    // Verificar conexões necessárias antes de iniciar
    const payment = new Payment(mpClient);
    await payment.get({ id: '1' }).catch(() => null);
    
    await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Jogos',
      Key: marshall({ jog_id: 'test' })
    })).catch(() => null);

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
      console.log(`Frontend URL: ${FRONTEND_URL}`);
      console.log(`Webhook URL: ${BASE_URL}/api/webhook/mercadopago`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
