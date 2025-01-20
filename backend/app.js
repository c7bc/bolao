const express = require('express');
const cors = require('cors');
const router = express.Router();
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
const port = process.env.PORT || 3001;

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

// Configuração de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400
}));

// Configurações do Express
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});


// Inicialização do cliente MercadoPago
const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
  options: {
    timeout: 10000,
    idempotencyKey: true,
    retries: 3
  }
});

// Inicialização do DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  maxAttempts: 5,
  retryMode: 'adaptive'
});

// Middleware de erro
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

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};


// Webhook do MercadoPago
router.post('/webhook/mercadopago', async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  console.log(`[${requestId}] ===== INÍCIO WEBHOOK MERCADOPAGO =====`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[${requestId}] Body:`, JSON.stringify(req.body, null, 2));

  try {
    // Validação inicial do payload
    if (!req.body || !req.body.data || !req.body.type) {
      console.error(`[${requestId}] ERRO: Payload inválido ou incompleto`);
      return res.status(400).json({
        error: 'Payload inválido',
        details: 'Dados obrigatórios não fornecidos',
        requestId
      });
    }

    const { type, data } = req.body;
    console.log(`[${requestId}] Tipo de evento:`, type);
    console.log(`[${requestId}] ID do evento:`, data.id);

    // Validar tipo de notificação
    if (type !== 'payment') {
      console.log(`[${requestId}] Evento ignorado - Tipo diferente de payment:`, type);
      return res.json({
        message: 'Evento ignorado - Não é uma notificação de pagamento',
        type,
        requestId
      });
    }

    // Buscar dados completos do pagamento no MercadoPago
    const payment = new Payment(mpClient);
    let paymentData;
    try {
      console.log(`[${requestId}] Buscando dados do pagamento ID:`, data.id);
      paymentData = await payment.get({ id: data.id });
      
      console.log(`[${requestId}] Dados do pagamento:`, {
        id: paymentData.id,
        status: paymentData.status,
        external_reference: paymentData.external_reference,
        payment_type: paymentData.payment_type_id,
        payment_method: paymentData.payment_method.type,
        transaction_amount: paymentData.transaction_amount,
        status_detail: paymentData.status_detail,
        date_approved: paymentData.date_approved,
        date_created: paymentData.date_created,
        last_modified: paymentData.last_modified
      });
    } catch (mpError) {
      console.error(`[${requestId}] ERRO ao buscar dados do pagamento:`, {
        error: mpError.message,
        stack: mpError.stack,
        payment_id: data.id
      });
      return res.status(503).json({
        error: 'Falha ao consultar pagamento no MercadoPago',
        details: mpError.message,
        requestId
      });
    }

    // Extrair e validar referência externa (nosso ID de pagamento)
    const pagamentoId = paymentData.external_reference;
    if (!pagamentoId) {
      console.error(`[${requestId}] ERRO: external_reference não encontrada no pagamento`);
      return res.status(400).json({
        error: 'Referência do pagamento não encontrada',
        requestId
      });
    }

    // Buscar dados do pagamento no nosso banco
    let pagamentoAtual;
    try {
      console.log(`[${requestId}] Buscando pagamento no DynamoDB:`, pagamentoId);
      const pagamentoResult = await dynamoDbClient.send(new GetItemCommand({
        TableName: 'Pagamentos',
        Key: marshall({ pagamentoId })
      }));

      if (!pagamentoResult.Item) {
        console.error(`[${requestId}] ERRO: Pagamento não encontrado:`, pagamentoId);
        return res.status(404).json({
          error: 'Pagamento não encontrado no sistema',
          pagamentoId,
          requestId
        });
      }

      pagamentoAtual = unmarshall(pagamentoResult.Item);
      console.log(`[${requestId}] Pagamento encontrado:`, {
        pagamentoId,
        status_atual: pagamentoAtual.status,
        valor: pagamentoAtual.valor_total,
        data_criacao: pagamentoAtual.data_criacao
      });
    } catch (dbError) {
      console.error(`[${requestId}] ERRO ao consultar pagamento:`, {
        error: dbError.message,
        stack: dbError.stack,
        pagamentoId
      });
      return res.status(500).json({
        error: 'Erro ao consultar pagamento',
        requestId
      });
    }

    // Validar status do jogo
    let jogo;
    try {
      console.log(`[${requestId}] Validando status do jogo:`, pagamentoAtual.jog_id);
      const jogoResult = await dynamoDbClient.send(new GetItemCommand({
        TableName: 'Jogos',
        Key: marshall({ jog_id: pagamentoAtual.jog_id })
      }));

      if (!jogoResult.Item) {
        throw new Error('Jogo não encontrado');
      }

      jogo = unmarshall(jogoResult.Item);
      
      if (jogo.jog_status !== 'aberto') {
        throw new Error('Este jogo não está mais aberto para apostas');
      }

      console.log(`[${requestId}] Jogo validado:`, {
        jog_id: jogo.jog_id,
        jog_nome: jogo.jog_nome,
        jog_status: jogo.jog_status
      });
    } catch (jogoError) {
      console.error(`[${requestId}] ERRO na validação do jogo:`, {
        error: jogoError.message,
        jog_id: pagamentoAtual.jog_id
      });
      return res.status(400).json({
        error: 'Erro na validação do jogo',
        details: jogoError.message,
        requestId
      });
    }

    // Mapeamento de status do MercadoPago para nosso sistema
    const STATUS_MAP = {
      approved: 'confirmado',
      authorized: 'confirmado',
      in_process: 'processando',
      pending: 'pendente',
      rejected: 'rejeitado',
      cancelled: 'cancelado',
      refunded: 'estornado'
    };

    // Determinar novo status com base no retorno do MercadoPago
    const novoStatus = STATUS_MAP[paymentData.status] || 'pendente';
    
    // Verificar se é uma atualização relevante
    if (pagamentoAtual.status === novoStatus) {
      console.log(`[${requestId}] Status já atualizado:`, novoStatus);
      return res.json({
        message: 'Status já processado anteriormente',
        status: novoStatus,
        requestId
      });
    }

    // Se o pagamento já foi confirmado, não permitir alterações
    if (pagamentoAtual.status === 'confirmado') {
      console.log(`[${requestId}] Pagamento já confirmado anteriormente`);
      return res.json({
        message: 'Pagamento já processado e confirmado',
        pagamentoId,
        requestId
      });
    }

    // Processar apenas se for aprovado ou em processamento
    if (!['approved', 'authorized'].includes(paymentData.status)) {
      console.log(`[${requestId}] Status não processável:`, paymentData.status);
      
      // Atualizar status no banco
      await dynamoDbClient.send(new UpdateItemCommand({
        TableName: 'Pagamentos',
        Key: marshall({ pagamentoId }),
        UpdateExpression: 'SET #status = :status, mercadopago_status = :mpStatus, mercadopago_status_detail = :mpDetail, ultima_atualizacao = :now',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':status': novoStatus,
          ':mpStatus': paymentData.status,
          ':mpDetail': paymentData.status_detail,
          ':now': new Date().toISOString()
        })
      }));

      return res.json({
        message: 'Status atualizado - Não requer processamento',
        novo_status: novoStatus,
        requestId
      });
    }

    // Verificar se o valor pago corresponde ao esperado
    if (Math.abs(paymentData.transaction_amount - pagamentoAtual.valor_total) > 0.01) {
      console.error(`[${requestId}] ERRO: Valor pago diferente do esperado`, {
        valor_pago: paymentData.transaction_amount,
        valor_esperado: pagamentoAtual.valor_total
      });
      return res.status(400).json({
        error: 'Valor do pagamento inconsistente',
        requestId
      });
    }

    // Processar apostas
    console.log(`[${requestId}] Iniciando processamento de apostas`);
    const apostasProcessadas = [];
    const erros = [];

    for (const bilhete of pagamentoAtual.bilhetes) {
      try {
        const apostaId = uuidv4();
        const aposta = {
          aposta_id: apostaId,
          cli_id: pagamentoAtual.cli_id,
          jog_id: pagamentoAtual.jog_id,
          pagamentoId: pagamentoId,
          palpite_numbers: bilhete.palpite_numbers,
          valor: pagamentoAtual.valor_total / pagamentoAtual.bilhetes.length,
          status: 'confirmada',
          mercadopago_payment_id: paymentData.id,
          data_criacao: new Date().toISOString(),
          ultima_atualizacao: new Date().toISOString()
        };

        await dynamoDbClient.send(new PutItemCommand({
          TableName: 'Apostas',
          Item: marshall(aposta),
          ConditionExpression: 'attribute_not_exists(aposta_id)'
        }));

        apostasProcessadas.push(apostaId);
        console.log(`[${requestId}] Aposta registrada:`, apostaId);
      } catch (error) {
        console.error(`[${requestId}] Erro ao registrar aposta:`, error);
        erros.push({
          tipo: 'registro_aposta',
          mensagem: error.message
        });
      }
    }

    // Atualizar status do pagamento
    try {
      await dynamoDbClient.send(new UpdateItemCommand({
        TableName: 'Pagamentos',
        Key: marshall({ pagamentoId }),
        UpdateExpression: `
          SET #status = :status, 
              mercadopago_status = :mpStatus, 
              mercadopago_status_detail = :mpDetail,
              apostas_registradas = :apostas,
              ultima_atualizacao = :now,
              data_confirmacao = :now,
              #tentativas = #tentativas + :increment
        `,
        ExpressionAttributeNames: {
          '#status': 'status',
          '#tentativas': 'tentativas'
        },
        ExpressionAttributeValues: marshall({
          ':status': 'confirmado',
          ':mpStatus': paymentData.status,
          ':mpDetail': paymentData.status_detail,
          ':apostas': apostasProcessadas,
          ':now': new Date().toISOString(),
          ':increment': 1
        })
      }));

      console.log(`[${requestId}] Pagamento atualizado com sucesso:`, {
        pagamentoId,
        novo_status: 'confirmado',
        apostas_registradas: apostasProcessadas.length
      });
    } catch (updateError) {
      console.error(`[${requestId}] Erro ao atualizar pagamento:`, {
        error: updateError.message,
        stack: updateError.stack,
        pagamentoId
      });
      erros.push({
        tipo: 'atualizacao_pagamento',
        mensagem: updateError.message
      });
    }

    // Notificar cliente (implementar lógica de notificação aqui)
    try {
      // TODO: Implementar sistema de notificação
      console.log(`[${requestId}] Notificação ao cliente pendente de implementação`);
    } catch (notifyError) {
      console.error(`[${requestId}] Erro ao notificar cliente:`, notifyError);
      erros.push({
        tipo: 'notificacao_cliente',
        mensagem: notifyError.message
      });
    }

    const processTime = Date.now() - startTime;
    console.log(`[${requestId}] ===== FIM WEBHOOK MERCADOPAGO =====`);
    console.log(`[${requestId}] Tempo de processamento: ${processTime}ms`);
    console.log(`[${requestId}] Resumo:`, {
      pagamentoId,
      status: 'confirmado',
      apostas_processadas: apostasProcessadas.length,
      erros: erros.length,
      tempo: processTime
    });

    res.json({
      success: true,
      requestId,
      pagamentoId,
      status: 'confirmado',
      apostas_processadas: apostasProcessadas.length,
      erros: erros.length > 0 ? erros : undefined,
      processTime
    });

  } catch (error) {
    const processTime = Date.now() - startTime;
    console.error(`[${requestId}] ERRO CRÍTICO:`, {
      error: error.message,
      stack: error.stack,
      body: req.body,
      processTime
    });

    res.status(500).json({
      error: 'Erro interno no processamento',
      requestId,
      message: error.message,
      processTime
    });
  }
});

// Rota para verificar status do pagamento
router.get('/pagamentos/:pagamentoId/status', authMiddleware, async (req, res, next) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Consultando status do pagamento:`, req.params.pagamentoId);

  try {
    const { pagamentoId } = req.params;

    const pagamentoResult = await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Pagamentos',
      Key: marshall({ pagamentoId })
    }));

    if (!pagamentoResult.Item) {
      console.log(`[${requestId}] Pagamento não encontrado:`, pagamentoId);
      return res.status(404).json({
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND',
        requestId
      });
    }

    const pagamento = unmarshall(pagamentoResult.Item);

    // Verificar autorização
    if (pagamento.cli_id !== req.user.cli_id) {
      console.error(`[${requestId}] Tentativa de acesso não autorizado:`, {
        pagamentoId,
        cliente_solicitante: req.user.cli_id,
        cliente_pagamento: pagamento.cli_id
      });
      return res.status(403).json({
        error: 'Acesso não autorizado',
        code: 'UNAUTHORIZED_ACCESS',
        requestId
      });
    }

    // Se o pagamento estiver pendente, verificar status no MercadoPago
    if (pagamento.status === 'pendente' && pagamento.mercadopago_id) {
      try {
        console.log(`[${requestId}] Verificando status no MercadoPago:`, pagamento.mercadopago_id);
        const payment = new Payment(mpClient);
        const mpPayment = await payment.get({ id: pagamento.mercadopago_id });

        if (mpPayment && mpPayment.status !== pagamento.mercadopago_status) {
          console.log(`[${requestId}] Status atualizado no MercadoPago:`, {
            status_anterior: pagamento.mercadopago_status,
            novo_status: mpPayment.status
          });

          // Mapear status do MercadoPago para nosso sistema
          let novoStatus = 'pendente';
          if (['approved', 'authorized'].includes(mpPayment.status)) {
            novoStatus = 'confirmado';
          } else if (['rejected', 'cancelled', 'refunded'].includes(mpPayment.status)) {
            novoStatus = 'falha';
          }

          // Atualizar status no banco
          await dynamoDbClient.send(new UpdateItemCommand({
            TableName: 'Pagamentos',
            Key: marshall({ pagamentoId }),
            UpdateExpression: `
              SET #status = :status,
                  mercadopago_status = :mpStatus,
                  mercadopago_status_detail = :mpDetail,
                  ultima_atualizacao = :now
            `,
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: marshall({
              ':status': novoStatus,
              ':mpStatus': mpPayment.status,
              ':mpDetail': mpPayment.status_detail,
              ':now': new Date().toISOString()
            })
          }));

          pagamento.status = novoStatus;
          pagamento.mercadopago_status = mpPayment.status;
          pagamento.mercadopago_status_detail = mpPayment.status_detail;
        }
      } catch (mpError) {
        console.error(`[${requestId}] Erro ao verificar status no MercadoPago:`, {
          error: mpError.message,
          pagamentoId,
          mercadopago_id: pagamento.mercadopago_id
        });
        // Continuar com o status local em caso de erro
      }
    }

    // Retornar informações do pagamento
    console.log(`[${requestId}] Retornando status do pagamento:`, {
      pagamentoId,
      status: pagamento.status
    });

    res.json({
      requestId,
      pagamentoId,
      status: pagamento.status,
      data_criacao: pagamento.data_criacao,
      ultima_atualizacao: pagamento.ultima_atualizacao,
      valor_total: pagamento.valor_total,
      quantidade_bilhetes: pagamento.bilhetes?.length || 0,
      mercadopago_status: pagamento.mercadopago_status,
      mercadopago_status_detail: pagamento.mercadopago_status_detail,
      apostas_registradas: pagamento.apostas_registradas?.length || 0
    });

  } catch (error) {
    console.error(`[${requestId}] Erro ao consultar status:`, {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// Health Check
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    mercadopago: false,
    dynamodb: false
  };

  try {
    // Verificar MercadoPago
    try {
      const payment = new Payment(mpClient);
      await payment.get({ id: '1' }).catch(() => null);
      checks.mercadopago = true;
    } catch (mpError) {
      console.error('Erro na verificação do MercadoPago:', mpError);
    }

    // Verificar DynamoDB
    try {
      await dynamoDbClient.send(new GetItemCommand({
        TableName: 'Jogos',
        Key: marshall({ jog_id: 'test' })
      })).catch(() => null);
      checks.dynamodb = true;
    } catch (dbError) {
      console.error('Erro na verificação do DynamoDB:', dbError);
    }

    const status = Object.values(checks).every(Boolean) ? 'healthy' : 'degraded';
    const processTime = Date.now() - startTime;

    res.json({
      status,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      processTime,
      checks
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      processTime: Date.now() - startTime,
      checks
    });
  }
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Verificar conexões antes de iniciar
    console.log('Verificando conexões...');

    try {
      const payment = new Payment(mpClient);
      await payment.get({ id: '1' }).catch(() => null);
      console.log('✓ MercadoPago conectado');
    } catch (mpError) {
      console.warn('! MercadoPago não está respondendo:', mpError.message);
    }

    try {
      await dynamoDbClient.send(new GetItemCommand({
        TableName: 'Jogos',
        Key: marshall({ jog_id: 'test' })
      })).catch(() => null);
      console.log('✓ DynamoDB conectado');
    } catch (dbError) {
      console.warn('! DynamoDB não está respondendo:', dbError.message);
    }

    // Iniciar servidor
    app.listen(port, () => {
      console.log(`
========================================
🚀 Servidor iniciado com sucesso!
----------------------------------------
📍 Porta: ${port}
🌐 Frontend URL: ${FRONTEND_URL}
🔗 Base URL: ${BASE_URL}

📚 Rotas disponíveis:
GET  /health
GET  /test
POST /api/apostas/criar-aposta
POST /api/webhook/mercadopago
GET  /api/pagamentos/:pagamentoId/status
========================================
      `);
    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Registrar middleware de erro
app.use(errorHandler);

// Iniciar servidor
startServer();