// src/app/utils/processarResultados.js

import { DynamoDBClient, QueryCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

// Função para processar resultados
export async function processarResultados(resultado) {
  const { jogo_slug, tipo_jogo, numeros, dezena, horario, data_sorteio, premio } = resultado;

  // 1. Buscar todas as apostas pendentes para este jogo
  const apostasParams = {
    TableName: 'HistoricoCliente',
    IndexName: 'jogo-slug-index', // Assegure-se que este GSI existe
    KeyConditionExpression: 'htc_idjogo = :jogo_slug',
    ExpressionAttributeValues: marshall({
      ':jogo_slug': jogo_slug,
    }),
  };

  const apostasCommand = new QueryCommand(apostasParams);
  const apostasResult = await dynamoDbClient.send(apostasCommand);

  const apostas = apostasResult.Items.map(item => unmarshall(item));

  console.log(`Total de apostas encontradas para o jogo ${jogo_slug}:`, apostas.length);

  // 2. Determinar vencedores e atualizar apostas
  for (const aposta of apostas) {
    let isWinner = false;

    if (tipo_jogo === 'MEGA' || tipo_jogo === 'LOTOFACIL') {
      const numerosSorteados = numeros.split(',').map(num => num.trim());
      const apostaNumeros = aposta.htc_cotas ? Object.values(aposta).filter((v, k) => k.startsWith('htc_cota')).map(v => v.toString()) : [];

      const acertos = apostaNumeros.filter(num => numerosSorteados.includes(num)).length;

      // **Defina a lógica de acertos necessária para ser considerado vencedor**
      const acertosParaVencer = tipo_jogo === 'MEGA' ? 6 : 15;

      if (acertos >= acertosParaVencer) {
        isWinner = true;
      }
    } else if (tipo_jogo === 'JOGO_DO_BICHO') {
      // Para JOGO_DO_BICHO, verificar se a dezena e horário correspondem
      if (aposta.htc_dezena === dezena && aposta.htc_horario === horario) {
        isWinner = true;
      }
    }

    if (isWinner) {
      // Atualizar o status da aposta para 'vencedora'
      const updateApostaParams = {
        TableName: 'HistoricoCliente',
        Key: marshall({ htc_id: aposta.htc_id }),
        UpdateExpression: 'SET htc_status = :status, htc_resultado = :resultado, htc_dataupdate = :dataupdate',
        ExpressionAttributeValues: marshall({
          ':status': 'vencedora',
          ':resultado': 'Parabéns! Você ganhou!',
          ':dataupdate': new Date().toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      const updateApostaCommand = new UpdateItemCommand(updateApostaParams);
      await dynamoDbClient.send(updateApostaCommand);

      console.log(`Aposta ${aposta.htc_id} foi marcada como vencedora.`);

      // Processar pagamento do prêmio ao cliente
      // Aqui, você pode integrar com uma API de pagamento para transferir o prêmio.
      // Para simplificação, assumiremos que o prêmio será creditado manualmente ou através de outra rota.

      // Atualizar financeiro do colaborador e administrador
      await atualizarFinanceiroApósVitoria(aposta, premio);
    } else {
      // Atualizar o status da aposta para 'não vencedora'
      const updateApostaParams = {
        TableName: 'HistoricoCliente',
        Key: marshall({ htc_id: aposta.htc_id }),
        UpdateExpression: 'SET htc_status = :status, htc_resultado = :resultado, htc_dataupdate = :dataupdate',
        ExpressionAttributeValues: marshall({
          ':status': 'não vencedora',
          ':resultado': 'Infelizmente, você não ganhou desta vez.',
          ':dataupdate': new Date().toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      const updateApostaCommand = new UpdateItemCommand(updateApostaParams);
      await dynamoDbClient.send(updateApostaCommand);

      console.log(`Aposta ${aposta.htc_id} foi marcada como não vencedora.`);
    }
  }
}

// Função para atualizar financeiro após uma vitória
async function atualizarFinanceiroApósVitoria(aposta, premio) {
  const { htc_idcliente, htc_idcolaborador, htc_transactionid } = aposta;

  // 1. Buscar o colaborador associado ao cliente
  const getColaboradorParams = {
    TableName: 'Cliente',
    IndexName: 'cli_id-index', // Assegure-se que este GSI existe
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

  // 2. Calcular comissões
  const getConfigParams = {
    TableName: 'Configuracoes',
    Key: marshall({ conf_nome: 'comissao_colaborador' }),
  };

  const getConfigCommand = new QueryCommand(getConfigParams);
  const configData = await dynamoDbClient.send(getConfigCommand);

  let porcentagemComissao = 0;

  if (configData.Items && configData.Items.length > 0) {
    const config = unmarshall(configData.Items[0]);
    porcentagemComissao = parseFloat(config.conf_valor); // Ex: 10 para 10%
  } else {
    console.warn('Configuração de comissão do colaborador não encontrada. Usando 10% padrão.');
    porcentagemComissao = 10; // Valor padrão
  }

  const comissaoColaborador = (premio * porcentagemComissao) / 100;
  const comissaoAdmin = premio - comissaoColaborador;

  // 3. Atualizar financeiro do colaborador
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

  // 4. Atualizar financeiro do administrador
  const newFinanceiroAdministrador = {
    fid_id: uuidv4(),
    fid_id_historico_cliente: htc_transactionid, // Supondo que htc_transactionid é o ID da transação
    fid_status: 'pendente',
    fid_valor_admin: comissaoAdmin.toFixed(2),
    fid_valor_colaborador: comissaoColaborador.toFixed(2),
    fid_valor_rede: (premio - comissaoAdmin - comissaoColaborador).toFixed(2), // Ajuste conforme a lógica da sua rede
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
