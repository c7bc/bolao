import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  ScanCommand,
  BatchGetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { verifyToken } from "../../../utils/auth";

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request, context) {
  try {
    const authorizationHeader = request.headers.get("authorization");
    let decodedToken = null;

    if (authorizationHeader) {
      const token = authorizationHeader.split(" ")[1];
      decodedToken = verifyToken(token);

      if (!decodedToken) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");

    let cli_id;
    if (decodedToken && decodedToken.cli_id) {
      cli_id = decodedToken.cli_id;
    } else if (clienteId) {
      cli_id = clienteId;
    } else {
      return NextResponse.json(
        { error: "ID do cliente não fornecido." },
        { status: 400 }
      );
    }

    const [
      jogosParticipados,
      pontuacoes,
      historicoFinanceiro,
      apostas,
      premiacoes,
    ] = await Promise.all([
      getJogosParticipados(cli_id),
      getPontuacoes(cli_id),
      getHistoricoFinanceiro(cli_id),
      getApostas(cli_id),
      getPremiacoes(cli_id),
    ]);

    const historicoData = {
      cli_id,
      jogos_participados: jogosParticipados,
      pontuacoes,
      historico_financeiro: historicoFinanceiro,
      apostas,
      premiacoes,
    };

    return NextResponse.json({ historico: historicoData }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar histórico do cliente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

async function getJogosParticipados(cli_id) {
  const scanParams = {
    TableName: "Apostas",
    FilterExpression: "cli_id = :cli_id",
    ExpressionAttributeValues: {
      ":cli_id": { S: cli_id },
    },
    ProjectionExpression: "jog_id",
  };

  try {
    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);
    const jogosIds = (result.Items || []).map((item) => unmarshall(item).jog_id);
    const uniqueJogosIds = [...new Set(jogosIds)];

    const jogosParams = {
      RequestItems: {
        Jogos: {
          Keys: uniqueJogosIds.map((jog_id) => ({ jog_id: { S: jog_id } })),
        },
      },
    };

    const jogosCommand = new BatchGetItemCommand(jogosParams);
    const jogosResult = await dynamoDbClient.send(jogosCommand);
    const jogos = (jogosResult.Responses?.Jogos || []).map((item) =>
      unmarshall(item)
    );

    return jogos;
  } catch (error) {
    console.error("Erro ao buscar jogos participados:", error);
    throw error;
  }
}

async function getPontuacoes(cli_id) {
  const scanParams = {
    TableName: "Apostas",
    FilterExpression: "cli_id = :cli_id",
    ExpressionAttributeValues: {
      ":cli_id": { S: cli_id },
    },
  };

  try {
    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);
    const apostas = (result.Items || []).map((item) => unmarshall(item));

    const pontuacoesPorJogo = {};
    for (const aposta of apostas) {
      if (!pontuacoesPorJogo[aposta.jog_id]) {
        pontuacoesPorJogo[aposta.jog_id] = 0;
      }
      pontuacoesPorJogo[aposta.jog_id] += aposta.pontos || 0;
    }

    return pontuacoesPorJogo;
  } catch (error) {
    console.error("Erro ao buscar pontuações:", error);
    throw error;
  }
}

async function getHistoricoFinanceiro(cli_id) {
  const scanParams = {
    TableName: "HistoricoFinanceiro",
    FilterExpression: "attribute_exists(premiacoes[0].cli_id) AND contains(premiacoes[0].cli_id, :cli_id)",
    ExpressionAttributeValues: {
      ":cli_id": { S: cli_id },
    },
  };

  try {
    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);
    const historico = (result.Items || []).map((item) => unmarshall(item));
    return historico;
  } catch (error) {
    console.error("Erro ao buscar histórico financeiro:", error);
    throw error;
  }
}

async function getApostas(cli_id) {
  const scanParams = {
    TableName: "Apostas",
    FilterExpression: "cli_id = :cli_id",
    ExpressionAttributeValues: {
      ":cli_id": { S: cli_id },
    },
  };

  try {
    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);
    const apostas = (result.Items || []).map((item) => unmarshall(item));
    return apostas;
  } catch (error) {
    console.error("Erro ao buscar apostas:", error);
    throw error;
  }
}

async function getPremiacoes(cli_id) {
  const scanParams = {
    TableName: "Premiacoes",
    FilterExpression: "cli_id = :cli_id",
    ExpressionAttributeValues: {
      ":cli_id": { S: cli_id },
    },
  };

  try {
    const command = new ScanCommand(scanParams);
    const result = await dynamoDbClient.send(command);
    const premiacoes = (result.Items || []).map((item) => unmarshall(item));
    return premiacoes;
  } catch (error) {
    console.error("Erro ao buscar premiações:", error);
    throw error;
  }
}