const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({
  region: "sa-east-1",
  credentials: {
    accessKeyId: "AKIA2CUNLT6IOJMTDFWG",
    secretAccessKey: "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",
  },
});

async function describeTable() {
  try {
    const tableName = "Premiacoes"; // Nome da tabela
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoDbClient.send(command);

    console.log("Estrutura da Tabela:", JSON.stringify(response.Table, null, 2));

    console.log("\n--- Chaves Primárias ---");
    console.log(`Partition Key: ${response.Table.KeySchema.find(key => key.KeyType === "HASH").AttributeName}`);
    console.log(`Sort Key: ${response.Table.KeySchema.find(key => key.KeyType === "RANGE")?.AttributeName || "Nenhuma"}`);

    if (response.Table.GlobalSecondaryIndexes) {
      console.log("\n--- Índices Secundários Globais ---");
      response.Table.GlobalSecondaryIndexes.forEach((index) => {
        console.log(`Nome do Índice: ${index.IndexName}`);
        console.log(`  Partition Key: ${index.KeySchema.find(key => key.KeyType === "HASH").AttributeName}`);
        console.log(`  Sort Key: ${index.KeySchema.find(key => key.KeyType === "RANGE")?.AttributeName || "Nenhuma"}`);
      });
    }
  } catch (error) {
    console.error("Erro ao descrever a tabela:", error);
  }
}

describeTable();
