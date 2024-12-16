import { NextResponse } from 'next/server';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Colaborador';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    // Apenas superadmins podem excluir colaboradores
    if (!decodedToken || decodedToken.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleteParams = {
      TableName: tableName,
      Key: {
        col_id: { S: id },
      },
    };

    const command = new DeleteItemCommand(deleteParams);
    await dynamoDbClient.send(command);

    return NextResponse.json({ message: 'Colaborador excluído com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting colaborador:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
