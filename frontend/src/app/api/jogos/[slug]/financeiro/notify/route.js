import { NextResponse } from 'next/server';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import sendEmail from '../../../../../utils/send-email';
import { verifyToken } from '../../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(request, context) {
  try {
    // Aguardar os parâmetros da URL corretamente
    const { slug } = context.params;

    // Verificação do slug
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug não fornecido.' },
        { status: 400 }
      );
    }

    // Autenticação do usuário
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      return NextResponse.json(
        { error: 'Cabeçalho de autorização ausente.' },
        { status: 401 }
      );
    }
    
    const token = authorizationHeader.split(' ')[1];
    const decodedToken = verifyToken(token);
    
    // Verificando se o usuário tem permissão
    if (!decodedToken || !['admin', 'superadmin'].includes(decodedToken.role)) {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    // Receber o corpo da requisição
    const { tipoPremiacao, cli_id, email } = await request.json(); // Agora pegando o e-mail também
    console.log('Parâmetros recebidos:', { tipoPremiacao, cli_id, email });

    // Enviar e-mail genérico
    const mensagemGenerica = `Olá, parabéns! Você foi premiado no jogo ${slug}. Seu prêmio está disponível e em breve você receberá mais informações.`;

    // Envio do e-mail para o premiado usando o e-mail passado
    const success = await sendEmail({
      to: email,  // Usando o e-mail real do premiado
      subject: 'Notificação de Premiação',
      text: mensagemGenerica,
      html: `<p>${mensagemGenerica}</p>`
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao enviar o e-mail de notificação.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Notificação enviada com sucesso.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }  
    );
  }
}
