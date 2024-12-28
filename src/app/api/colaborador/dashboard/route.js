// Caminho: src/app/api/colaborador/dashboard/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const clientesTableName = 'Cliente'; // Verifique o nome correto da tabela
const colaboradorTableName = 'Colaborador'; // Verifique o nome correto da tabela

export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token ausente.' }, { status: 400 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || decodedToken.role !== 'colaborador') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const col_id = decodedToken.col_id; // Assume que 'col_id' está no token

    // 1. Obter o nome do colaborador
    const getColaboradorParams = {
      TableName: colaboradorTableName,
      Key: {
        col_id: { S: col_id },
      },
    };

    const getColaboradorCommand = new GetItemCommand(getColaboradorParams);
    const colaboradorResult = await dynamoDbClient.send(getColaboradorCommand);

    if (!colaboradorResult.Item) {
      return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 });
    }

    const colaborador = unmarshall(colaboradorResult.Item);
    const col_nome = colaborador.col_nome;

    // 2. Consultar a tabela Cliente para obter total de clientes e comissão acumulada
    const scanClientesParams = {
      TableName: clientesTableName,
      FilterExpression: 'cli_idcolaborador = :col_id',
      ExpressionAttributeValues: {
        ':col_id': { S: col_id },
      },
    };

    const scanClientesCommand = new ScanCommand(scanClientesParams);
    const clientesResult = await dynamoDbClient.send(scanClientesCommand);

    let totalClientes = 0;
    let comissaoAcumulada = 0;

    if (clientesResult.Items && clientesResult.Items.length > 0) {
      totalClientes = clientesResult.Items.length;
      comissaoAcumulada = clientesResult.Items.reduce((acc, item) => {
        const cliente = unmarshall(item);
        const comissao = Number(cliente.comissao) || 0;
        return acc + comissao;
      }, 0);
    }

    return NextResponse.json(
      {
        col_id,
        col_nome,
        totalClientes,
        comissaoAcumulada: comissaoAcumulada.toFixed(2), // Formatação para 2 casas decimais
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao buscar dashboard do colaborador:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
