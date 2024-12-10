// src/app/api/cliente/confirmar-pagamento/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDbClient = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

export async function POST(request) {
  console.log('Incoming request to /api/cliente/confirmar-pagamento');

  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { transacao_id, status_pagamento } = body;

    if (!transacao_id || !status_pagamento) {
      console.error('Validation error: Missing required fields.', { body });
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // 1. Atualizar status da transação
    const updateTransacaoParams = {
      TableName: 'Transacoes',
      Key: marshall({ tra_id: transacao_id }),
      UpdateExpression: 'SET tra_status = :status',
      ExpressionAttributeValues: marshall({
        ':status': status_pagamento,
      }),
      ReturnValues: 'ALL_NEW',
    };

    console.log('Updating transaction status with params:', updateTransacaoParams);

    const updateTransacaoCommand = new UpdateItemCommand(updateTransacaoParams);
    const transacaoResult = await dynamoDbClient.send(updateTransacaoCommand);

    const transacaoAtualizada = unmarshall(transacaoResult.Attributes);
    console.log('Transaction updated:', transacaoAtualizada);

    // 2. Se pagamento confirmado, atualizar histórico do cliente e financeiro
    if (status_pagamento.toLowerCase() === 'confirmado') {
      const clienteId = transacaoAtualizada.tra_idcliente;
      const valorTotal = parseFloat(transacaoAtualizada.tra_valor);

      // 2.1. Buscar o colaborador associado ao cliente
      const getClienteParams = {
        TableName: 'Cliente',
        Key: marshall({ cli_id: clienteId }),
      };

      const getClienteCommand = new GetItemCommand(getClienteParams);
      const clienteData = await dynamoDbClient.send(getClienteCommand);

      if (!clienteData.Item) {
        console.error('Cliente não encontrado na base de dados.', { clienteId });
        return NextResponse.json({ error: 'Cliente not found.' }, { status: 404 });
      }

      const cliente = unmarshall(clienteData.Item);
      const colaboradorId = cliente.cli_idcolaborador;

      if (!colaboradorId) {
        console.error('Cliente não está associado a nenhum colaborador.', { clienteId });
        return NextResponse.json({ error: 'Cliente not associated with a collaborator.' }, { status: 400 });
      }

      // 2.2. Calcular comissões
      // **Assumindo** que as porcentagens de comissão estão armazenadas em Configurações
      const getConfigParams = {
        TableName: 'Configuracoes',
        Key: marshall({ conf_nome: 'comissao_colaborador' }), // Supondo que há uma configuração chamada 'comissao_colaborador'
      };

      const getConfigCommand = new GetItemCommand(getConfigParams);
      const configData = await dynamoDbClient.send(getConfigCommand);

      let porcentagemComissao = 0;

      if (configData.Item) {
        const config = unmarshall(configData.Item);
        porcentagemComissao = parseFloat(config.conf_valor); // Ex: 10 para 10%
      } else {
        console.warn('Configuração de comissão do colaborador não encontrada. Usando 10% padrão.');
        porcentagemComissao = 10; // Valor padrão
      }

      const comissaoColaborador = (valorTotal * porcentagemComissao) / 100;
      const comissaoAdmin = valorTotal - comissaoColaborador;

      // 2.3. Atualizar financeiro do colaborador
      const newFinanceiroColaborador = {
        fic_id: uuidv4(),
        fic_idcolaborador: colaboradorId,
        fic_idcliente: clienteId,
        fic_deposito_cliente: valorTotal.toFixed(2),
        fic_porcentagem: porcentagemComissao,
        fic_comissao: comissaoColaborador.toFixed(2),
        fic_tipocomissao: 'compra',
        fic_descricao: `Comissão pela compra do cliente ${clienteId}`,
        fic_datacriacao: new Date().toISOString(),
      };

      const putFinanceiroColaboradorParams = {
        TableName: 'Financeiro_Colaborador',
        Item: marshall(newFinanceiroColaborador),
      };

      console.log('Inserting Financeiro_Colaborador with params:', putFinanceiroColaboradorParams);

      const putFinanceiroColaboradorCommand = new PutItemCommand(putFinanceiroColaboradorParams);
      await dynamoDbClient.send(putFinanceiroColaboradorCommand);

      // 2.4. Atualizar financeiro do administrador
      const newFinanceiroAdministrador = {
        fid_id: uuidv4(),
        fid_id_historico_cliente: transacaoAtualizada.tra_transactionid, // Supondo que tra_transactionid é o ID da transação
        fid_status: 'pendente',
        fid_valor_admin: comissaoAdmin.toFixed(2),
        fid_valor_colaborador: comissaoColaborador.toFixed(2),
        fid_valor_rede: (valorTotal - comissaoAdmin - comissaoColaborador).toFixed(2), // Ajustar conforme a lógica da sua rede
        fid_datacriacao: new Date().toISOString(),
      };

      const putFinanceiroAdministradorParams = {
        TableName: 'Financeiro_Administrador',
        Item: marshall(newFinanceiroAdministrador),
      };

      console.log('Inserting Financeiro_Administrador with params:', putFinanceiroAdministradorParams);

      const putFinanceiroAdministradorCommand = new PutItemCommand(putFinanceiroAdministradorParams);
      await dynamoDbClient.send(putFinanceiroAdministradorCommand);

      // 2.5. Atualizar histórico do cliente para 'ativo'
      const updateHistoricoParams = {
        TableName: 'HistoricoCliente',
        Key: marshall({ htc_id: transacaoAtualizada.htc_id }),
        UpdateExpression: 'SET htc_status = :status, htc_dataupdate = :dataupdate',
        ExpressionAttributeValues: marshall({
          ':status': 'ativo',
          ':dataupdate': new Date().toISOString(),
        }),
        ReturnValues: 'ALL_NEW',
      };

      console.log('Updating HistoricoCliente with params:', updateHistoricoParams);

      const updateHistoricoCommand = new UpdateItemCommand(updateHistoricoParams);
      await dynamoDbClient.send(updateHistoricoCommand);

      console.log('Pagamento confirmado e financeiro atualizado com sucesso.');
    }

    return NextResponse.json({
      message: 'Status do pagamento atualizado com sucesso',
    }, { status: 200 });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
