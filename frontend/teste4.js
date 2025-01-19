const {
    DynamoDBClient,
    CreateTableCommand,
    DescribeTableCommand,
  } = require("@aws-sdk/client-dynamodb");
  require("dotenv").config(); // Carrega variáveis de ambiente do arquivo .env
  
  // Inicializa o cliente do DynamoDB
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
  
  // Função para criar a tabela
  const createTable = async () => {
    const tableName = "Premiacoes";
  
    const params = {
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "slug", AttributeType: "S" }, // Identificador do jogo
        { AttributeName: "cli_id_categoria", AttributeType: "S" }, // Cliente + Categoria
      ],
      KeySchema: [
        { AttributeName: "slug", KeyType: "HASH" }, // Chave de partição
        { AttributeName: "cli_id_categoria", KeyType: "RANGE" }, // Chave de ordenação
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };
  
    try {
      console.log(`Criando tabela "${tableName}"...`);
      const command = new CreateTableCommand(params);
      await ddbClient.send(command);
      console.log(`Tabela "${tableName}" criada com sucesso.`);
  
      // Aguarda a tabela ficar ativa
      let tableActive = false;
      while (!tableActive) {
        const describeCommand = new DescribeTableCommand({ TableName: tableName });
        const response = await ddbClient.send(describeCommand);
        if (response.Table.TableStatus === "ACTIVE") {
          tableActive = true;
        } else {
          console.log(`Aguardando a tabela "${tableName}" ficar ativa...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
      console.log(`Tabela "${tableName}" agora está ativa.`);
    } catch (error) {
      console.error(`Erro ao criar a tabela "${tableName}":`, error);
      throw error;
    }
  };
  
  // Função principal
  const setupTable = async () => {
    const tableName = "Premiacoes";
  
    try {
      const exists = await tableExists(tableName);
  
      if (exists) {
        console.log(`Tabela "${tableName}" já existe.`);
      } else {
        await createTable();
      }
    } catch (error) {
      console.error("Erro ao configurar tabela:", error);
      process.exit(1);
    }
  };
  
  // Executa o script
  setupTable();
  