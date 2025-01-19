import { NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { verifyToken } from "../../../../utils/auth";

const dynamoDbClient = new DynamoDBClient({
  region: process.env.REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function GET(request, context) {
  try {
    const { slug } = context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug não fornecido." },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const jogo = await getJogoBySlug(slug);

    if (!jogo) {
      return NextResponse.json(
        { error: "Jogo não encontrado." },
        { status: 404 }
      );
    }

    const numerosSorteados = await getAllSorteadosByJogo(jogo.jog_id);

    if (!numerosSorteados || numerosSorteados.length === 0) {
      return NextResponse.json(
        { error: "Números sorteados não definidos para o jogo." },
        { status: 400 }
      );
    }

    const apostas = await getApostasByJogo(jogo.jog_id);

    if (apostas.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma aposta registrada para este jogo." },
        { status: 400 }
      );
    }

    const pontosPorAcerto = parseFloat(jogo.pontosPorAcerto) || 1;
    const resultadoApostas = processarApostas(
      apostas,
      numerosSorteados,
      pontosPorAcerto
    );

    const vencedores = determinarVencedores(resultadoApostas);

    const totalArrecadado = parseFloat(jogo.totalArrecadado || 0);
    const custosAdministrativos = parseFloat(
      (totalArrecadado * 0.1).toFixed(2)
    );
    const valorLiquidoPremiacao = parseFloat(
      (totalArrecadado - custosAdministrativos).toFixed(2)
    );

    const premiacaoTotais = {
      campeao: parseFloat((valorLiquidoPremiacao * 0.5).toFixed(2)),
      vice: parseFloat((valorLiquidoPremiacao * 0.3).toFixed(2)),
      menos_pontos: parseFloat((valorLiquidoPremiacao * 0.2).toFixed(2)),
    };

    const premios = await distribuirPremios(
      jogo.jog_slug,
      vencedores,
      premiacaoTotais
    );

    const financeiroData = {
      jog_id: jogo.jog_id,
      jog_nome: jogo.jog_nome,
      total_arrecadado: totalArrecadado,
      custos_administrativos: custosAdministrativos,
      valor_liquido_premiacao: valorLiquidoPremiacao,
      premiacoes_totais: premiacaoTotais,
      premiacoes: premios,
      status: jogo.jog_status,
    };

    console.log("Premios gerados com status pago:", premios);

    return NextResponse.json({ financeiro: financeiroData }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar financeiro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

async function getJogoBySlug(slug) {
  const queryParams = {
    TableName: "Jogos",
    IndexName: "slug-index",
    KeyConditionExpression: "slug = :slug",
    ExpressionAttributeValues: {
      ":slug": { S: slug },
    },
  };

  try {
    const command = new QueryCommand(queryParams);
    const result = await dynamoDbClient.send(command);

    if (result.Items && result.Items.length > 0) {
      const jogo = unmarshall(result.Items[0]);

      if (!jogo.jog_slug && jogo.slug) {
        jogo.jog_slug = jogo.slug;
      }

      return jogo;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar jogo por slug:", error);
    throw error;
  }
}

async function getAllSorteadosByJogo(jog_id) {
  const queryParams = {
    TableName: "Sorteios",
    IndexName: "jog_id-index",
    KeyConditionExpression: "jog_id = :jog_id",
    ExpressionAttributeValues: {
      ":jog_id": { S: jog_id },
    },
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return [];
    }

    const todosNumeros = queryResult.Items.flatMap((item) => {
      const sorteio = unmarshall(item);
      return sorteio.numerosSorteados.split(",").map((num) => num.trim());
    });

    return [...new Set(todosNumeros)];
  } catch (error) {
    console.error("Erro ao buscar números sorteados:", error);
    throw error;
  }
}

async function getApostasByJogo(jog_id) {
  const queryParams = {
    TableName: "Apostas",
    IndexName: "jog_id-index",
    KeyConditionExpression: "jog_id = :jog_id",
    ExpressionAttributeValues: {
      ":jog_id": { S: jog_id },
    },
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryResult = await dynamoDbClient.send(queryCommand);

    console.log("Apostas encontradas:", queryResult.Items);
    return queryResult.Items
      ? queryResult.Items.map((item) => unmarshall(item))
      : [];
  } catch (error) {
    console.error("Erro ao buscar apostas:", error);
    throw error;
  }
}

function processarApostas(apostas, numerosSorteados, pontosPorAcerto) {
  return apostas.map((aposta) => {
    const numerosApostados = aposta.palpite_numbers.map(String);
    const acertos = numerosApostados.filter((num) =>
      numerosSorteados.includes(num)
    );
    const pontos = acertos.length * pontosPorAcerto;

    return {
      ...aposta,
      acertos,
      pontos_totais: pontos,
    };
  });
}

function determinarVencedores(resultadoApostas) {
  const campeao = resultadoApostas.filter(
    (aposta) => aposta.pontos_totais >= 10
  );
  const vice = resultadoApostas.filter((aposta) => aposta.pontos_totais === 9);

  const menorPontos = Math.min(
    ...resultadoApostas.map((aposta) => aposta.pontos_totais)
  );
  const menosPontos = resultadoApostas.filter(
    (aposta) => aposta.pontos_totais === menorPontos
  );

  return { campeao, vice, menos_pontos: menosPontos };
}

async function distribuirPremios(jog_slug, vencedores, premiacaoTotais) {
  if (!jog_slug) {
    throw new Error("O identificador do jogo (jog_slug) não foi fornecido.");
  }

  const premios = {};

  for (const [categoria, ganhadores] of Object.entries(vencedores)) {
    if (ganhadores.length === 0) {
      premios[categoria] = [];
      continue;
    }

    const premioTotal = premiacaoTotais[categoria];
    const premioPorPessoa = parseFloat(
      (premioTotal / ganhadores.length).toFixed(2)
    );

    const ganhadoresComInfo = await Promise.all(
      ganhadores.map(async (ganhador) => {
        const clienteInfo = await getClienteById(ganhador.cli_id);

        const premiacaoId = `${jog_slug}_${ganhador.cli_id}_${categoria}`;

        // Verificar se o premiado já existe e está marcado como pago
        const premiadoExistente = await buscarPremiado(premiacaoId);
        if (premiadoExistente && premiadoExistente.pago) {
          return premiadoExistente;
        }

        const premiado = {
          premiacao_id: premiacaoId,
          jog_slug,
          cli_id: ganhador.cli_id,
          categoria,
          nome: clienteInfo?.cli_nome || "Cliente não identificado",
          email: clienteInfo?.cli_email || "Email não encontrado",
          telefone: clienteInfo?.cli_telefone || "Telefone não encontrado",
          premio: premioPorPessoa,
          pontos_totais: ganhador.pontos_totais,
          pago: false,
          data_pagamento: null,
        };

        await criarOuAtualizarPremiado(premiacaoId, premiado);

        return premiado;
      })
    );

    premios[categoria] = ganhadoresComInfo;
  }

  return premios;
}

async function getClienteById(cli_id) {
  const queryParams = {
    TableName: "Cliente",
    Key: {
      cli_id: { S: cli_id },
    },
  };

  try {
    const command = new GetItemCommand(queryParams);
    const result = await dynamoDbClient.send(command);

    if (!result.Item) {
      console.error(`Cliente com ID ${cli_id} não encontrado.`);
      return null;
    }

    return unmarshall(result.Item);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    throw error;
  }
}

async function buscarPremiado(premiacaoId) {
  const getParams = {
    TableName: "Premiacoes",
    Key: marshall({
      premiacao_id: premiacaoId,
    }),
  };

  try {
    const getCommand = new GetItemCommand(getParams);
    const getResult = await dynamoDbClient.send(getCommand);

    if (getResult.Item) {
      return unmarshall(getResult.Item);
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar premiado:", error);
    throw error;
  }
}

async function criarOuAtualizarPremiado(premiacaoId, premiado) {
  const putParams = {
    TableName: "Premiacoes",
    Item: marshall(premiado, { removeUndefinedValues: true }),
  };

  try {
    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);
  } catch (error) {
    console.error("Erro ao criar ou atualizar premiado:", error);
    throw error;
  }
}