// src/app/api/configuracoes/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { verifyToken } from '../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
 region: process.env.REGION || 'sa-east-1',
 credentials: {
   accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
   secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
 },
});

const tableName = 'Configuracoes';

export async function POST(request) {
 try {
   const authorizationHeader = request.headers.get('authorization');
   const token = authorizationHeader?.split(' ')[1];
   const decodedToken = verifyToken(token);

   if (!decodedToken || decodedToken.role !== 'admin') {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }

   const {
     conf_descricao,
     rateio_10_pontos,
     rateio_9_pontos,
     rateio_menos_pontos,
     custos_administrativos,
   } = await request.json();

   if (rateio_10_pontos === undefined || rateio_9_pontos === undefined || 
       rateio_menos_pontos === undefined || custos_administrativos === undefined) {
     return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
   }

   const total = parseFloat(rateio_10_pontos) + parseFloat(rateio_9_pontos) + 
                parseFloat(rateio_menos_pontos) + parseFloat(custos_administrativos);
                
   if (total !== 100) {
     return NextResponse.json(
       { error: 'A soma das porcentagens deve ser 100.' },
       { status: 400 }
     );
   }

   const newConfiguracao = {
     config_id: 'rateio',
     conf_descricao: conf_descricao || null,
     rateio_10_pontos: rateio_10_pontos.toString(),
     rateio_9_pontos: rateio_9_pontos.toString(),
     rateio_menos_pontos: rateio_menos_pontos.toString(),
     custos_administrativos: custos_administrativos.toString(),
     created_at: new Date().toISOString(),
   };

   const params = {
     TableName: tableName,
     Item: marshall(newConfiguracao),
     ConditionExpression: 'attribute_not_exists(config_id)', // Garante que o ID seja único
   };

   const command = new PutItemCommand(params);
   await dynamoDbClient.send(command);

   return NextResponse.json({ configuracao: newConfiguracao }, { status: 201 });
 } catch (error) {
   console.error('Error creating configuracao:', error);

   if (error.name === 'ConditionalCheckFailedException') {
     return NextResponse.json({ error: 'Configuração já existe.' }, { status: 400 });
   }

   if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
     return NextResponse.json(
       { error: 'Credenciais inválidas ou não configuradas.' },
       { status: 500 }
     );
   }

   return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}
