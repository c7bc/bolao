// src/app/api/tasks/progress/route.js

import { NextResponse } from 'next/server';
import { 
  DynamoDBClient, 
  ScanCommand, 
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../app/utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// GET - Buscar progresso das tarefas
export async function GET(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tasksProgressCommand = new ScanCommand({
      TableName: 'Tarefas',
      ProjectionExpression: 'tarefaId, nome, progresso, color',
      Limit: 100
    });

    const tasksProgressResult = await dynamoDbClient.send(tasksProgressCommand);
    const tarefasProgresso = tasksProgressResult.Items.map(item => {
      const tarefa = unmarshall(item);
      return {
        id: tarefa.tarefaId,
        name: tarefa.nome,
        progress: tarefa.progresso,
        color: tarefa.color
      };
    });

    return NextResponse.json({ tarefas: tarefasProgresso }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Atualizar progresso de uma tarefa
export async function PUT(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'financeiro', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tarefaId, progresso } = await request.json();

    if (!tarefaId || progresso === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateTaskCommand = new UpdateItemCommand({
      TableName: 'Tarefas',
      Key: {
        tarefaId: { S: tarefaId }
      },
      UpdateExpression: 'SET progresso = :progresso, ultimaAtualizacao = :updateTime',
      ExpressionAttributeValues: {
        ':progresso': { N: progresso.toString() },
        ':updateTime': { S: new Date().toISOString() }
      },
      ReturnValues: 'ALL_NEW'
    });

    const updatedTaskResult = await dynamoDbClient.send(updateTaskCommand);
    const updatedTask = unmarshall(updatedTaskResult.Attributes);

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error('Error updating task progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
