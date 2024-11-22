import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


export async function POST(request) {
  try {
    const { cli_telefone, cli_password } = await request.json();

    if (!cli_telefone || !cli_password) {
      return NextResponse.json({ error: 'Missing telefone or password.' }, { status: 400 });
    }

    // Consultar pelo índice TelefoneIndex
    const params = {
      TableName: 'Cliente',
      IndexName: 'TelefoneIndex', // Nome do índice
      KeyConditionExpression: 'cli_telefone = :telefone',
      ExpressionAttributeValues: {
        ':telefone': { S: cli_telefone },
      },
    };

    const command = new QueryCommand(params);
    const result = await dynamoDbClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    }

    const cliente = AWS.DynamoDB.Converter.unmarshall(result.Items[0]);

    // Validar a senha
    const passwordMatch = await bcrypt.compare(cli_password, cliente.cli_password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    }

    // Gerar o token JWT
    const token = generateToken({ cli_id: cliente.cli_id, role: 'cliente' });
    delete cliente.cli_password;

    return NextResponse.json({ cliente, token }, { status: 200 });
  } catch (error) {
    console.error('Error logging in cliente:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
