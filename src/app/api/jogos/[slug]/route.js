// Caminho: src/app/api/jogos/[slug]/route.js

import { NextResponse } from 'next/server';
import {
  DynamoDBClient,
  QueryCommand,
  DeleteItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Handler DELETE - Deleta um jogo pelo slug.
 */
export async function DELETE(request, context) {
  const { slug } = context.params;

  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Buscar jogo pelo slug
    const queryParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({
        ':slug': slug,
      }),
    };

    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(queryResult.Items[0]);

    // Verificar permissões se for colaborador
    if (
      decodedToken.role === 'colaborador' &&
      decodedToken.col_id !== jogo.creator_id
    ) {
      return NextResponse.json({ error: 'Acesso negado. Você não é o criador deste jogo.' }, { status: 403 });
    }

    // Deletar o jogo
    const deleteParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    // Registrar atividade de deleção
    const atividade = {
      atividadeId: uuidv4(),
      text: `Jogo deletado: ${jogo.jog_nome}`,
      tipo: 'jogo_deleted',
      descricao: `O jogo "${jogo.jog_nome}" foi deletado.`,
      status: 'warning',
      timestamp: Date.now(), // Alterado para Number
      usuario: ['admin', 'superadmin'].includes(decodedToken.role)
        ? decodedToken.adm_email
        : decodedToken.col_email,
    };

    const putActivityParams = {
      TableName: 'Atividades',
      Item: marshall(atividade),
    };

    const putActivityCommand = new PutItemCommand(putActivityParams);
    await dynamoDbClient.send(putActivityCommand);

    return NextResponse.json({ message: 'Jogo deletado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar jogo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
