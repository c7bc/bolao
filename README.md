# Documentação do Projeto Bolão

## Instalação
Para instalar o projeto, siga os passos abaixo:

1. Clone o repositório:
   ```bash
   git clone https://github.com/c7bc/bolao.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd bolao
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

## Uso
Para iniciar o aplicativo:

```bash
npm run dev
```
Acesse o aplicativo em http://localhost:3000.

## Tech Stack
- **Frontend:** Next.js, React
- **Backend:** Node.js, Express
- **Banco de Dados:** AWS DynamoDB
- **Integração de Pagamentos:** Mercado Pago

## Estrutura do Projeto
```
bolao/
├── src/
│   ├── components/  # Componentes reutilizáveis
│   ├── pages/       # Páginas da aplicação
│   ├── services/    # Serviços de API
│   ├── styles/      # Estilos globais
│   └── utils/       # Utilitários
├── .env             # Variáveis de ambiente
├── package.json      # Configurações do projeto
└── README.md        # Documentação
```

## Recursos
- Criação de pools de apostas
- Ganhos e acompanhamento de apostas
- Integração com Mercado Pago para pagamentos

## Documentação da API
- **GET /api/pools**: Retorna todos os pools.
- **POST /api/pools**: Cria um novo pool.
- **GET /api/pools/:id**: Retorna os detalhes de um pool específico.

## Variáveis de Ambiente
Defina as seguintes variáveis em um arquivo `.env`:
- `MONGO_URI`: URI do MongoDB.
- `AWS_ACCESS_KEY_ID`: ID da chave de acesso AWS.
- `AWS_SECRET_ACCESS_KEY`: Chave de acesso secreta AWS.
- `MERCADO_PAGO_ACCESS_TOKEN`: Token de acesso do Mercado Pago.

## Implantação
Para implantar o aplicativo:
1. Configure seu ambiente AWS.
2. Utilize o AWS Amplify para implantar o frontend.
3. Implante o backend em um servidor Node.js ou AWS Lambda.

## Solução de Problemas
- **Problema de conexão com o banco de dados:** Verifique as credenciais e a conexão da AWS.
- **Erro ao integrar o Mercado Pago:** Certifique-se de que o token de acesso está correto e ativo.
- **Aplicativo não inicia:** Verifique as mensagens de erro no console e as dependências do projeto. 

## Contribuindo
Contribuições são bem-vindas! Sinta-se à vontade para abrir problemas ou enviar pull requests.

## Licença
Este projeto é licenciado sob a MIT License.