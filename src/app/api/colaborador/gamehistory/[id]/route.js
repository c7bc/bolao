import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
});

const tableName = 'Jogos';
const indexName = 'colaborador-jogos-index';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const describeCommand = new DescribeTableCommand({ TableName: tableName });
    const tableInfo = await dynamoDbClient.send(describeCommand);
    const indexExists = tableInfo.Table.GlobalSecondaryIndexes?.some(
      (index) => index.IndexName === indexName
    );

    if (!indexExists) {
      return NextResponse.json(
        { error: `Index ${indexName} does not exist in table ${tableName}.` },
        { status: 404 }
      );
    }

    const queryParams = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: 'col_id = :id',
      ExpressionAttributeValues: {
        ':id': { S: id },
      },
    };

    const command = new QueryCommand(queryParams);
    const response = await dynamoDbClient.send(command);
    const games = response.Items ? response.Items.map(item => unmarshall(item)) : 0;

    return NextResponse.json({ games }, { status: 200 });
  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}