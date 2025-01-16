```markdown
# Bolão Online - Backend API

![Bolão Online Logo](https://via.placeholder.com/150)

Bolão Online é uma plataforma completa de apostas e loterias que permite a administradores gerenciar jogos, comissões e clientes, enquanto colaboradores podem acompanhar suas comissões e desempenho. Clientes podem participar de jogos, registrar suas apostas e acompanhar seus históricos de jogos e financeiros. O sistema integra-se com a API do Mercado Pago para processamento de pagamentos, garantindo uma experiência fluida e segura para todos os usuários.

## 📑 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração Inicial](#configuração-inicial)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Documentação das Rotas](#documentação-das-rotas)
  - [Admin APIs](#admin-apis)
  - [Cliente APIs](#cliente-apis)
  - [Colaborador APIs](#colaborador-apis)
  - [Jogos APIs](#jogos-apis)
  - [Financeiro APIs](#financeiro-apis)
  - [Operações APIs](#operações-apis)
  - [Webhooks Mercado Pago](#webhooks-mercado-pago)
- [Fluxo de Trabalho](#fluxo-de-trabalho)
- [Considerações de Segurança](#considerações-de-segurança)
- [Melhorias Futuras](#melhorias-futuras)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Visão Geral

O backend da Bolão Online foi desenvolvido utilizando **Next.js** para criar APIs robustas e escaláveis. O sistema utiliza o **AWS DynamoDB** como banco de dados NoSQL para gerenciar dados de administradores, clientes, colaboradores, jogos, apostas e financeiros. A autenticação é gerenciada por **JWT (JSON Web Tokens)**, garantindo segurança e controle de acesso granular baseado em papéis de usuário.

## Tecnologias Utilizadas

- **Next.js**: Framework React para construção de aplicações web e APIs.
- **AWS DynamoDB**: Banco de dados NoSQL altamente escalável.
- **JWT (jsonwebtoken)**: Autenticação e autorização baseada em tokens.
- **bcryptjs**: Hashing de senhas para segurança.
- **UUID**: Geração de IDs únicos.
- **Mercado Pago API**: Processamento de pagamentos.
- **Node.js**: Ambiente de execução JavaScript.

## Estrutura do Projeto

A seguir, apresentamos a estrutura do projeto, destacando as principais pastas e arquivos:

```
bolao-online-backend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── commission/
│   │   │   │   │   └── create/
│   │   │   │   │       └── route.js
│   │   │   │   ├── list/
│   │   │   │   │   └── route.js
│   │   │   │   └── update/
│   │   │   │       └── route.js
│   │   │   ├── cliente/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.js
│   │   │   │   ├── confirmar-pagamento/
│   │   │   │   │   └── route.js
│   │   │   │   ├── financialhistory/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.js
│   │   │   │   ├── gamehistory/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.js
│   │   │   │   ├── list/
│   │   │   │   │   └── route.js
│   │   │   │   ├── login/
│   │   │   │   │   └── route.js
│   │   │   │   ├── meus-jogos/
│   │   │   │   │   └── route.js
│   │   │   │   └── participar/
│   │   │   │       └── route.js
│   │   │   ├── colaborador/
│   │   │   │   ├── clients/
│   │   │   │   │   └── route.js
│   │   │   │   ├── commissionhistory/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.js
│   │   │   │   ├── dados-bancarios/
│   │   │   │   │   └── route.js
│   │   │   │   └── referrals/
│   │   │   │       └── [id]/
│   │   │   │           └── route.js
│   │   │   ├── financeiro/
│   │   │   │   ├── clientes/
│   │   │   │   │   └── route.js
│   │   │   │   ├── colaboradores/
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── route.js
│   │   │   │   │   ├── export/
│   │   │   │   │   │   └── route.js
│   │   │   │   │   ├── route.js
│   │   │   │   │   └── resumo/
│   │   │   │   │       └── route.js
│   │   │   │   ├── administrador/
│   │   │   │   │   └── create/
│   │   │   │   │       └── route.js
│   │   │   │   ├── colab/
│   │   │   │   │   └── create/
│   │   │   │   │       └── route.js
│   │   │   │   └── ... // Outras rotas financeiras
│   │   │   ├── historico-cliente/
│   │   │   │   └── create/
│   │   │   │       └── route.js
│   │   │   ├── operacoes/
│   │   │   │   └── create/
│   │   │   │       └── route.js
│   │   │   ├── pagamentos/
│   │   │   │   └── webhook/
│   │   │   │       └── route.js
│   │   │   ├── jogos/
│   │   │   │   └── create/
│   │   │   │       └── route.js
│   │   │   ├── resultados/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.js
│   │   │   │   └── [jogo_slug]/
│   │   │   │       └── route.js
│   │   │   └── ... // Outras rotas
│   │   └── utils/
│   │       ├── auth.js
│   │       └── processarResultados.js
│   └── ... // Outros diretórios e arquivos do projeto
├── .env.local
├── package.json
├── README.md
└── ... // Outros arquivos de configuração
```

## Configuração Inicial

Siga os passos abaixo para configurar e rodar o backend da Bolão Online localmente.

### Pré-requisitos

- **Node.js** (v14 ou superior)
- **NPM** ou **Yarn**
- **Conta AWS** com acesso ao DynamoDB
- **Conta Mercado Pago** para integração de pagamentos

### Passo a Passo

1. **Clone o Repositório**

   ```bash
   git clone https://github.com/seu-usuario/bolao-online-backend.git
   cd bolao-online-backend
   ```

2. **Instale as Dependências**

   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as Variáveis de Ambiente**

   Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes variáveis:

   ```env
   ACCESS_KEY_ID=AKIA2CUNLT6IOJMTDFWG
   SECRET_ACCESS_KEY=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
   REGION=sa-east-1
   JWT_SECRET=sua_chave_secreta_super_segura
   ```

   **Importante:** Nunca compartilhe ou publique suas credenciais. Utilize serviços de gerenciamento de segredos para ambientes de produção.

4. **Inicie o Servidor de Desenvolvimento**

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

   O servidor estará disponível em `http://localhost:3000`.

## Variáveis de Ambiente

| Variável             | Descrição                                                                                 | Exemplo                   |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------- |
| `ACCESS_KEY_ID`      | ID da chave de acesso da AWS para DynamoDB.                                                | `AKIA2CUNLT6IOJMTDFWG`    |
| `SECRET_ACCESS_KEY`  | Chave de acesso secreta da AWS para DynamoDB.                                             | `EKWBJI1ijBz69+9Xhrc2ZOwTfqkvJy5loVebS8dU` |
| `REGION`             | Região da AWS onde o DynamoDB está hospedado.                                             | `sa-east-1`               |
| `JWT_SECRET`         | Chave secreta para assinatura dos tokens JWT.                                             | `sua_chave_secreta_super_segura` |
| `MERCADO_PAGO_PUBLIC_KEY` | Chave pública da API do Mercado Pago.                                                 | `APP_USR-...`             |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de acesso da API do Mercado Pago.                                           | `APP_USR-...`             |

## Documentação das Rotas

A seguir, detalhamos todas as rotas disponíveis no backend, organizadas por categorias de usuários e funcionalidades.

### Admin APIs

#### 1. Registrar Administrador

- **Endpoint:** `/api/admin/register`
- **Método:** `POST`
- **Descrição:** Permite que um administrador crie uma nova conta de administrador no sistema.
- **Autenticação:** Apenas `superadmin` pode registrar novos administradores.
- **Body da Requisição:**

  ```json
  {
    "adm_nome": "Nome do Admin",
    "adm_email": "admin@example.com",
    "adm_password": "senha_segura",
    "adm_role": "superadmin"
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "admin": {
        "adm_id": "uuid",
        "adm_nome": "Nome do Admin",
        "adm_email": "admin@example.com",
        "adm_status": "active",
        "adm_role": "superadmin",
        "adm_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/401/403):** Mensagens de erro correspondentes.

#### 2. Atualizar Administrador

- **Endpoint:** `/api/admin/update`
- **Método:** `PUT`
- **Descrição:** Atualiza os dados de um administrador existente.
- **Autenticação:** Apenas `superadmin` pode atualizar administradores.
- **Body da Requisição:**

  ```json
  {
    "adm_id": "uuid_do_admin",
    "adm_nome": "Novo Nome",
    "adm_email": "novo_email@example.com",
    "adm_status": "inactive",
    "adm_role": "admin",
    "adm_password": "nova_senha_seguira"
  }
  ```

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "admin": {
        "adm_id": "uuid_do_admin",
        "adm_nome": "Novo Nome",
        "adm_email": "novo_email@example.com",
        "adm_status": "inactive",
        "adm_role": "admin",
        "adm_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/401/403/404):** Mensagens de erro correspondentes.

#### 3. Listar Administradores

- **Endpoint:** `/api/admin/list`
- **Método:** `GET`
- **Descrição:** Retorna uma lista de todos os administradores registrados.
- **Autenticação:** Apenas `admin` e `superadmin` podem acessar.
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "admins": [
        {
          "adm_id": "uuid1",
          "adm_nome": "Admin 1",
          "adm_email": "admin1@example.com",
          "adm_status": "active",
          "adm_role": "admin",
          "adm_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "adm_id": "uuid2",
          "adm_nome": "Admin 2",
          "adm_email": "admin2@example.com",
          "adm_status": "inactive",
          "adm_role": "superadmin",
          "adm_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (401/403):** Mensagens de erro correspondentes.

#### 4. Registrar Comissões

- **Endpoint:** `/api/admin/commission/create`
- **Método:** `POST`
- **Descrição:** Permite que o administrador registre novas configurações de comissão para colaboradores.
- **Autenticação:** Apenas `admin` e `superadmin` podem acessar.
- **Body da Requisição:**

  ```json
  {
    "conf_nome": "comissao_colaborador",
    "conf_descricao": "Comissão padrão para colaboradores",
    "conf_valor": 10
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "configuracao": {
        "conf_id": "uuid",
        "conf_nome": "comissao_colaborador",
        "conf_descricao": "Comissão padrão para colaboradores",
        "conf_valor": 10,
        "conf_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/401/403):** Mensagens de erro correspondentes.

### Cliente APIs

#### 1. Registrar Cliente

- **Endpoint:** `/api/cliente/create`
- **Método:** `POST`
- **Descrição:** Permite que um administrador, superadmin ou colaborador registre um novo cliente no sistema.
- **Autenticação:** `superadmin`, `admin` e `colaborador`.
- **Body da Requisição:**

  ```json
  {
    "cli_nome": "Nome do Cliente",
    "cli_email": "cliente@example.com",
    "cli_telefone": "11999999999",
    "cli_password": "senha_segura",
    "cli_idcolaborador": "uuid_do_colaborador" // Opcional
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "cliente": {
        "cli_id": "uuid",
        "cli_status": "active",
        "cli_nome": "Nome do Cliente",
        "cli_email": "cliente@example.com",
        "cli_telefone": "11999999999",
        "cli_idcolaborador": "uuid_do_colaborador",
        "cli_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 2. Participar de um Jogo (Registrar Aposta)

- **Endpoint:** `/api/cliente/participar`
- **Método:** `POST`
- **Descrição:** Permite que um cliente registre sua participação em um jogo, escolhendo números manualmente ou automaticamente.
- **Autenticação:** `cliente`
- **Body da Requisição:**

  ```json
  {
    "jogo_id": "uuid_do_jogo",
    "numeros_escolhidos": ["01", "05", "12", "23", "34", "45"], // Para MEGA e LOTOFACIL
    "valor_total": 50.00,
    "metodo_pagamento": "mercado_pago"
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "message": "Participação registrada com sucesso"
    }
    ```

  - **Erro (400/401/403/500):** Mensagens de erro correspondentes.

#### 3. Confirmar Pagamento via Mercado Pago

- **Endpoint:** `/api/cliente/confirmar-pagamento`
- **Método:** `POST`
- **Descrição:** Atualiza o status da transação após o processamento do pagamento via Mercado Pago e atualiza automaticamente os financeiros.
- **Autenticação:** `admin` e `superadmin`
- **Body da Requisição:**

  ```json
  {
    "transacao_id": "uuid_da_transacao",
    "status_pagamento": "confirmado" // ou "recusado"
  }
  ```

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "message": "Status do pagamento atualizado com sucesso"
    }
    ```

  - **Erro (400/401/403/404/500):** Mensagens de erro correspondentes.

#### 4. Listar Clientes

- **Endpoint:** `/api/cliente/list`
- **Método:** `GET`
- **Descrição:** Retorna uma lista de todos os clientes registrados, podendo filtrar por telefone.
- **Autenticação:** `admin`, `superadmin` e `colaborador`.
- **Parâmetros de Query:**

  - `telefone` (opcional): Filtra clientes pelo número de telefone.

  Exemplo: `/api/cliente/list?telefone=11999999999`

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "clientes": [
        {
          "cli_id": "uuid1",
          "cli_status": "active",
          "cli_nome": "Cliente 1",
          "cli_email": "cliente1@example.com",
          "cli_telefone": "11999999999",
          "cli_idcolaborador": "uuid_colab1",
          "cli_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "cli_id": "uuid2",
          "cli_status": "inactive",
          "cli_nome": "Cliente 2",
          "cli_email": "cliente2@example.com",
          "cli_telefone": "11888888888",
          "cli_idcolaborador": "uuid_colab2",
          "cli_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

#### 5. Login do Cliente

- **Endpoint:** `/api/cliente/login`
- **Método:** `POST`
- **Descrição:** Autentica um cliente e retorna um token JWT para acesso às rotas protegidas.
- **Body da Requisição:**

  ```json
  {
    "cli_telefone": "11999999999",
    "cli_password": "senha_segura"
  }
  ```

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "cliente": {
        "cli_id": "uuid",
        "cli_status": "active",
        "cli_nome": "Nome do Cliente",
        "cli_email": "cliente@example.com",
        "cli_telefone": "11999999999",
        "cli_idcolaborador": "uuid_colab",
        "cli_datacriacao": "2024-04-27T12:34:56.789Z"
      },
      "token": "jwt_token_aqui"
    }
    ```

  - **Erro (400/500):** Mensagens de erro correspondentes.

#### 6. Dashboard do Cliente - Meus Jogos

- **Endpoint:** `/api/cliente/meus-jogos`
- **Método:** `GET`
- **Descrição:** Retorna uma lista dos jogos em que o cliente participou, incluindo detalhes das apostas.
- **Autenticação:** `cliente`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "jogos": [
        {
          "id": "htc_id1",
          "nome": "MEGA-SENA",
          "numeros_escolhidos": ["01", "05", "12", "23", "34", "45"],
          "valor": 50.00,
          "status": "vencedora",
          "data": "2024-04-27T12:34:56.789Z",
          "numeros_sorteados": ["01", "05", "12", "23", "34", "45"],
          "resultado": "Parabéns! Você ganhou!"
        },
        {
          "id": "htc_id2",
          "nome": "LOTOFACIL",
          "numeros_escolhidos": ["02", "06", "14", "22", "33", "44", "55", "66", "77", "88", "99", "11", "13", "17", "19"],
          "valor": 75.00,
          "status": "não vencedora",
          "data": "2024-04-28T09:21:34.123Z",
          "numeros_sorteados": ["03", "07", "15", "23", "34", "45", "56", "67", "78", "89", "90", "12", "14", "18", "20"],
          "resultado": "Infelizmente, você não ganhou desta vez."
        }
      ]
    }
    ```

  - **Erro (401/500):** Mensagens de erro correspondentes.

#### 7. Histórico de Jogos do Cliente

- **Endpoint:** `/api/cliente/gamehistory/[id]`
- **Método:** `GET`
- **Descrição:** Retorna o histórico completo de jogos em que o cliente participou.
- **Autenticação:** `admin` e `superadmin`
- **Parâmetros de Rota:**
  - `[id]`: ID do cliente.

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "games": [
        {
          "htc_id": "uuid1",
          "htc_idcliente": "cli_uuid1",
          "htc_idjogo": "jog_uuid1",
          "htc_status": "vencedora",
          "htc_deposito": "50.00",
          "htc_datacriacao": "2024-04-27T12:34:56.789Z",
          "htc_cota1": "01",
          "htc_cota2": "05",
          "htc_cota3": "12",
          "htc_cota4": "23",
          "htc_cota5": "34",
          "htc_cota6": "45"
        },
        {
          "htc_id": "uuid2",
          "htc_idcliente": "cli_uuid2",
          "htc_idjogo": "jog_uuid2",
          "htc_status": "não vencedora",
          "htc_deposito": "75.00",
          "htc_datacriacao": "2024-04-28T09:21:34.123Z",
          "htc_cota1": "02",
          "htc_cota2": "06",
          // ... outros números
        }
      ]
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

#### 8. Histórico Financeiro do Cliente

- **Endpoint:** `/api/cliente/financialhistory/[id]`
- **Método:** `GET`
- **Descrição:** Retorna o histórico financeiro do cliente, incluindo depósitos e comissões.
- **Autenticação:** `admin` e `superadmin`
- **Parâmetros de Rota:**
  - `[id]`: ID do cliente.

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "financials": [
        {
          "fic_id": "uuid1",
          "fic_idcolaborador": "colab_uuid1",
          "fic_idcliente": "cli_uuid1",
          "fic_deposito_cliente": "50.00",
          "fic_porcentagem": 10,
          "fic_comissao": "5.00",
          "fic_tipocomissao": "compra",
          "fic_descricao": "Comissão pela compra do cliente cli_uuid1",
          "fic_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "fic_id": "uuid2",
          "fic_idcolaborador": "colab_uuid2",
          "fic_idcliente": "cli_uuid2",
          "fic_deposito_cliente": "75.00",
          "fic_porcentagem": 10,
          "fic_comissao": "7.50",
          "fic_tipocomissao": "compra",
          "fic_descricao": "Comissão pela compra do cliente cli_uuid2",
          "fic_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

#### 9. Login do Cliente

- **Endpoint:** `/api/cliente/login`
- **Método:** `POST`
- **Descrição:** Autentica um cliente e retorna um token JWT para acesso às rotas protegidas.
- **Body da Requisição:**

  ```json
  {
    "cli_telefone": "11999999999",
    "cli_password": "senha_segura"
  }
  ```

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "cliente": {
        "cli_id": "uuid",
        "cli_status": "active",
        "cli_nome": "Nome do Cliente",
        "cli_email": "cliente@example.com",
        "cli_telefone": "11999999999",
        "cli_idcolaborador": "uuid_colab",
        "cli_datacriacao": "2024-04-27T12:34:56.789Z"
      },
      "token": "jwt_token_aqui"
    }
    ```

  - **Erro (400/500):** Mensagens de erro correspondentes.

#### 10. Dashboard do Cliente - Meus Jogos

- **Endpoint:** `/api/cliente/meus-jogos`
- **Método:** `GET`
- **Descrição:** Retorna uma lista dos jogos em que o cliente participou, incluindo detalhes das apostas.
- **Autenticação:** `cliente`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "jogos": [
        {
          "id": "htc_id1",
          "nome": "MEGA-SENA",
          "numeros_escolhidos": ["01", "05", "12", "23", "34", "45"],
          "valor": 50.00,
          "status": "vencedora",
          "data": "2024-04-27T12:34:56.789Z",
          "numeros_sorteados": ["01", "05", "12", "23", "34", "45"],
          "resultado": "Parabéns! Você ganhou!"
        },
        {
          "id": "htc_id2",
          "nome": "LOTOFACIL",
          "numeros_escolhidos": ["02", "06", "14", "22", "33", "44", "55", "66", "77", "88", "99", "11", "13", "17", "19"],
          "valor": 75.00,
          "status": "não vencedora",
          "data": "2024-04-28T09:21:34.123Z",
          "numeros_sorteados": ["03", "07", "15", "23", "34", "45", "56", "67", "78", "89", "90", "12", "14", "18", "20"],
          "resultado": "Infelizmente, você não ganhou desta vez."
        }
      ]
    }
    ```

  - **Erro (401/500):** Mensagens de erro correspondentes.

### Colaborador APIs

#### 1. Listar Clientes de um Colaborador

- **Endpoint:** `/api/colaborador/clients`
- **Método:** `GET`
- **Descrição:** Retorna uma lista de clientes associados a um colaborador específico.
- **Autenticação:** `colaborador`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "clientes": [
        {
          "cli_id": "uuid1",
          "cli_status": "active",
          "cli_nome": "Cliente 1",
          "cli_email": "cliente1@example.com",
          "cli_telefone": "11999999999",
          "cli_idcolaborador": "colab_uuid1",
          "cli_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "cli_id": "uuid2",
          "cli_status": "inactive",
          "cli_nome": "Cliente 2",
          "cli_email": "cliente2@example.com",
          "cli_telefone": "11888888888",
          "cli_idcolaborador": "colab_uuid1",
          "cli_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 2. Histórico de Comissões do Colaborador

- **Endpoint:** `/api/colaborador/commissionhistory/[id]`
- **Método:** `GET`
- **Descrição:** Retorna o histórico de comissões recebidas por um colaborador.
- **Autenticação:** `admin` e `superadmin`
- **Parâmetros de Rota:**
  - `[id]`: ID do colaborador.

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "commissions": [
        {
          "fic_id": "uuid1",
          "fic_idcolaborador": "colab_uuid1",
          "fic_idcliente": "cli_uuid1",
          "fic_deposito_cliente": "50.00",
          "fic_porcentagem": 10,
          "fic_comissao": "5.00",
          "fic_tipocomissao": "compra",
          "fic_descricao": "Comissão pela compra da aposta htc_id1",
          "fic_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "fic_id": "uuid2",
          "fic_idcolaborador": "colab_uuid1",
          "fic_idcliente": "cli_uuid2",
          "fic_deposito_cliente": "75.00",
          "fic_porcentagem": 10,
          "fic_comissao": "7.50",
          "fic_tipocomissao": "compra",
          "fic_descricao": "Comissão pela compra da aposta htc_id2",
          "fic_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 3. Dados Bancários do Colaborador

- **Endpoint:** `/api/colaborador/dados-bancarios`
- **Método:** `GET`
- **Descrição:** Retorna os dados bancários do colaborador para processamento de comissões.
- **Autenticação:** `colaborador`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "dadosBancarios": {
        "dba_id": "uuid_banco",
        "dba_idcolaborador": "colab_uuid1",
        "dba_banco": "Banco do Brasil",
        "dba_agencia": "1234",
        "dba_conta": "56789-0",
        "dba_tipo_conta": "Corrente",
        "dba_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (401/500):** Mensagens de erro correspondentes.

#### 4. Referrals de um Colaborador

- **Endpoint:** `/api/colaborador/referrals/[id]`
- **Método:** `GET`
- **Descrição:** Retorna uma lista de referrals (clientes indicados) por um colaborador.
- **Autenticação:** `admin` e `superadmin`
- **Parâmetros de Rota:**
  - `[id]`: ID do colaborador.

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "referrals": [
        {
          "cli_id": "uuid1",
          "cli_status": "active",
          "cli_nome": "Cliente 1",
          "cli_email": "cliente1@example.com",
          "cli_telefone": "11999999999",
          "cli_idcolaborador": "colab_uuid1",
          "cli_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "cli_id": "uuid2",
          "cli_status": "inactive",
          "cli_nome": "Cliente 2",
          "cli_email": "cliente2@example.com",
          "cli_telefone": "11888888888",
          "cli_idcolaborador": "colab_uuid1",
          "cli_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

### Jogos APIs

#### 1. Cadastrar Jogos

- **Endpoint:** `/api/jogos/create`
- **Método:** `POST`
- **Descrição:** Permite que um administrador registre um novo jogo no sistema.
- **Autenticação:** `admin` e `superadmin`
- **Body da Requisição:**

  ```json
  {
    "jog_nome": "MEGA-SENA",
    "jog_status": "ativo",
    "jog_data_sorteio": "2024-05-01T20:00:00.000Z",
    "jog_premiototal": 5000000,
    "jog_numeros_sorteados": null,
    "jog_ganhadores": []
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "jogo": {
        "jog_id": "uuid_jogo",
        "jog_nome": "MEGA-SENA",
        "jog_status": "ativo",
        "jog_data_sorteio": "2024-05-01T20:00:00.000Z",
        "jog_premiototal": 5000000,
        "jog_numeros_sorteados": null,
        "jog_ganhadores": [],
        "jog_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 2. Listar Jogos Disponíveis

- **Endpoint:** `/api/jogos/list`
- **Método:** `GET`
- **Descrição:** Retorna uma lista de todos os jogos disponíveis para apostas.
- **Autenticação:** `admin`, `superadmin` e `cliente`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "jogos": [
        {
          "jog_id": "uuid_jogo1",
          "jog_nome": "MEGA-SENA",
          "jog_status": "ativo",
          "jog_data_sorteio": "2024-05-01T20:00:00.000Z",
          "jog_premiototal": 5000000,
          "jog_numeros_sorteados": ["01", "05", "12", "23", "34", "45"],
          "jog_ganhadores": ["cliente_uuid1", "cliente_uuid2"],
          "jog_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        {
          "jog_id": "uuid_jogo2",
          "jog_nome": "LOTOFACIL",
          "jog_status": "ativo",
          "jog_data_sorteio": "2024-05-02T20:00:00.000Z",
          "jog_premiototal": 3000000,
          "jog_numeros_sorteados": ["02", "06", "14", "22", "33", "44", "55", "66", "77", "88", "99", "11", "13", "17", "19"],
          "jog_ganhadores": [],
          "jog_datacriacao": "2024-04-28T09:21:34.123Z"
        }
      ]
    }
    ```

  - **Erro (401/500):** Mensagens de erro correspondentes.

### Financeiro APIs

#### 1. Obter Comissões dos Clientes

- **Endpoint:** `/api/financeiro/clientes`
- **Método:** `GET`
- **Descrição:** Retorna as comissões associadas aos clientes.
- **Autenticação:** `admin` e `financeiro`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "comissoes": [
        {
          "conf_id": "uuid1",
          "conf_nome": "comissao_colaborador",
          "conf_descricao": "Comissão padrão para colaboradores",
          "conf_valor": 10,
          "conf_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        // ... outras comissões
      ]
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

#### 2. Obter Comissões dos Colaboradores

- **Endpoint:** `/api/financeiro/colaboradores`
- **Método:** `GET`
- **Descrição:** Retorna as comissões associadas aos colaboradores.
- **Autenticação:** `admin` e `financeiro`
- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "comissoes": [
        {
          "fic_id": "uuid1",
          "fic_idcolaborador": "colab_uuid1",
          "fic_idcliente": "cli_uuid1",
          "fic_deposito_cliente": "50.00",
          "fic_porcentagem": 10,
          "fic_comissao": "5.00",
          "fic_tipocomissao": "compra",
          "fic_descricao": "Comissão pela compra da aposta htc_id1",
          "fic_datacriacao": "2024-04-27T12:34:56.789Z"
        },
        // ... outras comissões
      ]
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

#### 3. Criar Financeiro Administrador

- **Endpoint:** `/api/financeiro_administrador/create`
- **Método:** `POST`
- **Descrição:** Permite que o administrador registre novas entradas financeiras para o administrador.
- **Autenticação:** `admin`
- **Body da Requisição:**

  ```json
  {
    "fid_id_historico_cliente": "htc_id1",
    "fid_status": "pendente",
    "fid_valor_admin": 1000.00,
    "fid_valor_colaborador": 500.00,
    "fid_valor_rede": 1500.00
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "financeiroAdministrador": {
        "fid_id": "uuid_fin_admin",
        "fid_id_historico_cliente": "htc_id1",
        "fid_status": "pendente",
        "fid_valor_admin": 1000.00,
        "fid_valor_colaborador": 500.00,
        "fid_valor_rede": 1500.00,
        "fid_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 4. Criar Financeiro Colaborador

- **Endpoint:** `/api/financeiro_colaborador/create`
- **Método:** `POST`
- **Descrição:** Permite que o administrador registre novas entradas financeiras para os colaboradores.
- **Autenticação:** `admin`
- **Body da Requisição:**

  ```json
  {
    "fic_idcolaborador": "colab_uuid1",
    "fic_idcliente": "cli_uuid1",
    "fic_deposito_cliente": 50.00,
    "fic_porcentagem": 10,
    "fic_comissao": 5.00,
    "fic_tipocomissao": "compra",
    "fic_descricao": "Comissão pela compra da aposta htc_id1"
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "financeiroColaborador": {
        "fic_id": "uuid_fin_colab",
        "fic_idcolaborador": "colab_uuid1",
        "fic_idcliente": "cli_uuid1",
        "fic_deposito_cliente": 50.00,
        "fic_porcentagem": 10,
        "fic_comissao": 5.00,
        "fic_tipocomissao": "compra",
        "fic_descricao": "Comissão pela compra da aposta htc_id1",
        "fic_datacriacao": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 5. Resumo Financeiro do Colaborador

- **Endpoint:** `/api/financeiro/colaboradores/resumo/[id]`
- **Método:** `GET`
- **Descrição:** Retorna um resumo financeiro para um colaborador específico, incluindo totais recebidos, comissões pendentes e pagas.
- **Autenticação:** `admin` e `superadmin`
- **Parâmetros de Rota:**
  - `[id]`: ID do colaborador.

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "resumo": {
        "totalRecebido": 1500.00,
        "comissaoColaborador": 500.00,
        "totalComissao": 1000.00,
        "totalPago": 300.00
      }
    }
    ```

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

#### 6. Exportar Dados Financeiros do Colaborador

- **Endpoint:** `/api/financeiro/colaboradores/export`
- **Método:** `GET`
- **Descrição:** Exporta os dados financeiros do colaborador em formato CSV para download.
- **Autenticação:** `admin` e `superadmin`
- **Resposta:**

  - **Sucesso (200):** Arquivo CSV para download.

  - **Erro (401/403/500):** Mensagens de erro correspondentes.

### Operações APIs

#### 1. Registrar Operações

- **Endpoint:** `/api/operacoes/create`
- **Método:** `POST`
- **Descrição:** Permite que o administrador registre novas operações no sistema.
- **Autenticação:** `admin`
- **Body da Requisição:**

  ```json
  {
    "opt_nome": "Nome da Operação",
    "opt_grupo": "Grupo da Operação",
    "opt_descricao": "Descrição detalhada da operação"
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "operacao": {
        "opt_id": "uuid_operacao",
        "opt_nome": "Nome da Operação",
        "opt_grupo": "Grupo da Operação",
        "opt_descricao": "Descrição detalhada da operação",
        "opt_datacriacao": "2024-04-27T12:34:56.789Z",
        "opt_dataupdate": "2024-04-27T12:34:56.789Z"
      }
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

### Webhooks Mercado Pago

#### 1. Receber Notificações de Pagamentos

- **Endpoint:** `/api/pagamentos/webhook`
- **Método:** `POST`
- **Descrição:** Recebe notificações do Mercado Pago sobre eventos de pagamentos, atualizando o status das transações no sistema.
- **Autenticação:** Validação da origem do webhook via assinaturas fornecidas pelo Mercado Pago.
- **Body da Requisição:**

  ```json
  {
    "id": "uuid_da_transacao",
    "status": "approved",
    "transaction_amount": 100.00,
    "payer": {
      "email": "cliente@example.com"
    }
    // ... outros campos fornecidos pelo Mercado Pago
  }
  ```

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "received": true
    }
    ```

  - **Erro (500):** Mensagem de erro correspondente.

### Jogos APIs

#### 1. Registrar Resultados dos Sorteios

- **Endpoint:** `/api/resultados/create`
- **Método:** `POST`
- **Descrição:** Permite que o administrador registre os resultados dos sorteios, processando automaticamente as apostas para determinar vencedores e atualizar financeiros.
- **Autenticação:** `admin` e `superadmin`
- **Body da Requisição:**

  ```json
  {
    "jogo_slug": "mega-sena",
    "tipo_jogo": "MEGA",
    "numeros": "01,05,12,23,34,45",
    "dezena": null,
    "horario": null,
    "data_sorteio": "2024-05-01T20:00:00.000Z",
    "premio": 5000000
  }
  ```

- **Resposta:**

  - **Sucesso (201):**

    ```json
    {
      "resultado": {
        "resultado_id": "uuid_resultado",
        "jogo_slug": "mega-sena",
        "tipo_jogo": "MEGA",
        "numeros": "01,05,12,23,34,45",
        "dezena": null,
        "horario": null,
        "data_sorteio": "2024-05-01T20:00:00.000Z",
        "premio": 5000000
      }
    }
    ```

  - **Erro (400/403/500):** Mensagens de erro correspondentes.

#### 2. Obter Resultados de um Jogo Específico

- **Endpoint:** `/api/resultados/[jogo_slug]`
- **Método:** `GET`
- **Descrição:** Retorna os resultados de um jogo específico identificado pelo seu slug.
- **Autenticação:** `admin`, `superadmin` e `cliente`
- **Parâmetros de Rota:**
  - `[jogo_slug]`: Slug do jogo, por exemplo, "mega-sena".

- **Resposta:**

  - **Sucesso (200):**

    ```json
    {
      "resultados": [
        {
          "resultado_id": "uuid1",
          "jogo_slug": "mega-sena",
          "tipo_jogo": "MEGA",
          "numeros": "01,05,12,23,34,45",
          "dezena": null,
          "horario": null,
          "data_sorteio": "2024-05-01T20:00:00.000Z",
          "premio": 5000000
        },
        // ... outros resultados
      ]
    }
    ```

  - **Erro (500):** Mensagem de erro correspondente.

## Fluxo de Trabalho

A seguir, descrevemos o fluxo de trabalho principal do sistema, destacando a interação entre administradores, colaboradores e clientes.

1. **Registro de Jogos e Comissões pelo Administrador:**
   - O administrador registra novos jogos usando a rota `/api/jogos/create`.
   - Configura as comissões para colaboradores usando a rota `/api/admin/commission/create`.

2. **Cadastro de Clientes:**
   - Administradores, superadministradores ou colaboradores registram novos clientes usando a rota `/api/cliente/create`.
   - Cada cliente pode estar associado a um colaborador via `cli_idcolaborador`.

3. **Participação de Clientes em Jogos:**
   - Clientes autenticados utilizam a rota `/api/cliente/participar` para registrar suas apostas em jogos.
   - Após a aposta, o cliente realiza o pagamento via Mercado Pago.

4. **Processamento de Pagamentos:**
   - A API do Mercado Pago envia notificações via webhook para a rota `/api/pagamentos/webhook`.
   - O backend atualiza o status da transação e, se confirmado, atualiza automaticamente os financeiros do colaborador e do administrador.

5. **Registro e Processamento de Resultados:**
   - O administrador registra os resultados dos sorteios via rota `/api/resultados/create`.
   - O backend processa todas as apostas para determinar vencedores e atualiza os financeiros conforme necessário.

6. **Acompanhamento Financeiro:**
   - Colaboradores utilizam rotas como `/api/financeiro/colaboradores/resumo/[id]` para acompanhar suas comissões.
   - Administradores podem exportar dados financeiros e acompanhar o status de todas as comissões.

7. **Dashboard do Cliente:**
   - Clientes autenticados acessam seu dashboard para ver jogos disponíveis, histórico de apostas e status financeiros.

## Considerações de Segurança

- **Armazenamento Seguro de Credenciais:** Todas as credenciais e chaves sensíveis são armazenadas em variáveis de ambiente.
- **Hashing de Senhas:** Utilizamos `bcryptjs` para hash de senhas, garantindo que nunca armazenamos senhas em texto puro.
- **Autenticação via JWT:** Controlamos o acesso às rotas protegidas através de tokens JWT, garantindo que apenas usuários autenticados e autorizados possam acessar determinadas funcionalidades.
- **Validação de Dados:** Todas as entradas de usuários são validadas rigorosamente para evitar injeções de SQL e outros tipos de ataques.
- **HTTPS:** Recomenda-se utilizar HTTPS para todas as comunicações entre o cliente e o servidor.

## Melhorias Futuras

- **Implementação de Transações Atômicas:** Utilizar `TransactWriteItemsCommand` do DynamoDB para garantir a consistência dos dados em operações críticas.
- **Escalabilidade:** Implementar filas (como AWS SQS) para processar apostas e resultados de forma assíncrona, melhorando a escalabilidade.
- **Notificações em Tempo Real:** Integrar sistemas de notificação (como WebSockets ou AWS SNS) para informar clientes sobre o status de suas apostas e pagamentos.
- **Interface de Administração Ampliada:** Desenvolver um painel de administração mais robusto para gerenciar jogos, clientes, colaboradores e financeiros.
- **Relatórios Avançados:** Implementar funcionalidades de geração de relatórios detalhados para análises financeiras e de desempenho.
- **Melhorias na Segurança:** Implementar rate limiting, monitoramento de atividades suspeitas e autenticação multifator.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests para melhorias, correções de bugs ou novas funcionalidades.

1. **Fork o Repositório**
2. **Crie uma Branch para sua Feature:** `git checkout -b feature/nova-feature`
3. **Comite suas Alterações:** `git commit -m 'Adiciona nova feature'`
4. **Push para a Branch:** `git push origin feature/nova-feature`
5. **Abra um Pull Request**

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Contato:**

- **Email:** suporte@bolaoonline.com.br
- **Website:** [www.bolaoonline.com.br](https://www.bolaoonline.com.br)
- **GitHub:** [@seu-usuario](https://github.com/seu-usuario)

---

*Desenvolvido com ❤️ por [Daniel]*