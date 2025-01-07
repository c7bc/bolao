// src/app/api/jogos/[slug]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function PUT(request, { params }) {
  try {
    // Acessar o slug diretamente sem await
    const slug = params.slug;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const updateData = await request.json();

    // Buscar o jogo usando QueryCommand com GSI 'slug-index'
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

    const jogoAtual = unmarshall(queryResult.Items[0]);

    // Preparar UpdateExpression e ExpressionAttributeValues
    let UpdateExpression = 'SET';
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    const camposPermitidos = [
      'jog_nome',
      'slug',
      'visibleInConcursos',
      'jog_status',
      'jog_tipodojogo',
      'jog_valorjogo',
      'jog_valorpremio_est',
      'jog_quantidade_minima',
      'jog_quantidade_maxima',
      'jog_numeros',
      'jog_pontos_necessarios',
      'jog_data_inicio',
      'jog_data_fim',
    ];

    const updates = [];

    for (const campo of camposPermitidos) {
      if (updateData[campo] !== undefined) {
        if (campo === 'slug') {
          const isUnique = await isSlugUnique(updateData.slug, jogoAtual.jog_id);
          if (!isUnique) {
            return NextResponse.json({ error: 'Slug já está em uso.' }, { status: 400 });
          }
        }
        updates.push(`#${campo} = :${campo}`);
        ExpressionAttributeValues[`:${campo}`] = { 
          [typeof updateData[campo] === 'number' ? 'N' : 'S']: 
          typeof updateData[campo] === 'number' ? updateData[campo].toString() : updateData[campo] 
        };
        ExpressionAttributeNames[`#${campo}`] = campo;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    UpdateExpression += ' ' + updates.join(', ');

    const updateParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogoAtual.jog_id }),
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updateResult = await dynamoDbClient.send(updateCommand);

    const jogoAtualizado = unmarshall(updateResult.Attributes);

    return NextResponse.json({ message: 'Jogo atualizado com sucesso.', jogo: jogoAtualizado }, { status: 200 });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Acessar o slug diretamente sem await
    const slug = params.slug;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar o jogo usando QueryCommand com GSI 'slug-index'
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

    // Deletar o jogo
    const deleteParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
    };

    const deleteCommand = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(deleteCommand);

    return NextResponse.json({ message: 'Jogo deletado com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Função auxiliar para verificar unicidade do slug
const isSlugUnique = async (slug, currentJogId = null) => {
  try {
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

    if (!queryResult.Items || queryResult.Items.length === 0) return true;
    
    if (currentJogId) {
      const jogos = queryResult.Items.map(item => unmarshall(item));
      return jogos.every(jogo => jogo.jog_id === currentJogId);
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar unicidade do slug:', error);
    return false;
  }
};
