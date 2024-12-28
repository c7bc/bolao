// Caminho: src/app/api/colaborador/register/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto

// Função para gerar um ID numérico amigável
function generateNumericId() {
  const timestamp = Date.now(); // Obtém o timestamp atual em milissegundos
  const randomPart = Math.floor(Math.random() * 10000); // Gera uma parte aleatória de 4 dígitos
  return `${timestamp}${randomPart}`; // Combina o timestamp com a parte aleatória
}

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const colaboradorTableName = 'Colaborador'; // Verifique o nome da tabela
const clienteTableName = 'Cliente'; // Verifique o nome da tabela

/**
 * Rota POST para registrar um novo colaborador.
 */
export async function POST(request) {
  try {
    // Apenas administradores podem registrar colaboradores
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      col_nome,
      col_documento,
      col_email,
      col_telefone,
      col_rua,
      col_numero,
      col_bairro,
      col_cidade,
      col_estado,
      col_cep,
      col_password,
    } = await request.json();

    if (
      !col_nome ||
      !col_documento ||
      !col_email ||
      !col_telefone ||
      !col_password
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(col_password, 10);

    // Gerar o ID numérico amigável
    const col_id = generateNumericId();

    const newColaborador = {
      col_id,
      col_status: 'active',
      col_nome,
      col_documento,
      col_email,
      col_telefone,
      col_rua: col_rua || '',
      col_numero: col_numero || '',
      col_bairro: col_bairro || '',
      col_cidade: col_cidade || '',
      col_estado: col_estado || '',
      col_cep: col_cep || '',
      col_password: hashedPassword,
      col_datacriacao: new Date().toISOString(),
    };

    const paramsColaborador = {
      TableName: colaboradorTableName,
      Item: marshall(newColaborador),
    };

    const commandColaborador = new PutItemCommand(paramsColaborador);
    await dynamoDbClient.send(commandColaborador);

    // Criar Cliente associado
    const cli_id = generateNumericId(); // Gerar um ID numérico para o cliente
    const newCliente = {
      cli_id,
      cli_status: 'active',
      cli_nome: col_nome,
      cli_email: col_email,
      cli_telefone: col_telefone,
      cli_password: hashedPassword,
      cli_idcolaborador: col_id,
      cli_datacriacao: new Date().toISOString(),
    };

    const paramsCliente = {
      TableName: clienteTableName,
      Item: marshall(newCliente),
    };

    const commandCliente = new PutItemCommand(paramsCliente);
    await dynamoDbClient.send(commandCliente);

    // Remover a senha do retorno
    delete newColaborador.col_password;
    delete newCliente.cli_password;

    return NextResponse.json({ colaborador: newColaborador, cliente: newCliente }, { status: 201 });
  } catch (error) {
    console.error('Error registering colaborador and cliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
