// src/app/api/colaborador/financeiro/resumo/route.js
export async function GET(request) {
    try {
      const token = request.headers.get('authorization')?.split(' ')[1];
      const decodedToken = verifyToken(token);
  
      if (!decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const [comissoes, pagamentos] = await Promise.all([
        getComissoes(decodedToken.col_id),
        getPagamentos(decodedToken.col_id)
      ]);
  
      const resumo = {
        totalRecebido: comissoes.reduce((sum, item) => sum + (item.fic_deposito_cliente || 0), 0),
        comissaoColaborador: comissoes.reduce((sum, item) => item.fic_status === 'PENDENTE' ? sum + (item.fic_comissao || 0) : sum, 0),
        totalComissao: comissoes.reduce((sum, item) => sum + (item.fic_comissao || 0), 0),
        totalPago: pagamentos.reduce((sum, item) => sum + (item.pag_valor || 0), 0),
      };
  
      return NextResponse.json({ resumo });
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
  async function getComissoes(colaboradorId) {
    const command = new ScanCommand({
      TableName: 'Financeiro_Colaborador',
      FilterExpression: 'fic_idcolaborador = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: colaboradorId }
      }
    });
    
    const response = await dynamoDbClient.send(command);
    return response.Items.map(item => unmarshall(item));
  }
  
  async function getPagamentos(colaboradorId) {
    const command = new ScanCommand({
      TableName: 'Pagamentos_Colaborador',
      FilterExpression: 'pag_idcolaborador = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: colaboradorId }
      }
    });
  
    const response = await dynamoDbClient.send(command);
    return response.Items.map(item => unmarshall(item));
  }