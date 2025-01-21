// frontend/src/app/api/jogos/[slug]/financeiro/pagamento/route.js

import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { verifyToken } from "../../../../../utils/auth";

// Configuração do cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Handler para a requisição PUT
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug do jogo não fornecido." },
        { status: 400 }
      );
    }

    // Verificação de autenticação
    const authorizationHeader = request.headers.get("authorization");
    if (!authorizationHeader) {
      return NextResponse.json(
        { error: "Cabeçalho de autorização ausente." },
        { status: 401 }
      );
    }

    const token = authorizationHeader.split(" ")[1];
    const decodedToken = verifyToken(token);

    if (!decodedToken || !["admin", "superadmin"].includes(decodedToken.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Parsing do corpo da requisição
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Erro ao processar o corpo da requisição." },
        { status: 400 }
      );
    }

    const { cli_id, categoriaPremio } = body;

    if (!cli_id || !categoriaPremio) {
      return NextResponse.json(
        { error: "Parâmetros 'cli_id' e 'categoriaPremio' são obrigatórios." },
        { status: 400 }
      );
    }

    const premiacaoId = `${slug}_${cli_id}_${categoriaPremio}`;

    // Buscar premiado no banco
    const premiado = await buscarPremiado(premiacaoId);
    console.log(premiado);

    if (!premiado) {
      return NextResponse.json(
        { error: "Premiado não encontrado." },
        { status: 404 }
      );
    }

    if (premiado.pago) {
      return NextResponse.json(
        {
          error:
            "A premiação já foi marcada como paga anteriormente. Atualize os dados.",
          premiado,
        },
        { status: 400 }
      );
    }

    // Atualizar o status para pago
    const premiadoAtualizado = await atualizarPremiadoComoPago(premiacaoId);

    return NextResponse.json(
      {
        message: "Pagamento marcado como realizado com sucesso.",
        premiado: premiadoAtualizado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// Função para buscar premiado
async function buscarPremiado(premiacaoId) {
  const getParams = {
    TableName: "Premiacoes",
    Key: marshall({
      premiacao_id: premiacaoId,
    }),
  };

  try {
    const command = new GetItemCommand(getParams);
    const result = await dynamoDbClient.send(command);

    if (result.Item) {
      const premiado = unmarshall(result.Item);
      return premiado;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar premiado:", error);
    throw error;
  }
}

// Função para atualizar premiado como pago
async function atualizarPremiadoComoPago(premiacaoId) {
  const updateParams = {
    TableName: "Premiacoes",
    Key: marshall({
      premiacao_id: premiacaoId,
    }),
    UpdateExpression: "SET pago = :pago, data_pagamento = :data",
    ExpressionAttributeValues: marshall({
      ":pago": true,
      ":data": new Date().toISOString(),
    }),
    ReturnValues: "ALL_NEW",
  };

  try {
    const command = new UpdateItemCommand(updateParams);
    const result = await dynamoDbClient.send(command);

    if (result.Attributes) {
      const premiadoAtualizado = unmarshall(result.Attributes);
      console.log("Premiado atualizado:", premiadoAtualizado);
      return premiadoAtualizado;
    }

    return null;
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    throw error;
  }
}