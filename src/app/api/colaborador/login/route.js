// Caminho: src/app/api/colaborador/login/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/auth'; // Ajuste o caminho conforme a estrutura do seu projeto
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const tableName = 'Colaborador'; // Verifique o nome da tabela

/**
 * Rota POST para login de colaborador.
 */
export async function POST(request) {
  try {
    const { cli_telefone, cli_password, documento } = await request.json();

    if (!cli_telefone || !cli_password || !documento) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    // Usando Scan para buscar pelo telefone e documento
    const params = {
      TableName: tableName,
      FilterExpression: 'col_telefone = :telefone AND col_documento = :documento',
      ExpressionAttributeValues: {
        ':telefone': { S: cli_telefone },
        ':documento': { S: documento },
      },
    };

    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 400 });
    }

    // Desmarshalling do item retornado
    const colaborador = unmarshall(result.Items[0]);

    // Verificar a senha
    const passwordMatch = await bcrypt.compare(cli_password, colaborador.col_password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 400 });
    }

    // Gerar o token JWT
    const token = generateToken({ col_id: colaborador.col_id, role: 'colaborador' });
    delete colaborador.col_password; // Remover a senha do retorno

    return NextResponse.json({ colaborador, token }, { status: 200 });
  } catch (error) {
    console.error('Erro no login do colaborador:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
