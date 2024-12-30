// src/app/api/jogos/[slug]/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function PUT(request, { params }) {
  try {
    const { slug } = params;
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

    // Obter o jogo atual
    const getParams = {
      TableName: 'Jogos',
      IndexName: 'slug-index', // Supondo que exista um índice secundário para slug
      Key: marshall({ slug }),
    };

    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogoAtual = unmarshall(getResult.Item);

    // Preparar UpdateExpression e ExpressionAttributeValues
    let UpdateExpression = 'SET';
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    // Lista de campos permitidos para atualização
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
          // Verificar unicidade do slug
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

    // Atualizar o jogo
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

// Função auxiliar para verificar unicidade do slug
const isSlugUnique = async (slug, currentJogId = null) => {
  try {
    const token = process.env.ADMIN_TOKEN; // Caso a função esteja fora do contexto de API, ajustar conforme necessário
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/jogos/list?slug=${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data.jogos.length === 0) return true;
    if (currentJogId) {
      return response.data.jogos.every(
        (j) => j.jog_id === currentJogId
      );
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar unicidade do slug:', error);
    return false;
  }
};
