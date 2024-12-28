// createTables.js

const { DynamoDBClient, CreateTableCommand, ListTablesCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
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
  // Tabela de Usuários
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
        IndexName: "cli_jogos-index",
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
  // Tabela Financeiro
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
  // Tabela Atividades
  {
    TableName: "Atividades",
    AttributeDefinitions: [
      { AttributeName: "atividadeId", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" },
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
  // Tabela Tarefas
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
  // Tabela Pagamentos
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
  // Tabela Comissões dos Colaboradores
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
  // Tabela Financeiro do Cliente
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
  // Tabela Pontuações do Cliente
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
  // Tabela Colaborador
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
  // Tabela Cliente
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
  // Tabela Financeiro do Colaborador
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
  // Tabela PasswordChangeCodes
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
  // Tabela Ganhadores
  {
    TableName: "Ganhadores",
    AttributeDefinitions: [
      { AttributeName: "ganhador_id", AttributeType: "S" },
      { AttributeName: "resultado_id", AttributeType: "S" },
      { AttributeName: "jog_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "ganhador_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "resultado-jog-index",
        KeySchema: [
          { AttributeName: "resultado_id", KeyType: "HASH" },
          { AttributeName: "jog_id", KeyType: "RANGE" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "cli_id-index",
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
    ],
    KeySchema: [
      { AttributeName: "resultado_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "col_id-index",
        KeySchema: [
          { AttributeName: "col_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "jog_id-index",
        KeySchema: [
          { AttributeName: "jog_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
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
    KeySchema: [
      { AttributeName: "aposta_id", KeyType: "HASH" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "jog_id-index",
        KeySchema: [
          { AttributeName: "jog_id", KeyType: "HASH" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
      {
        IndexName: "cli_id-index",
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
  // Tabela Ganhadores
  // (Incluído anteriormente)
  // Você pode adicionar outras tabelas necessárias conforme suas APIs
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

// Função para verificar se um índice existe em uma tabela
const indexExists = async (tableName, indexName) => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await ddbClient.send(command);
    const indexes = response.Table.GlobalSecondaryIndexes || [];
    return indexes.some(index => index.IndexName === indexName);
  } catch (error) {
    console.error(`Erro ao descrever tabela ${tableName}: ${error}`);
    throw error;
  }
};

// Função para criar índices secundários se não existirem
const createIndexes = async (table) => {
  const tableName = table.TableName;
  const existingIndexes = await getExistingIndexes(tableName);

  if (table.GlobalSecondaryIndexes && table.GlobalSecondaryIndexes.length > 0) {
    for (const index of table.GlobalSecondaryIndexes) {
      if (!existingIndexes.includes(index.IndexName)) {
        try {
          // Nota: A AWS SDK para Node.js não suporta a criação de índices secundários após a criação da tabela em modo PAY_PER_REQUEST
          // Portanto, os índices secundários devem ser definidos no momento da criação da tabela.
          console.warn(`Índice secundário ${index.IndexName} na tabela ${tableName} não existe e não pode ser criado após a criação da tabela com BillingMode PAY_PER_REQUEST.`);
        } catch (error) {
          console.error(`Erro ao criar índice ${index.IndexName} na tabela ${tableName}:`, error);
        }
      } else {
        console.log(`Índice secundário ${index.IndexName} já existe na tabela ${tableName}.`);
      }
    }
  }
};

// Função para obter índices existentes de uma tabela
const getExistingIndexes = async (tableName) => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await ddbClient.send(command);
    const indexes = response.Table.GlobalSecondaryIndexes || [];
    return indexes.map(index => index.IndexName);
  } catch (error) {
    console.error(`Erro ao descrever tabela ${tableName}: ${error}`);
    throw error;
  }
};

// Função principal para executar a criação das tabelas
const run = async () => {
  for (const table of tables) {
    const exists = await tableExists(table.TableName);
    if (!exists) {
      await createTable(table);
      // Após criação, não é possível adicionar índices secundários em modo PAY_PER_REQUEST
      // Portanto, certifique-se de que todos os índices estão definidos na definição da tabela
    } else {
      console.log(`Tabela ${table.TableName} já existe.`);
      // Verificar se todos os índices secundários existem
      await createIndexes(table);
    }
  }
};

// Executa o script
run().catch((error) => {
  console.error("Erro ao executar o script de criação de tabelas:", error);
});
