const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { fromIni } = require('@aws-sdk/credential-providers');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || '43027bae66101fbad9c1ef4eb02e8158f5e2afa34b60f11144da6ea80dbdce68';

app.use(cors());
app.use(express.json());

const validateAwsCredentials = () => {
  const accessKeyId = process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Credenciais AWS não configuradas corretamente');
  }
  
  return {
    accessKeyId,
    secretAccessKey
  };
};

const getDynamoDbClient = () => {
  try {
    const credentials = validateAwsCredentials();
    
    return new DynamoDBClient({
      region: process.env.AWS_REGION || 'sa-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      },
      maxAttempts: 3
    });
  } catch (error) {
    console.error('Erro ao configurar cliente DynamoDB:', error);
    throw error;
  }
};

const dynamoDbClient = getDynamoDbClient();

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-55618797280028-060818-68d1e833bfaf1109f2b4038e232f544e-47598575'
});

const validateBetData = (req, res, next) => {
  const { jogo_id, bilhetes, valor_total } = req.body;

  if (!jogo_id || !bilhetes || valor_total === undefined) {
    return res.status(400).json({ 
      error: 'Dados incompletos',
      details: 'jogo_id, bilhetes e valor_total são obrigatórios'
    });
  }

  if (!Array.isArray(bilhetes) || bilhetes.length === 0) {
    return res.status(400).json({ 
      error: 'Formato inválido',
      details: 'bilhetes deve ser um array não vazio'
    });
  }

  for (const bilhete of bilhetes) {
    if (!Array.isArray(bilhete.palpite_numbers) || bilhete.palpite_numbers.length === 0) {
      return res.status(400).json({ 
        error: 'Formato inválido',
        details: 'Cada bilhete deve conter um array não vazio de palpite_numbers'
      });
    }
  }

  if (typeof valor_total !== 'number' || valor_total <= 0) {
    return res.status(400).json({ 
      error: 'Valor inválido',
      details: 'valor_total deve ser um número positivo'
    });
  }

  next();
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userParams = {
      TableName: 'Cliente',
      Key: marshall({
        cli_id: decoded.cli_id
      })
    };

    try {
      const userCommand = new GetItemCommand(userParams);
      const userResult = await dynamoDbClient.send(userCommand);

      if (!userResult.Item) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const user = unmarshall(userResult.Item);
      
      const activeStatuses = ['active', 'ativo', 'ACTIVE', 'ATIVO', 1, '1', true];
      if (!activeStatuses.includes(user.cli_status)) {
        return res.status(403).json({ 
          error: 'Usuário inativo',
          details: 'Sua conta está atualmente inativa. Entre em contato com o suporte para mais informações.'
        });
      }

      req.user = {
        cli_id: decoded.cli_id,
        email: user.email,
        name: user.nome,
        status: user.status
      };
      
      next();
    } catch (dbError) {
      console.error('Erro ao acessar o DynamoDB:', dbError);
      return res.status(500).json({ error: 'Erro ao validar usuário' });
    }
  } catch (error) {
    console.error('Erro de autenticação:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

app.post('/api/apostas/criar-aposta', [authMiddleware, validateBetData], async (req, res) => {
  try {
    const { jogo_id, bilhetes, valor_total, return_url } = req.body;

    const jogoParams = {
      TableName: 'Jogos',
      Key: marshall({
        jog_id: jogo_id
      })
    };

    const jogoCommand = new GetItemCommand(jogoParams);
    const jogoResult = await dynamoDbClient.send(jogoCommand);

    if (!jogoResult.Item) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    const jogo = unmarshall(jogoResult.Item);
    if (jogo.jog_status !== 'aberto') {
      return res.status(400).json({ error: 'Este jogo não está aberto para apostas' });
    }

    const valorPorBilhete = parseFloat(jogo.jog_valorBilhete || 0);
    const valorTotalEsperado = valorPorBilhete * bilhetes.length;
    
    if (Math.abs(valor_total - valorTotalEsperado) > 0.01) {
      return res.status(400).json({ 
        error: 'Valor total inválido',
        details: `O valor total deve ser ${valorTotalEsperado} para ${bilhetes.length} bilhete(s)`
      });
    }

    const pagamentoId = uuidv4();

    const preference = new Preference(client);
    const preferenceData = {
      body: {
        items: [
          {
            title: `Bilhete - ${jogo.titulo || 'Bolão'}`,
            unit_price: parseFloat(valor_total),
            quantity: 1,
            currency_id: "BRL"
          }
        ],
        external_reference: pagamentoId,
        back_urls: {
          success: return_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bolao/${jogo.slug}`,
          failure: return_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bolao/${jogo.slug}`,
          pending: return_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bolao/${jogo.slug}`
        },
        auto_return: "approved",
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhook/mercadopago`
      }
    };

    const result = await preference.create(preferenceData);

    const pagamento = {
      pagamentoId,
      cli_id: req.user.cli_id,
      jog_id: jogo_id,
      valor_total,
      status: 'pendente',
      mercadopago_id: result.id,
      bilhetes: bilhetes.map(bilhete => ({
        ...bilhete,
        status: 'pendente',
        data_criacao: new Date().toISOString()
      })),
      data_criacao: new Date().toISOString(),
      ultima_atualizacao: new Date().toISOString()
    };

    await dynamoDbClient.send(new PutItemCommand({
      TableName: 'Pagamentos',
      Item: marshall(pagamento, { removeUndefinedValues: true })
    }));

    res.json({
      checkout_url: result.init_point,
      pagamentoId
    });

  } catch (error) {
    console.error('Erro ao criar aposta:', error);
    
    if (error.name === 'MercadoPagoError') {
      return res.status(400).json({ 
        error: 'Erro no processamento do pagamento',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno ao processar aposta, tente logar novamente.',
      details: error.message
    });
  }
});

app.post('/api/webhook/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const payment = await client.payment.findById(data.id);
      const pagamentoId = payment.external_reference;

      const pagamentoResult = await dynamoDbClient.send(new GetItemCommand({
        TableName: 'Pagamentos',
        Key: marshall({
          pagamentoId: pagamentoId
        })
      }));

      if (!pagamentoResult.Item) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      const pagamento = unmarshall(pagamentoResult.Item);

      const novoStatus = payment.status === 'approved' ? 'confirmado' 
        : (payment.status === 'rejected' || payment.status === 'cancelled') ? 'falha' 
        : 'pendente';

      if (payment.status === 'approved') {
        const jogoCommand = new GetItemCommand({
          TableName: 'Jogos',
          Key: marshall({
            jog_id: pagamento.jog_id
          })
        });
        
        const jogoResult = await dynamoDbClient.send(jogoCommand);
        
        if (!jogoResult.Item) {
          throw new Error('Jogo não encontrado');
        }
        
        const jogo = unmarshall(jogoResult.Item);
        if (jogo.status !== 'aberto') {
          throw new Error('Jogo não está mais aberto para apostas');
        }

        for (const bilhete of pagamento.bilhetes) {
          const aposta = {
            aposta_id: uuidv4(),
            cli_id: pagamento.cli_id,
            jog_id: pagamento.jog_id,
            palpite_numbers: bilhete.palpite_numbers,
            valor: pagamento.valor_total / pagamento.bilhetes.length,
            pagamentoId: pagamento.pagamentoId,
            status: 'confirmada',
            data_criacao: new Date().toISOString(),
            ultima_atualizacao: new Date().toISOString()
          };

          await dynamoDbClient.send(new PutItemCommand({
            TableName: 'Apostas',
            Item: marshall(aposta, { removeUndefinedValues: true })
          }));
        }
      }

      const pagamentoAtualizado = {
        ...pagamento,
        status: novoStatus,
        ultima_atualizacao: new Date().toISOString()
      };

      await dynamoDbClient.send(new PutItemCommand({
        TableName: 'Pagamentos',
        Item: marshall(pagamentoAtualizado, { removeUndefinedValues: true })
      }));
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ 
      error: 'Erro ao processar webhook',
      details: error.message
    });
  }
});

app.get('/api/pagamentos/:pagamentoId/status', authMiddleware, async (req, res) => {
  try {
    const { pagamentoId } = req.params;

    const pagamentoResult = await dynamoDbClient.send(new GetItemCommand({
      TableName: 'Pagamentos',
      Key: marshall({
        pagamentoId: pagamentoId
      })
    }));

    if (!pagamentoResult.Item) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    const pagamento = unmarshall(pagamentoResult.Item);

    if (pagamento.cli_id !== req.user.cli_id) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    res.json({ 
      status: pagamento.status,
      data_criacao: pagamento.data_criacao,
      ultima_atualizacao: pagamento.ultima_atualizacao,
      valor_total: pagamento.valor_total,
      quantidade_bilhetes: pagamento.bilhetes?.length || 0
    });

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar status do pagamento',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});