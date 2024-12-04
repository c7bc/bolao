// src/app/api/colaborador/financeiro/export/route.js
export async function GET(request) {
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];
      const decodedToken = verifyToken(token);
  
      if (!decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const financialData = await getFinancialData(decodedToken.col_id);
      const csvContent = convertToCSV(financialData);
  
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=relatorio-financeiro.csv'
        }
      });
    } catch (error) {
      console.error('Error exporting financial data:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
  function convertToCSV(data) {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Status'];
    const rows = data.map(item => [
      new Date(item.fic_datacriacao).toLocaleDateString(),
      item.fic_descricao,
      item.fic_comissao,
      item.fic_tipocomissao,
      item.fic_status
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }