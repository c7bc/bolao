// src/app/api/jogos/confirmar-pagamento/route.js
export async function POST(request) {
    try {
      const { transacao_id, status_pagamento } = await request.json();
      
      // 1. Atualizar status da transação
      const updateTransacaoParams = {
        TableName: 'Transacoes',
        Key: {
          tra_id: { S: transacao_id }
        },
        UpdateExpression: 'SET tra_status = :status',
        ExpressionAttributeValues: {
          ':status': { S: status_pagamento }
        }
      };
  
      await dynamoDbClient.send(new UpdateItemCommand(updateTransacaoParams));
  
      // 2. Se pagamento confirmado, atualizar histórico do cliente
      if (status_pagamento === 'confirmado') {
        // Buscar a transação para pegar o ID do cliente
        const getTransacaoParams = {
          TableName: 'Transacoes',
          Key: {
            tra_id: { S: transacao_id }
          }
        };
  
        const transacao = await dynamoDbClient.send(new GetItemCommand(getTransacaoParams));
        const clienteId = unmarshall(transacao.Item).tra_idcliente;
  
        // Atualizar histórico do cliente
        const updateHistoricoParams = {
          TableName: 'HistoricoCliente',
          Key: {
            htc_idcliente: { S: clienteId }
          },
          UpdateExpression: 'SET htc_status = :status',
          ExpressionAttributeValues: {
            ':status': { S: 'ativo' }
          }
        };
  
        await dynamoDbClient.send(new UpdateItemCommand(updateHistoricoParams));
      }
  
      return NextResponse.json({ 
        message: 'Status do pagamento atualizado com sucesso' 
      }, { status: 200 });
  
    } catch (error) {
      console.error('Error confirming payment:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }