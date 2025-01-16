// src/app/api/resultados/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Função para calcular o prêmio final baseado no rateio
const calcularPremioFinal = (totalArrecadado, rateio) => {
  const premioPrincipal = totalArrecadado * (rateio.premio_principal / 100);
  const segundoPremio = totalArrecadado * (rateio.segundo_premio / 100);
  const custosAdministrativos = totalArrecadado * (rateio.custos_administrativos / 100);
  const comissaoColaboradores = totalArrecadado * (rateio.comissao_colaboradores / 100);
  return {
    premioPrincipal,
    segundoPremio,
    custosAdministrativos,
    comissaoColaboradores,
  };
};

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      concurso,
      tipo_jogo,
      numeros,
      data_sorteio,
    } = await request.json();

    // Validar campos obrigatórios
    if (!concurso || !tipo_jogo || !numeros || !data_sorteio) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Buscar o jogo correspondente
    const jogoParams = {
      TableName: 'Jogos',
      IndexName: 'jog_nome-index', // Supondo que exista um índice secundário para jog_nome
      Key: marshall({ jog_nome: concurso }),
    };

    const { GetItemCommand } = require('@aws-sdk/client-dynamodb');
    const getCommand = new GetItemCommand(jogoParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 404 });
    }

    const jogo = unmarshall(getResult.Item);

    if (jogo.jog_status !== 'closed') {
      return NextResponse.json({ error: 'O jogo não está no status fechado.' }, { status: 400 });
    }

    // Buscar as configurações de rateio
    const rateioParams = {
      TableName: 'Rateio',
    };
    const scanCommand = new ScanCommand(rateioParams);
    const rateioResult = await dynamoDbClient.send(scanCommand);
    const rateio = unmarshall(rateioResult.Items[0]); // Assumindo que há apenas um rateio configurado

    // Calcular prêmio final
    const totalArrecadado = jogo.jog_valorjogo * (jogo.jog_quantidade_maxima || 1); // Ajustar conforme a lógica real
    const premios = calcularPremioFinal(totalArrecadado, rateio);

    // Criar resultado
    const resultado_id = uuidv4();
    const resultadoItem = {
      res_id: resultado_id,
      jog_id: jogo.jog_id,
      res_numeros_sorteados: numeros,
      ganhadores_verificados: true, // Após registro, assumindo que os ganhadores são verificados
      res_premio_principal: premios.premioPrincipal,
      res_segundo_premio: premios.segundoPremio,
      res_custos_administrativos: premios.custosAdministrativos,
      res_comissao_colaboradores: premios.comissaoColaboradores,
      res_data_sorteio: data_sorteio,
    };

    const putResultadoParams = {
      TableName: 'Resultados',
      Item: marshall(resultadoItem),
    };

    const putResultadoCommand = new PutItemCommand(putResultadoParams);
    await dynamoDbClient.send(putResultadoCommand);

    // Atualizar o status do jogo para 'ended'
    const updateJogoParams = {
      TableName: 'Jogos',
      Key: marshall({ jog_id: jogo.jog_id }),
      UpdateExpression: 'SET jog_status = :newStatus, jog_valorpremio_final = :premioFinal',
      ExpressionAttributeValues: {
        ':newStatus': { S: 'ended' },
        ':premioFinal': { N: premios.premioPrincipal.toString() }, // Armazenar apenas o prêmio principal como exemplo
      },
      ReturnValues: 'ALL_NEW',
    };

    const updateJogoCommand = new UpdateItemCommand(updateJogoParams);
    await dynamoDbClient.send(updateJogoCommand);

    return NextResponse.json({ message: 'Resultado registrado e jogo encerrado com sucesso.', resultado: resultadoItem }, { status: 201 });
  } catch (error) {
    console.error('Error registering result:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
