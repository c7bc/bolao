// src/app/api/resultados/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../utils/auth';
import { updateGameStatuses } from '../../../utils/updateGameStatuses';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // Atualizar status dos jogos antes de qualquer operação
    await updateGameStatuses();

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
    const {
      jogo_slug,
      tipo_jogo,
      numeros,
      dezena,
      horario,
      data_sorteio,
      premio,
    } = await request.json();

    // Validação de campos obrigatórios
    if (
      !jogo_slug ||
      !tipo_jogo ||
      !data_sorteio ||
      !premio ||
      (tipo_jogo !== 'JOGO_DO_BICHO' && !numeros) ||
      (tipo_jogo === 'JOGO_DO_BICHO' && (!dezena || !horario))
    ) {
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    // Validação dos números com base no tipo de jogo
    if (tipo_jogo !== 'JOGO_DO_BICHO') {
      const numerosArray = numeros.split(',').map(num => num.trim());

      const jogoTipoLimits = {
        MEGA: { min: 6, max: 60 },
        LOTOFACIL: { min: 15, max: 25 },
      };

      const { min, max } = jogoTipoLimits[tipo_jogo] || { min: 1, max: 60 };

      if (
        numerosArray.length < min ||
        numerosArray.length > max
      ) {
        return NextResponse.json(
          { error: `A quantidade de números deve estar entre ${min} e ${max}.` },
          { status: 400 }
        );
      }

      const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
      if (!numerosValidos) {
        return NextResponse.json(
          { error: 'Os números devem conter apenas dígitos.' },
          { status: 400 }
        );
      }
    } else {
      // Para JOGO_DO_BICHO
      const validAnimals = [
        'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
        'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
        'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
        'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
        'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
      ];
      const animals = numeros.split(',').map(a => a.trim());

      const jogoTipoLimits = {
        JOGO_DO_BICHO: { min: 6, max: 25 },
      };

      const { min, max } = jogoTipoLimits[tipo_jogo] || { min: 1, max: 25 };

      if (
        animals.length < min ||
        animals.length > max
      ) {
        return NextResponse.json(
          { error: `A quantidade de animais deve estar entre ${min} e ${max}.` },
          { status: 400 }
        );
      }

      const animaisValidos = animals.every(animal => validAnimals.includes(animal));
      if (!animaisValidos) {
        return NextResponse.json(
          { error: 'Os animais devem ser válidos e separados por vírgula.' },
          { status: 400 }
        );
      }
    }

    // Geração de ID único
    const resultado_id = uuidv4();

    // Preparar dados para o DynamoDB
    const novoResultado = {
      resultado_id,
      jogo_slug,
      tipo_jogo,
      numeros: tipo_jogo !== 'JOGO_DO_BICHO' ? numeros : null,
      dezena: tipo_jogo === 'JOGO_DO_BICHO' ? dezena : null,
      horario: tipo_jogo === 'JOGO_DO_BICHO' ? horario : null,
      data_sorteio,
      premio,
    };

    const params = {
      TableName: 'Resultados',
      Item: marshall(novoResultado),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    console.log('Novo resultado inserido:', novoResultado);

    // Processar resultados e determinar vencedores
    await processarResultados(novoResultado);

    return NextResponse.json({ resultado: novoResultado }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar resultado:', error);

    if (
      error.name === 'CredentialsError' ||
      error.message.includes('credentials')
    ) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

async function processarResultados(resultado) {
  const { jogo_slug, tipo_jogo, numeros, dezena, horario, data_sorteio, premio } = resultado;

  const apostasParams = {
    TableName: 'HistoricoCliente',
    IndexName: 'jogo-slug-index',
    KeyConditionExpression: 'htc_idjogo = :jogo_slug',
    ExpressionAttributeValues: marshall({
      ':jogo_slug': jogo_slug,
    }),
  };

  const apostasCommand = new QueryCommand(apostasParams);
  const apostasResult = await dynamoDbClient.send(apostasCommand);

  const apostas = apostasResult.Items.map(item => unmarshall(item));

  console.log(`Total de apostas encontradas para o jogo ${jogo_slug}:`, apostas.length);

  for (const aposta of apostas) {
    let isWinner = false;

    if (tipo_jogo === 'MEGA' || tipo_jogo === 'LOTOFACIL') {
      const numerosSorteados = numeros.split(',').map(num => num.trim());
      const apostaNumeros = aposta.htc_cotas ? 
        Object.entries(aposta)
          .filter(([key]) => key.startsWith('htc_cota'))
          .map(([_, value]) => value.toString()) : [];
      
      const acertos = apostaNumeros.filter(num => numerosSorteados.includes(num)).length;
      const acertosParaVencer = tipo_jogo === 'MEGA' ? 6 : 15;

      if (acertos >= acertosParaVencer) {
        isWinner = true;
      }
    } else if (tipo_jogo === 'JOGO_DO_BICHO') {
      if (aposta.htc_dezena === dezena && aposta.htc_horario === horario) {
        isWinner = true;
      }
    }

    const updateApostaParams = {
      TableName: 'HistoricoCliente',
      Key: marshall({ htc_id: aposta.htc_id }),
      UpdateExpression: 'SET htc_status = :status, htc_resultado = :resultado, htc_dataupdate = :dataupdate',
      ExpressionAttributeValues: marshall({
        ':status': isWinner ? 'vencedora' : 'não vencedora',
        ':resultado': isWinner ? 'Parabéns! Você ganhou!' : 'Infelizmente, você não ganhou desta vez.',
        ':dataupdate': new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    };

    const updateApostaCommand = new UpdateItemCommand(updateApostaParams);
    await dynamoDbClient.send(updateApostaCommand);

    console.log(`Aposta ${aposta.htc_id} foi marcada como ${isWinner ? 'vencedora' : 'não vencedora'}.`);

    if (isWinner) {
      await atualizarFinanceiroApósVitoria(aposta, premio);
    }
  }
}

async function atualizarFinanceiroApósVitoria(aposta, premio) {
  const { htc_idcliente, htc_idcolaborador, htc_transactionid } = aposta;

  // Buscar dados do colaborador
  const getColaboradorParams = {
    TableName: 'Cliente',
    IndexName: 'cli_id-index',
    KeyConditionExpression: 'cli_id = :id',
    ExpressionAttributeValues: marshall({
      ':id': htc_idcliente,
    }),
  };

  const apostasCommand = new QueryCommand(getColaboradorParams);
  const colaboradorData = await dynamoDbClient.send(apostasCommand);

  if (!colaboradorData.Items || colaboradorData.Items.length === 0) {
    console.warn(`Colaborador com ID ${htc_idcolaborador} não encontrado.`);
    return;
  }

  const colaborador = unmarshall(colaboradorData.Items[0]);

  // Buscar configuração de comissão do colaborador
  const getConfigParams = {
    TableName: 'Configuracoes',
    Key: marshall({ conf_nome: 'comissao_colaborador' }),
  };

  const getConfigCommand = new QueryCommand(getConfigParams);
  const configData = await dynamoDbClient.send(getConfigCommand);

  let porcentagemComissao = 10; // Valor padrão

  if (configData.Items && configData.Items.length > 0) {
    const config = unmarshall(configData.Items[0]);
    porcentagemComissao = parseFloat(config.conf_valor);
  }

  const comissaoColaborador = (premio * porcentagemComissao) / 100;
  const comissaoAdmin = premio - comissaoColaborador;

  // Registrar comissão do colaborador
  const newFinanceiroColaborador = {
    fic_id: uuidv4(),
    fic_idcolaborador: htc_idcolaborador,
    fic_idcliente: htc_idcliente,
    fic_deposito_cliente: premio.toFixed(2),
    fic_porcentagem: porcentagemComissao,
    fic_comissao: comissaoColaborador.toFixed(2),
    fic_tipocomissao: 'prêmio',
    fic_descricao: `Comissão pela vitória da aposta ${aposta.htc_id}`,
    fic_datacriacao: new Date().toISOString(),
  };

  const putFinanceiroColaboradorParams = {
    TableName: 'Financeiro_Colaborador',
    Item: marshall(newFinanceiroColaborador),
  };

  const putFinanceiroColaboradorCommand = new PutItemCommand(putFinanceiroColaboradorParams);
  await dynamoDbClient.send(putFinanceiroColaboradorCommand);

  // Registrar comissão para o administrador
  const newFinanceiroAdministrador = {
    fid_id: uuidv4(),
    fid_id_historico_cliente: htc_transactionid,
    fid_status: 'pendente',
    fid_valor_admin: comissaoAdmin.toFixed(2),
    fid_valor_colaborador: comissaoColaborador.toFixed(2),
    fid_valor_rede: (premio - comissaoAdmin - comissaoColaborador).toFixed(2),
    fid_datacriacao: new Date().toISOString(),
  };

  const putFinanceiroAdministradorParams = {
    TableName: 'Financeiro_Administrador',
    Item: marshall(newFinanceiroAdministrador),
  };

  const putFinanceiroAdministradorCommand = new PutItemCommand(putFinanceiroAdministradorParams);
  await dynamoDbClient.send(putFinanceiroAdministradorCommand);

  console.log(`Financeiro atualizado para colaborador ${htc_idcolaborador} e administrador.`);
}
