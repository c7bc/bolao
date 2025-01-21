const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
require("dotenv").config(); // Loads environment variables from .env file

// Initialize the DynamoDB client
const ddbClient = new DynamoDBClient({
  region: "sa-east-1",
  credentials: {
    accessKeyId: "AKIA2CUNLT6IOJMTDFWG",
    secretAccessKey: "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",
  },
});

// Function to check if a table exists
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

// Function to create a table with a given configuration
const createTable = async (params) => {
  try {
    console.log(`Creating table "${params.TableName}"...`);
    const command = new CreateTableCommand(params);
    await ddbClient.send(command);
    console.log(`Table "${params.TableName}" created successfully.`);

    // Wait for the table to become active
    let tableActive = false;
    while (!tableActive) {
      const describeCommand = new DescribeTableCommand({ TableName: params.TableName });
      const response = await ddbClient.send(describeCommand);
      if (response.Table.TableStatus === "ACTIVE") {
        tableActive = true;
      } else {
        console.log(`Waiting for table "${params.TableName}" to become active...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    console.log(`Table "${params.TableName}" is now active.`);
  } catch (error) {
    console.error(`Error creating table "${params.TableName}":`, error);
    throw error;
  }
};

// Function to setup multiple tables
const setupTables = async () => {
  const tableConfigs = [
    {
      TableName: "Premiacoes",
      AttributeDefinitions: [
        { AttributeName: "premiacao_id", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "premiacao_id", KeyType: "HASH" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      TableName: "Jogos",
      AttributeDefinitions: [
        { AttributeName: "jog_id", AttributeType: "S" },
        { AttributeName: "slug", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "jog_id", KeyType: "HASH" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "slug-index",
          KeySchema: [
            { AttributeName: "slug", KeyType: "HASH" },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      TableName: "Apostas",
      AttributeDefinitions: [
        { AttributeName: "aposta_id", AttributeType: "S" },
        { AttributeName: "jog_id", AttributeType: "S" },
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
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      TableName: "Sorteios",
      AttributeDefinitions: [
        { AttributeName: "sorteio_id", AttributeType: "S" },
        { AttributeName: "jog_id", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "sorteio_id", KeyType: "HASH" },
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
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      TableName: "Cliente",
      AttributeDefinitions: [
        { AttributeName: "cli_id", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "cli_id", KeyType: "HASH" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      TableName: "HistoricoFinanceiro",
      AttributeDefinitions: [
        { AttributeName: "historico_id", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "historico_id", KeyType: "HASH" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ];

  for (const config of tableConfigs) {
    try {
      const exists = await tableExists(config.TableName);

      if (exists) {
        console.log(`Table "${config.TableName}" already exists.`);
      } else {
        await createTable(config);
      }
    } catch (error) {
      console.error(`Error setting up table ${config.TableName}:`, error);
    }
  }
};

// Run the script
setupTables();