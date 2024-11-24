// src/app/api/colaborador/create/route.js (Ensure integrated creation of cliente)

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: 'AKIA2CUNLT6IOJMTDFWG',
    secretAccessKey: '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',
  },
});

const tableName = 'Colaborador';
const clienteTableName = 'Cliente';

export async function POST(request) {
  try {
    // Apenas administradores podem criar colaboradores
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'admin') {
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
    const col_id = uuidv4();

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

    const params = {
      TableName: tableName,
      Item: marshall(newColaborador),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    // Criar Cliente associado
    const cli_id = uuidv4();
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

    const clienteParams = {
      TableName: clienteTableName,
      Item: marshall(newCliente),
    };

    const clienteCommand = new PutItemCommand(clienteParams);
    await dynamoDbClient.send(clienteCommand);

    delete newColaborador.col_password;
    delete newCliente.cli_password;

    return NextResponse.json({ colaborador: newColaborador, cliente: newCliente }, { status: 201 });
  } catch (error) {
    console.error('Error creating colaborador and cliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
