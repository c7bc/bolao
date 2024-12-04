// src/app/api/jogos/resultados/route.js
export async function GET(request) {
    try {
      const queryParams = {
        TableName: 'Jogos',
        FilterExpression: 'jog_status = :status',
        ExpressionAttributeValues: {
          ':status': { S: 'finalizado' }
        }
      };
  
      const command = new ScanCommand(queryParams);
      const response = await dynamoDbClient.send(command);
  
      const jogos = response.Items.map(item => {
        const data = unmarshall(item);
        return {
          jog_id: data.jog_id,
          jog_nome: data.jog_nome,
          jog_data_sorteio: data.jog_data_sorteio,
          jog_premiototal: data.jog_premiototal,
          numeros_sorteados: data.jog_numeros_sorteados,
          ganhadores: data.jog_ganhadores || []
        };
      });
  
      return NextResponse.json({ jogos }, { status: 200 });
    } catch (error) {
      console.error('Error fetching finished games:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }