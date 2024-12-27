// createTables.js

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const dotenv = require('dotenv');

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
  {
    TableName: "Users",
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [
          { AttributeName: "email", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Jogos",
    AttributeDefinitions: [
      { AttributeName: "jogId", AttributeType: "S" },
      { AttributeName: "slug", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "col_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" }, // Adicionado para cli_jogos-index
    ],
    KeySchema: [
      { AttributeName: "jogId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "SlugIndex",
        KeySchema: [
          { AttributeName: "slug", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "colaborador-jogos-index",
        KeySchema: [
          { AttributeName: "col_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "cli_jogos-index", // Adicionado índice cli_jogos-index
        KeySchema: [
          { AttributeName: "cli_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Financeiro",
    AttributeDefinitions: [
      { AttributeName: "financeiroId", AttributeType: "S" },
      { AttributeName: "tipo", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "financeiroId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TipoIndex",
        KeySchema: [
          { AttributeName: "tipo", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Atividades",
    AttributeDefinitions: [
      { AttributeName: "atividadeId", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" }, // Alterado para String
    ],
    KeySchema: [
      { AttributeName: "atividadeId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TimestampIndex",
        KeySchema: [
          { AttributeName: "timestamp", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Tarefas",
    AttributeDefinitions: [
      { AttributeName: "tarefaId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "tarefaId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Pagamentos",
    AttributeDefinitions: [
      { AttributeName: "pagamentoId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "N" },
    ],
    KeySchema: [
      { AttributeName: "pagamentoId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "TimestampIndex",
        KeySchema: [
          { AttributeName: "timestamp", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "ComissoesColaboradores",
    AttributeDefinitions: [
      { AttributeName: "comissaoId", AttributeType: "S" },
      { AttributeName: "colaboradorId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "comissaoId", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "ColaboradorIdIndex",
        KeySchema: [
          { AttributeName: "colaboradorId", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Financeiro_Cliente",
    AttributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "fin_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "fin_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cli_financial-index",
        KeySchema: [
          { AttributeName: "cli_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Pontuacoes_Cliente",
    AttributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "pon_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "pon_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cli_pontuacoes-index",
        KeySchema: [
          { AttributeName: "cli_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Colaborador",
    AttributeDefinitions: [
      { AttributeName: "col_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "col_id", KeyType: "HASH" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Cliente",
    AttributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "cli_idcolaborador", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "cli_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "cli_idcolaborador-index",
        KeySchema: [
          { AttributeName: "cli_idcolaborador", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Financeiro_Colaborador",
    AttributeDefinitions: [
      { AttributeName: "fic_id", AttributeType: "S" },
      { AttributeName: "fic_idcolaborador", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "fic_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "colaborador-commission-index",
        KeySchema: [
          { AttributeName: "fic_idcolaborador", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
  // Adicionando a tabela PasswordChangeCodes
  {
    TableName: "PasswordChangeCodes",
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "code", AttributeType: "S" },
      { AttributeName: "expirationTime", AttributeType: "N" },
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
];

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

const createTable = async (table) => {
  try {
    const params = table;
    const command = new CreateTableCommand(params);
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

const run = async () => {
  for (const table of tables) {
    const exists = await tableExists(table.TableName);
    if (!exists) {
      await createTable(table);
    } else {
      console.log(`Tabela ${table.TableName} já existe.`);
    }
  }
};

// Executa o script
run().catch((error) => {
  console.error("Erro ao executar o script de criação de tabelas:", error);
});
