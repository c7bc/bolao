// src/app/api/colaborador/pagamentos/route.js
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const command = new ScanCommand({
      TableName: 'Pagamentos_Colaborador',
      FilterExpression: 'pag_idcolaborador = :colId',
      ExpressionAttributeValues: {
        ':colId': { S: decodedToken.col_id }
      }
    });

    const response = await dynamoDbClient.send(command);
    const pagamentos = response.Items.map(item => unmarshall(item));

    return NextResponse.json({ pagamentos });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}