// src/app/api/resultados/create/route.js

import { NextResponse } from "next/server";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { verifyToken } from "../../../utils/auth";
import dynamoDbClient from "../../../lib/dynamoDbClient";

const tableName = "Resultados";

export async function POST(request) {
  try {
    const authorizationHeader = request.headers.get("authorization");
    const token = authorizationHeader?.split(" ")[1];
    const decodedToken = verifyToken(token);

    if (
      !decodedToken ||
      !['admin', 'superadmin', 'colaborador'].includes(decodedToken.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { res_numero } = await request.json();

    if (!res_numero) {
      return NextResponse.json(
        { error: "Missing required field: res_numero." },
        { status: 400 }
      );
    }

    const res_id = uuidv4();

    const newResultado = {
      res_id,
      res_numero,
      res_datacriacao: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: marshall(newResultado),
    };

    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return NextResponse.json({ resultado: newResultado }, { status: 201 });
  } catch (error) {
    console.error("Error creating resultado:", error);

    if (
      error.name === "CredentialsError" ||
      error.message.includes("credentials")
    ) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou não configuradas." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
