// src/app/api/colaborador/historico-jogos/route.js
export async function GET(request) {
    try {
      const token = request.headers.get('authorization')?.split(' ')[1];
      const decodedToken = verifyToken(token);
  
      if (!decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const command = new ScanCommand({
        TableName: 'Jogos',
        FilterExpression: 'jog_idcolaborador = :colId',
        ExpressionAttributeValues: {
          ':colId': { S: decodedToken.col_id }
        }
      });
  
      const response = await dynamoDbClient.send(command);
      const jogos = response.Items.map(item => unmarshall(item));
  
      return NextResponse.json({ jogos });
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }