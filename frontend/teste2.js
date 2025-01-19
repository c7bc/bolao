const {
    DynamoDBClient,
    UpdateTableCommand,
    DescribeTableCommand,
  } = require("@aws-sdk/client-dynamodb");
  require("dotenv").config(); // Carrega variáveis de ambiente do arquivo .env
  
  // Verifica se as credenciais estão configuradas corretamente
  if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY || !process.env.REGION) {
    console.error("As credenciais da AWS não estão configuradas corretamente no arquivo .env.");
    console.error("Certifique-se de definir ACCESS_KEY_ID, SECRET_ACCESS_KEY e REGION.");
    process.exit(1);
  }
  
  // Inicializa o cliente do DynamoDB
  const ddbClient = new DynamoDBClient({
    region: "sa-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
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
      return indexes.some((index) => index.IndexName === indexName);
    } catch (error) {
      console.error(`Erro ao verificar índice na tabela ${tableName}:`, error);
      throw error;
    }
  };
  
  // Função para adicionar índice na tabela
  const addIndexToTable = async (tableName, indexConfig) => {
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
              Projection: indexConfig.Projection,
            },
          },
        ],
      });
  
      console.log(`Criando índice "${indexConfig.IndexName}" na tabela "${tableName}"...`);
      await ddbClient.send(command);
      console.log(`Índice "${indexConfig.IndexName}" criado com sucesso.`);
  
      // Aguarda o índice ficar ativo
      let indexActive = false;
      while (!indexActive) {
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const response = await ddbClient.send(describeCommand);
        const indexes = response.Table.GlobalSecondaryIndexes || [];
        const index = indexes.find((i) => i.IndexName === indexConfig.IndexName);
        if (index && index.IndexStatus === "ACTIVE") {
          indexActive = true;
        } else {
          console.log(`Aguardando o índice "${indexConfig.IndexName}" ficar ativo...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
      console.log(`Índice "${indexConfig.IndexName}" agora está ativo.`);
    } catch (error) {
      console.error(`Erro ao adicionar índice na tabela ${tableName}:`, error);
      throw error;
    }
  };
  
  // Configuração do índice para a tabela Apostas
  const indexConfig = {
    IndexName: "jog_id-cli_id-index",
    AttributeDefinitions: [
      { AttributeName: "jog_id", AttributeType: "S" },
      { AttributeName: "cli_id", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "jog_id", KeyType: "HASH" },
      { AttributeName: "cli_id", KeyType: "RANGE" },
    ],
    Projection: { ProjectionType: "ALL" },
  };
  
  // Função principal
  const setupIndex = async () => {
    try {
      const tableName = "Apostas";
      console.log(`Verificando tabela "${tableName}"...`);
      const tableExistsCheck = await tableExists(tableName);
  
      if (!tableExistsCheck) {
        console.error(`Tabela "${tableName}" não encontrada. Crie a tabela antes de adicionar o índice.`);
        return;
      }
  
      console.log(`Tabela "${tableName}" encontrada. Verificando índice...`);
      await addIndexToTable(tableName, indexConfig);
  
      console.log("\nÍndice configurado com sucesso!");
    } catch (error) {
      console.error("Erro ao configurar o índice:", error);
      process.exit(1);
    }
  };
  
  // Executa o script
  setupIndex();
  