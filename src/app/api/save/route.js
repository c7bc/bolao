import {
  DynamoDBClient,
  DescribeTableCommand
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

// Nome da tabela DynamoDB
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'personalization-config';

// Criação do cliente DynamoDB de baixo nível
const client = new DynamoDBClient({
  region: 'sa-east-1', // Região da AWS
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID, // Credenciais da AWS
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

// Criação do DocumentClient para operações de alto nível
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Função POST - para salvar os dados no DynamoDB
 */
export async function POST(req) {
  try {
    // Verifica se a tabela existe
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    
    const data = await req.json();

    if (!data) {
      return new Response(JSON.stringify({ message: 'Nenhum dado fornecido' }), { status: 400 });
    }

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: 'personalization-config', // Chave primária
        ...data // Dados enviados no corpo da requisição
      }
    };

    // Inserindo os dados na tabela usando o DocumentClient
    await docClient.send(new PutCommand(params));
    
    return new Response(JSON.stringify({ message: 'Dados salvos com sucesso' }), { status: 200 });
  } catch (error) {
    console.error('Erro ao salvar no DynamoDB:', error);
    return new Response(JSON.stringify({ message: 'Erro ao salvar os dados' }), { status: 500 });
  }
}

/**
 * Função GET - para buscar os dados no DynamoDB
 */
export async function GET() {
  try {
    // Verifica se a tabela existe
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: 'personalization-config' // Chave primária que estamos buscando
      }
    };

    // Buscando os dados na tabela usando o DocumentClient
    const result = await docClient.send(new GetCommand(params));
    
    // Verificar se o item foi encontrado
    if (!result.Item) {
      return new Response(JSON.stringify({ message: 'Configuração não encontrada' }), { status: 404 });
    }
    
    return new Response(JSON.stringify(result.Item), { status: 200 }); // Retorna o item encontrado
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return new Response(JSON.stringify({ message: 'Erro ao buscar os dados' }), { status: 500 });
  }
}
