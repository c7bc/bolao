// src/app/api/jogos/participar/route.js
export async function POST(request) {
    try {
      const authorizationHeader = request.headers.get('authorization');
      const token = authorizationHeader?.split(' ')[1];
      const decodedToken = verifyToken(token);
  
      if (!decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const { jogo_id, numeros_escolhidos, valor_total, metodo_pagamento } = await request.json();
  
      // 1. Criar registro no histórico do cliente
      const historicoParams = {
        TableName: 'HistoricoCliente',
        Item: marshall({
          htc_id: uuidv4(),
          htc_idcliente: decodedToken.cli_id,
          htc_idjogo: jogo_id,
          htc_status: 'pendente',
          htc_deposito: valor_total,
          htc_datacriacao: new Date().toISOString(),
          ...numeros_escolhidos.reduce((acc, num, idx) => ({
            ...acc,
            [`htc_cota${idx + 1}`]: num
          }), {})
        })
      };
  
      await dynamoDbClient.send(new PutItemCommand(historicoParams));
  
      // 2. Criar transação de pagamento
      const transacaoParams = {
        TableName: 'Transacoes',
        Item: marshall({
          tra_id: uuidv4(),
          tra_idcliente: decodedToken.cli_id,
          tra_valor: valor_total,
          tra_tipo: 'deposito',
          tra_status: 'pendente',
          tra_metodo: metodo_pagamento,
          tra_datacriacao: new Date().toISOString()
        })
      };
  
      await dynamoDbClient.send(new PutItemCommand(transacaoParams));
  
      return NextResponse.json({ 
        message: 'Participação registrada com sucesso' 
      }, { status: 201 });
  
    } catch (error) {
      console.error('Error registering participation:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }