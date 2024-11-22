import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const {
      cli_nome,
      cli_email,
      cli_telefone,
      cli_password,
      cli_idcolaborador,
    } = await request.json();

    // Verificar campos obrigatórios
    if (!cli_nome || !cli_email || !cli_telefone || !cli_password) {
      console.log('Campos obrigatórios ausentes:', {
        cli_nome,
        cli_email,
        cli_telefone,
        cli_password,
      });
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(cli_password, 10);
    const cli_id = uuidv4();

    const newCliente = {
      cli_id,
      cli_status: 'active',
      cli_nome,
      cli_email,
      cli_telefone,
      cli_password: hashedPassword,
      cli_idcolaborador: cli_idcolaborador || null,
      cli_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: 'Cliente',
      Item: marshall(newCliente),
    };

    console.log('Tentando salvar no DynamoDB com os parâmetros:', params);

    // Tentar salvar o item no DynamoDB
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Logar sucesso
    console.log('Cliente registrado com sucesso:', newCliente);

    // Remover informações sensíveis antes de enviar a resposta
    delete newCliente.cli_password;
    return NextResponse.json({ cliente: newCliente }, { status: 201 });
  } catch (error) {
    // Logar detalhes do erro
    console.error('Erro durante a operação no DynamoDB:', error);

    // Preparar detalhes adicionais do erro
    const errorDetails = {
      message: error.message || 'Erro desconhecido.',
      name: error.name || 'Error',
      code: error.code || 'UNKNOWN_ERROR',
      stack: error.stack || null, // Cuidado ao expor a stack em produção
    };

    // Retornar resposta JSON com detalhes do erro
    return NextResponse.json(
      {
        error: 'Erro Interno do Servidor',
        details: errorDetails,
        // Remover env para evitar exposição de informações sensíveis
        // Se necessário, adicione apenas variáveis específicas
        // env: {
        //   AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
        //   // Adicione outras variáveis necessárias para depuração
        // },
      },
      { status: 500 }
    );
  }
}
