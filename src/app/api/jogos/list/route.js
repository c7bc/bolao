// app/api/jogos/list/route.js
import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  try {
    // 1. Verificar autorização
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não encontrado' },
        { status: 401 }
      );
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização inválido' },
        { status: 401 }
      );
    }

    // 2. Verificar e decodificar token
    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // 3. Verificar permissões
    const allowedRoles = ['admin', 'superadmin', 'colaborador', 'cliente'];
    if (!allowedRoles.includes(decodedToken.role)) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    // 4. Obter parâmetros da query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nome = searchParams.get('nome');

    // 5. Construir expressões de filtro
    let filterExpression = '';
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (status) {
      filterExpression += '#st = :status';
      expressionAttributeValues[':status'] = { S: status };
      expressionAttributeNames['#st'] = 'jog_status';
    }

    if (nome) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'contains(#nome, :nome)';
      expressionAttributeValues[':nome'] = { S: nome };
      expressionAttributeNames['#nome'] = 'jog_nome';
    }

    // 6. Configurar parâmetros do scan
    const params = {
      TableName: 'Jogos',
      ...(filterExpression && {
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
      }),
    };

    // 7. Executar scan no DynamoDB
    const command = new ScanCommand(params);
    const result = await dynamoDbClient.send(command);

    // 8. Processar resultados
    const jogos = result.Items ? result.Items.map(item => {
      const jogo = unmarshall(item);
      
      // Formatar campos de data
      if (jogo.jog_datacriacao) {
        jogo.jog_datacriacao = new Date(jogo.jog_datacriacao).toISOString();
      }
      if (jogo.jog_data_inicio) {
        jogo.jog_data_inicio = new Date(jogo.jog_data_inicio).toISOString();
      }
      if (jogo.jog_data_fim) {
        jogo.jog_data_fim = new Date(jogo.jog_data_fim).toISOString();
      }
      
      // Converter números para o formato correto
      if (jogo.jog_valorjogo) {
        jogo.jog_valorjogo = parseFloat(jogo.jog_valorjogo);
      }
      if (jogo.jog_valorpremio) {
        jogo.jog_valorpremio = parseFloat(jogo.jog_valorpremio);
      }
      
      // Se houver números sorteados como string, converter para array
      if (jogo.numeros_sorteados && typeof jogo.numeros_sorteados === 'string') {
        jogo.numeros_sorteados = jogo.numeros_sorteados.split(',').map(num => num.trim());
      }

      return jogo;
    }) : [];

    // 9. Ordenar jogos pelo campo de data mais recente
    jogos.sort((a, b) => {
      const dateA = new Date(a.jog_datacriacao || a.jog_data_inicio);
      const dateB = new Date(b.jog_datacriacao || b.jog_data_inicio);
      return dateB - dateA;
    });

    // 10. Retornar resposta
    return NextResponse.json(
      { 
        jogos,
        total: jogos.length,
        timestamp: new Date().toISOString()
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Error fetching jogos:', error);

    // 11. Tratamento específico de erros
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'Tabela ou índice não encontrado' },
        { status: 500 }
      );
    }

    // 12. Retorno genérico de erro
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}