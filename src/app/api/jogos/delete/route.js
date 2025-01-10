// src/app/api/jogos/delete/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, DeleteItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

export async function DELETE(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)
    ) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const { jog_id } = await request.json();

    if (!jog_id) {
      return NextResponse.json({ error: 'jog_id é obrigatório.' }, { status: 400 });
    }

    // Buscar jogo existente
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
      ProjectionExpression: 'creator_id, creator_role, jog_nome',
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const existingJog = unmarshall(getResult.Item);

    // Verificar se o usuário tem permissão para deletar o jogo
    if (
      decodedToken.role === 'colaborador' &&
      decodedToken.col_id !== existingJog.creator_id
    ) {
      return NextResponse.json({ error: 'Acesso negado. Você não é o criador deste jogo.' }, { status: 403 });
    }

    // Deletar o jogo
    const deleteParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    // Registrar atividade de deleção
    const atividade = {
      atividadeId: uuidv4(),
      text: `Jogo deletado: ${existingJog.jog_nome}`,
      tipo: 'jogo_deleted',
      descricao: `O jogo "${existingJog.jog_nome}" foi deletado.`,
      status: 'warning',
      timestamp: new Date().toISOString(),
      usuario: decodedToken.role === 'admin' || decodedToken.role === 'superadmin'
        ? decodedToken.adm_email
        : decodedToken.col_email,
    };

    const putActivityCommand = new PutItemCommand({
      TableName: 'Atividades',
      Item: marshall(atividade),
    });

    await dynamoDbClient.send(putActivityCommand);

    return NextResponse.json({ message: 'Jogo deletado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
