const { DynamoDBClient, CreateTableCommand, UpdateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const ddbClient = new DynamoDBClient({
  region: "sa-east-1",
  credentials: {
    accessKeyId: "AKIA2CUNLT6IOJMTDFWG",
    secretAccessKey: "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",
  },
});

// Função para verificar se a tabela existe
const tableExists = async (tableName) => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    await ddbClient.send(command);
    return true;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") return false;
    throw error;
  }
};

// Função para verificar se o índice existe
const indexExists = async (tableName, indexName) => {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await ddbClient.send(command);
    const indexes = response.Table.GlobalSecondaryIndexes || [];
    return indexes.some(index => index.IndexName === indexName);
  } catch (error) {
    console.error(`Erro ao verificar índice na tabela ${tableName}:`, error);
    throw error;
  }
};

// Função para criar tabela
const createTable = async (tableConfig) => {
  try {
    const exists = await tableExists(tableConfig.tableName);
    if (exists) {
      console.log(`Tabela "${tableConfig.tableName}" já existe.`);
      return;
    }

    const command = new CreateTableCommand({
      TableName: tableConfig.tableName,
      AttributeDefinitions: tableConfig.attributeDefinitions,
      KeySchema: tableConfig.keySchema,
      BillingMode: "PAY_PER_REQUEST",
      GlobalSecondaryIndexes: tableConfig.globalSecondaryIndexes
    });

    await ddbClient.send(command);
    console.log(`Tabela "${tableConfig.tableName}" criada com sucesso.`);
    
    // Aguarda a tabela ficar ativa
    let tableActive = false;
    while (!tableActive) {
      const describeCommand = new DescribeTableCommand({ TableName: tableConfig.tableName });
      const response = await ddbClient.send(describeCommand);
      if (response.Table.TableStatus === "ACTIVE") {
        tableActive = true;
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error(`Erro ao criar tabela ${tableConfig.tableName}:`, error);
    throw error;
  }
};

// Função para adicionar índice
const addIndex = async (tableName, indexConfig) => {
  try {
    const exists = await indexExists(tableName, indexConfig.IndexName);
    if (exists) {
      console.log(`Índice "${indexConfig.IndexName}" já existe na tabela "${tableName}".`);
      return;
    }

    const command = new UpdateTableCommand({
      TableName: tableName,
      AttributeDefinitions: indexConfig.AttributeDefinitions,
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: indexConfig.IndexName,
            KeySchema: indexConfig.KeySchema,
            Projection: { ProjectionType: "ALL" }
          }
        }
      ]
    });

    await ddbClient.send(command);
    console.log(`Índice "${indexConfig.IndexName}" criado com sucesso na tabela "${tableName}".`);
  } catch (error) {
    console.error(`Erro ao adicionar índice na tabela ${tableName}:`, error);
    throw error;
  }
};

// Configuração das tabelas e índices
const tableConfigs = [
  {
    tableName: "Colaborador",
    attributeDefinitions: [
      { AttributeName: "col_id", AttributeType: "S" }
    ],
    keySchema: [
      { AttributeName: "col_id", KeyType: "HASH" }
    ]
  },
  {
    tableName: "Cliente",
    attributeDefinitions: [
      { AttributeName: "cli_id", AttributeType: "S" },
      { AttributeName: "cli_idcolaborador", AttributeType: "S" }
    ],
    keySchema: [
      { AttributeName: "cli_id", KeyType: "HASH" }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "cli_idcolaborador-index",
        KeySchema: [{ AttributeName: "cli_idcolaborador", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" }
      }
    ]
  },
  {
    tableName: "Jogos",
    attributeDefinitions: [
      { AttributeName: "jog_id", AttributeType: "S" },
      { AttributeName: "col_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" }
    ],
    keySchema: [
      { AttributeName: "jog_id", KeyType: "HASH" }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "colaborador-jogos-index",
        KeySchema: [{ AttributeName: "col_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" }
      },
      {
        IndexName: "cli_jogos-index",
        KeySchema: [{ AttributeName: "cli_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" }
      }
    ]
  },
  {
    tableName: "Financeiro_Colaborador",
    attributeDefinitions: [
      { AttributeName: "fic_id", AttributeType: "S" },
      { AttributeName: "fic_idcolaborador", AttributeType: "S" }
    ],
    keySchema: [
      { AttributeName: "fic_id", KeyType: "HASH" }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "colaborador-commission-index",
        KeySchema: [{ AttributeName: "fic_idcolaborador", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" }
      }
    ]
  },
  {
    tableName: "personalization-config",
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    keySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ]
  }
];

// Função principal para criar/atualizar todas as tabelas e índices
const setupDatabase = async () => {
  try {
    console.log("Iniciando setup do banco de dados...\n");

    for (const config of tableConfigs) {
      console.log(`\nProcessando tabela: ${config.tableName}`);
      await createTable(config);
    }

    console.log("\nSetup concluído com sucesso!");
  } catch (error) {
    console.error("\nErro durante o setup:", error);
    process.exit(1);
  }
};

// Executa o script
setupDatabase();