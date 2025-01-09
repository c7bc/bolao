// Caminho: src/app/api/jogos/by-id/[id]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler GET - Busca um jogo pelo id.
 */
export async function GET(request, { params }) {
  const { id } = params; // Parâmetro dinâmico correto

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar jogo pelo id
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(getResult.Item);

    return NextResponse.json({ jogo }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar jogo por id:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler PUT - Atualiza o status de um jogo.
 */
export async function PUT(request, { params }) {
  const { id } = params; // Parâmetro dinâmico correto

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { novo_status } = await request.json();

    const statusValido = ['aberto', 'fechado', 'encerrado'];
    if (!statusValido.includes(novo_status)) {
      return NextResponse.json(
        { error: `Status inválido. Os status permitidos são: ${statusValido.join(', ')}` },
        { status: 400 }
      );
    }

    // Buscar jogo existente
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: id }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(getResult.Item);

    // Atualizar o status
    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: id }),
      UpdateExpression: 'SET jog_status = :status, jog_datamodificacao = :datamodificacao',
      ExpressionAttributeValues: marshall({
        ':status': novo_status,
        ':datamodificacao': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    // Verificar se o status foi fechado para permitir sorteio
    if (novo_status === 'fechado') {
      // Lógica para liberar sorteio pode ser adicionada aqui
    }

    return NextResponse.json({ jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Error updating jogo status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handler DELETE - Exclui um jogo pelo id.
 */
export async function DELETE(request, { params }) {
  const { id } = params; // Parâmetro dinâmico correto

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar jogo existente
    const getParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: id }),
      ProjectionExpression: 'jog_creator_id, jog_creator_role, jog_nome',
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
      decodedToken.col_id !== existingJog.jog_creator_id
    ) {
      return NextResponse.json({ error: 'Acesso negado. Você não é o criador deste jogo.' }, { status: 403 });
    }

    // Deletar o jogo
    const deleteParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: id }),
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
