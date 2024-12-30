// createTables.js

const {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
const dotenv = require("dotenv");

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o cliente DynamoDB
const ddbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Definição das tabelas com BillingMode PAY_PER_REQUEST
const tables = [
  // Tabela de Usuários
  {
    TableName: "Users",
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela de Jogos
  {
    TableName: "Jogos",
    AttributeDefinitions: [
      { AttributeName: "jogId", AttributeType: "S" },
      { AttributeName: "slug", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "col_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "jogId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "SlugIndex",
        KeySchema: [{ AttributeName: "slug", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "colaborador-jogos-index",
        KeySchema: [{ AttributeName: "col_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "cli_jogos-index",
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Financeiro
  {
    TableName: "Financeiro",
    AttributeDefinitions: [
      { AttributeName: "financeiroId", AttributeType: "S" },
      { AttributeName: "tipo", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "financeiroId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TipoIndex",
        KeySchema: [{ AttributeName: "tipo", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Atividades
  {
    TableName: "Atividades",
    AttributeDefinitions: [
      { AttributeName: "atividadeId", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "atividadeId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TimestampIndex",
        KeySchema: [{ AttributeName: "timestamp", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Tarefas
  {
    TableName: "Tarefas",
    AttributeDefinitions: [
      { AttributeName: "tarefaId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "tarefaId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "StatusIndex",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Pagamentos
  {
    TableName: "Pagamentos",
    AttributeDefinitions: [
      { AttributeName: "pagamentoId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "N" },
    ],
    KeySchema: [{ AttributeName: "pagamentoId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "StatusIndex",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "TimestampIndex",
        KeySchema: [{ AttributeName: "timestamp", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Comissões dos Colaboradores
  {
    TableName: "ComissoesColaboradores",
    AttributeDefinitions: [
      { AttributeName: "comissaoId", AttributeType: "S" },
      { AttributeName: "colaboradorId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "comissaoId", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "ColaboradorIdIndex",
        KeySchema: [{ AttributeName: "colaboradorId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Financeiro do Cliente
  {
    TableName: "Financeiro_Cliente",
    AttributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "fin_id", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "fin_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cli_financial-index",
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Pontuações do Cliente
  {
    TableName: "Pontuacoes_Cliente",
    AttributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "pon_id", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "pon_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cli_pontuacoes-index",
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Colaborador
  {
    TableName: "Colaborador",
    AttributeDefinitions: [{ AttributeName: "col_id", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "col_id", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Cliente
  {
    TableName: "Cliente",
    AttributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "cli_idcolaborador", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cli_idcolaborador-index",
        KeySchema: [{ AttributeName: "cli_idcolaborador", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Financeiro do Colaborador
  {
    TableName: "Financeiro_Colaborador",
    AttributeDefinitions: [
      { AttributeName: "fic_id", AttributeType: "S" },
      { AttributeName: "fic_idcolaborador", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "fic_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "colaborador-commission-index",
        KeySchema: [{ AttributeName: "fic_idcolaborador", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela PasswordChangeCodes
  {
    TableName: "PasswordChangeCodes",
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "code", AttributeType: "S" },
      { AttributeName: "expirationTime", AttributeType: "N" },
    ],
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Ganhadores
  {
    TableName: "Ganhadores",
    AttributeDefinitions: [
      { AttributeName: "ganhador_id", AttributeType: "S" },
      { AttributeName: "resultado_id", AttributeType: "S" },
      { AttributeName: "jog_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "ganhador_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "resultado-jog-index",
        KeySchema: [
          { AttributeName: "resultado_id", KeyType: "HASH" },
          { AttributeName: "jog_id", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "cli_id-index",
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Resultados
  {
    TableName: "Resultados",
    AttributeDefinitions: [
      { AttributeName: "resultado_id", AttributeType: "S" },
      { AttributeName: "jog_id", AttributeType: "S" },
      { AttributeName: "col_id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "numeros", AttributeType: "S" },
      { AttributeName: "data_sorteio", AttributeType: "S" },
      { AttributeName: "jogo_slug", AttributeType: "S" }, // Necessário para JogoSlugIndex
    ],
    KeySchema: [{ AttributeName: "resultado_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "col_id-index",
        KeySchema: [{ AttributeName: "col_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "jog_id-index",
        KeySchema: [{ AttributeName: "jog_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "JogoSlugIndex",
        KeySchema: [{ AttributeName: "jogo_slug", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela Apostas
  {
    TableName: "Apostas",
    AttributeDefinitions: [
      { AttributeName: "aposta_id", AttributeType: "S" },
      { AttributeName: "jog_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "aposta_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "jog_id-index",
        KeySchema: [{ AttributeName: "jog_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "cliente-id-index", // Atualizado para alinhar com as APIs
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Tabela HistoricoCliente
  {
    TableName: "HistoricoCliente",
    AttributeDefinitions: [
      { AttributeName: "htc_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "tipo", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "htc_id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cliente-id-index",
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Adicione outras tabelas necessárias conforme suas APIs
];

// Função para verificar se uma tabela já existe
const tableExists = async (tableName) => {
  try {
    const command = new ListTablesCommand({});
    const response = await ddbClient.send(command);
    return response.TableNames.includes(tableName);
  } catch (error) {
    console.error(`Erro ao listar tabelas: ${error}`);
    throw error;
  }
};

// Função para criar uma tabela
const createTable = async (table) => {
  try {
    const command = new CreateTableCommand(table);
    await ddbClient.send(command);
    console.log(`Tabela ${table.TableName} criada com sucesso.`);
  } catch (err) {
    if (err.name === "ResourceInUseException") {
      console.log(`Tabela ${table.TableName} já existe.`);
    } else {
      console.error(`Erro ao criar tabela ${table.TableName}:`, err);
    }
  }
};

// Função principal para executar a criação das tabelas
const run = async () => {
  for (const table of tables) {
    const exists = await tableExists(table.TableName);
    if (!exists) {
      await createTable(table);
      // Os GSIs são automaticamente criados conforme definidos na criação da tabela
    } else {
      console.log(`Tabela ${table.TableName} já existe.`);
      // Opcional: Verificar e criar GSIs adicionais se necessário
    }
  }
};

// Executa o script
run().catch((error) => {
  console.error("Erro ao executar o script de criação de tabelas:", error);
});
