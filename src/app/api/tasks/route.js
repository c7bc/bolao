// src/app/api/tasks/route.js

import { NextResponse } from 'next/server';
import { 
  DynamoDBClient, 
  PutItemCommand,
  UpdateCommand,
  GetItemCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// GET - Listar todas as tarefas
export async function GET(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scanCommand = new ScanCommand({
      TableName: 'Tarefas',
      Limit: 100
    });

    const scanResult = await dynamoDbClient.send(scanCommand);
    const tarefas = scanResult.Items.map(item => {
      const tarefa = unmarshall(item);
      return {
        id: tarefa.tarefaId,
        name: tarefa.nome,
        description: tarefa.descricao,
        deadline: tarefa.prazo,
        assignedTo: tarefa.responsavel,
        priority: tarefa.prioridade,
        status: tarefa.status,
        progress: tarefa.progresso,
        color: tarefa.color,
        createdAt: tarefa.dataCriacao,
        createdBy: tarefa.criadoPor
      };
    });

    return NextResponse.json({ tarefas }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Criar nova tarefa ou atividade
export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'task') {
      // Criar nova tarefa
      const { title, description, deadline, assignedTo, priority } = data;

      if (!title || !description || !deadline || !assignedTo || !priority) {
        return NextResponse.json({ error: 'Missing task fields' }, { status: 400 });
      }

      const task = {
        tarefaId: uuidv4(),
        nome: title,
        descricao: description,
        prazo: deadline,
        responsavel: assignedTo,
        prioridade: priority,
        status: 'pending',
        progresso: 0,
        dataCriacao: new Date().toISOString(),
        criadoPor: decodedToken.user_id || decodedToken.email
      };

      const putTaskCommand = new PutItemCommand({
        TableName: 'Tarefas',
        Item: marshall(task)
      });

      await dynamoDbClient.send(putTaskCommand);

      // Criar atividade para criação de tarefa
      const activity = {
        atividadeId: uuidv4(),
        text: `Nova tarefa criada: ${title}`,
        tipo: 'task_created',
        descricao: `Tarefa "${title}" foi criada.`,
        status: 'info',
        timestamp: new Date().toISOString(),
        usuario: decodedToken.user_id || decodedToken.email
      };

      const putActivityCommand = new PutItemCommand({
        TableName: 'Atividades',
        Item: marshall(activity)
      });

      await dynamoDbClient.send(putActivityCommand);

      return NextResponse.json({ task, activity }, { status: 201 });
    } else if (type === 'activity') {
      // Criar nova atividade
      const { activityType, description } = data;

      if (!activityType || !description) {
        return NextResponse.json({ error: 'Missing activity fields' }, { status: 400 });
      }

      const activity = {
        atividadeId: uuidv4(),
        tipo: activityType,
        descricao: description,
        status: 'info',
        timestamp: new Date().toISOString(),
        usuario: decodedToken.user_id || decodedToken.email
      };

      const putActivityCommand = new PutItemCommand({
        TableName: 'Atividades',
        Item: marshall(activity)
      });

      await dynamoDbClient.send(putActivityCommand);

      return NextResponse.json({ activity }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Atualizar tarefa
export async function PUT(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tarefaId, nome, descricao, prazo, responsavel, prioridade, progresso, status, color } = body;

    if (!tarefaId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Buscar tarefa atual
    const getTaskCommand = new GetItemCommand({
      TableName: 'Tarefas',
      Key: marshall({ tarefaId })
    });

    const taskResult = await dynamoDbClient.send(getTaskCommand);

    if (!taskResult.Item) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const existingTask = unmarshall(taskResult.Item);

    // Preparar expressão de atualização
    let updateExpression = 'SET ultimaAtualizacao = :updateTime';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ':updateTime': { S: new Date().toISOString() }
    };

    if (nome) {
      updateExpression += ', #nome = :nome';
      expressionAttributeNames['#nome'] = 'nome';
      expressionAttributeValues[':nome'] = { S: nome };
    }

    if (descricao) {
      updateExpression += ', descricao = :descricao';
      expressionAttributeValues[':descricao'] = { S: descricao };
    }

    if (prazo) {
      updateExpression += ', prazo = :prazo';
      expressionAttributeValues[':prazo'] = { S: prazo };
    }

    if (responsavel) {
      updateExpression += ', responsavel = :responsavel';
      expressionAttributeValues[':responsavel'] = { S: responsavel };
    }

    if (prioridade) {
      updateExpression += ', prioridade = :prioridade';
      expressionAttributeValues[':prioridade'] = { S: prioridade };
    }

    if (progresso !== undefined) {
      updateExpression += ', progresso = :progresso';
      expressionAttributeValues[':progresso'] = { N: progresso.toString() };
    }

    if (status) {
      updateExpression += ', #status = :status';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = { S: status };
    }

    if (color) {
      updateExpression += ', color = :color';
      expressionAttributeValues[':color'] = { S: color };
    }

    const updateParams = {
      TableName: 'Tarefas',
      Key: marshall({ tarefaId }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const updateCommand = new UpdateCommand(updateParams);
    const updatedTaskResult = await dynamoDbClient.send(updateCommand);
    const updatedTask = unmarshall(updatedTaskResult.Attributes);

    // Criar atividade para atualização da tarefa
    const activity = {
      atividadeId: uuidv4(),
      text: `Tarefa atualizada: ${updatedTask.nome}`,
      tipo: 'task_updated',
      descricao: `Tarefa "${updatedTask.nome}" foi atualizada.`,
      status: 'info',
      timestamp: new Date().toISOString(),
      usuario: decodedToken.user_id || decodedToken.email,
      detalhes: {
        progresso: progresso !== undefined ? `${progresso}%` : undefined,
        status: status,
      }
    };

    const putActivityCommand = new PutItemCommand({
      TableName: 'Atividades',
      Item: marshall(activity)
    });

    await dynamoDbClient.send(putActivityCommand);

    return NextResponse.json({ task: updatedTask, activity }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Excluir tarefa
export async function DELETE(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tarefaId } = await request.json();

    if (!tarefaId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Buscar informações da tarefa antes de deletar
    const getTaskCommand = new GetItemCommand({
      TableName: 'Tarefas',
      Key: marshall({ tarefaId })
    });

    const taskResult = await dynamoDbClient.send(getTaskCommand);
    if (!taskResult.Item) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = unmarshall(taskResult.Item);

    // Deletar a tarefa
    const deleteCommand = new DeleteCommand({
      TableName: 'Tarefas',
      Key: marshall({ tarefaId }),
      ReturnValues: 'ALL_OLD'
    });

    await dynamoDbClient.send(deleteCommand);

    // Criar atividade para exclusão da tarefa
    const activity = {
      atividadeId: uuidv4(),
      text: `Tarefa excluída: ${task.nome}`,
      tipo: 'task_deleted',
      descricao: `A tarefa "${task.nome}" foi excluída.`,
      status: 'warning',
      timestamp: new Date().toISOString(),
      usuario: decodedToken.user_id || decodedToken.email
    };

    const putActivityCommand = new PutItemCommand({
      TableName: 'Atividades',
      Item: marshall(activity)
    });

    await dynamoDbClient.send(putActivityCommand);

    return NextResponse.json({ 
      message: 'Task deleted successfully',
      task: unmarshall(taskResult.Item)
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
