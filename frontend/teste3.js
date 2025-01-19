const { DynamoDBClient, UpdateItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

const ddbClient = new DynamoDBClient({
  region: "sa-east-1",
});

const atualizarAtributos = async () => {
  try {
    const params = {
      TableName: "Apostas",
      Key: marshall({
        jog_id: "exemplo-jogo-123",
        cli_id: "cliente-456",
      }),
      UpdateExpression: "SET pago = :pago, data_pagamento = :data_pagamento",
      ExpressionAttributeValues: marshall({
        ":pago": true, // Novo atributo `pago`
        ":data_pagamento": new Date().toISOString(), // Novo atributo `data_pagamento`
      }),
      ReturnValues: "ALL_NEW",
    };

    const command = new UpdateItemCommand(params);
    const result = await ddbClient.send(command);
    console.log("Item atualizado com sucesso:", result);
  } catch (error) {
    console.error("Erro ao atualizar o item:", error);
  }
};

atualizarAtributos();
