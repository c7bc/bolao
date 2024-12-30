// Caminho: src/app/api/jogos/create/route.js

import { NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../../../../utils/auth';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || 'SEU_ACCESS_KEY_ID',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || 'SEU_SECRET_ACCESS_KEY',
  },
});

export async function POST(request) {
  try {
    // Autenticação
    const authorizationHeader = request.headers.get('authorization');
    const token = authorizationHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autorização não encontrado.' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken || !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parsing do corpo da requisição
    const {
      jogo_slug,
      tipo_jogo,
      numeros,
      dezena,
      horario,
      data_sorteio,
      premio,
    } = await request.json();

    // Validação de campos obrigatórios
    if (
      !jogo_slug ||
      !tipo_jogo ||
      !data_sorteio ||
      !premio ||
      (tipo_jogo !== 'JOGO_DO_BICHO' && !numeros) ||
      (tipo_jogo === 'JOGO_DO_BICHO' && (!dezena || !horario))
    ) {
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    // Validação dos números com base no tipo de jogo
    if (tipo_jogo !== 'JOGO_DO_BICHO') {
      const numerosArray = numeros.split(',').map(num => num.trim());

      const jogoTipoLimits = {
        MEGA: { min: 6, max: 60 },
        LOTOFACIL: { min: 15, max: 25 },
      };

      const { min, max } = jogoTipoLimits[tipo_jogo] || { min: 1, max: 60 };

      if (
        numerosArray.length < min ||
        numerosArray.length > max
      ) {
        return NextResponse.json(
          { error: `A quantidade de números deve estar entre ${min} e ${max}.` },
          { status: 400 }
        );
      }

      const numerosValidos = numerosArray.every(num => /^\d+$/.test(num));
      if (!numerosValidos) {
        return NextResponse.json(
          { error: 'Os números devem conter apenas dígitos.' },
          { status: 400 }
        );
      }
    } else {
      // Para JOGO_DO_BICHO
      const validAnimals = [
        'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
        'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
        'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
        'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
        'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
      ];
      const animals = numeros.split(',').map(a => a.trim());

      const jogoTipoLimits = {
        JOGO_DO_BICHO: { min: 6, max: 25 },
      };

      const { min, max } = jogoTipoLimits[tipo_jogo] || { min: 1, max: 25 };

      if (
        animals.length < min ||
        animals.length > max
      ) {
        return NextResponse.json(
          { error: `A quantidade de animais deve estar entre ${min} e ${max}.` },
          { status: 400 }
        );
      }

      const animaisValidos = animals.every(animal => validAnimals.includes(animal));
      if (!animaisValidos) {
        return NextResponse.json(
          { error: 'Os animais devem ser válidos e separados por vírgula.' },
          { status: 400 }
        );
      }
    }

    // Geração de ID único
    const jog_id = uuidv4();

    // Preparar dados para o DynamoDB
    const novoJogo = {
      jog_id,
      jogo_slug,
      tipo_jogo,
      jog_numeros: tipo_jogo !== 'JOGO_DO_BICHO' ? numeros : null,
      dezena: tipo_jogo === 'JOGO_DO_BICHO' ? dezena : null,
      horario: tipo_jogo === 'JOGO_DO_BICHO' ? horario : null,
      data_sorteio,
      premio,
      jog_status: 'open', // Padrão para novos jogos
      jog_valorjogo: parseFloat(formData?.jog_valorjogo) || 0,
      jog_valorpremio: parseFloat(formData?.jog_valorpremio) || 0,
      jog_quantidade_minima: parseInt(formData?.jog_quantidade_minima, 10) || 1,
      jog_quantidade_maxima: parseInt(formData?.jog_quantidade_maxima, 10) || 60,
      jog_datacriacao: new Date().toISOString(),
      jog_creator_id: decodedToken.role === 'admin' || decodedToken.role === 'superadmin'
        ? decodedToken.adm_id
        : decodedToken.col_id, // Supondo que col_id está disponível no token
      jog_creator_role: decodedToken.role,
    };

    const params = {
      TableName: 'Jogos',
      Item: marshall(novoJogo),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    console.log('Novo jogo criado:', novoJogo);

    return NextResponse.json({ jogo: novoJogo }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar jogo:', error);

    if (
      error.name === 'CredentialsError' ||
      error.message.includes('credentials')
    ) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou não configuradas.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
