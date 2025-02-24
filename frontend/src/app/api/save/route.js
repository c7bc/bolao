import {
  DynamoDBClient,
  DescribeTableCommand
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'personalization-config';

const client = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(req) {
  try {
      // Check if the table exists
      try {
          await client.send(new DescribeTableCommand({
              TableName: TABLE_NAME
          }));
      } catch (describeTableError) {
          console.error('Table does not exist:', describeTableError);
          return new Response(JSON.stringify({
              message: 'Tabela não encontrada',
              error: 'A tabela DynamoDB especificada não existe.',
              timestamp: new Date().toISOString()
          }), {
              status: 500,
              headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
              }
          });
      }

      const data = await req.json();

      // Validate data to prevent saving incomplete or incorrect configurations
      if (!data) {
          return new Response(JSON.stringify({
              message: 'Dados inválidos',
              error: 'Nenhum dado recebido',
              timestamp: new Date().toISOString()
          }), {
              status: 400,
              headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
              }
          });
      }

      // Process and normalize header configuration
      if (data.header) {
          const headerConfig = {
              logo: data.header.logo || '',
              navLinks: data.header.navLinks || [],
              bolaoLinks: data.header.bolaoLinks || [],
              styles: {
                  height: data.header.styles?.height || '80px',
                  backgroundColor: data.header.styles?.backgroundColor || '#FFFFFF',
                  textColor: data.header.styles?.textColor || '#4A5568',
                  hoverColor: data.header.styles?.hoverColor || '#48BB78',
                  isFixed: data.header.styles?.isFixed || false,
                  transparentOnScroll: data.header.styles?.transparentOnScroll || false
              }
          };
          data.header = headerConfig;
      }

      // Process and normalize hero configuration
      if (data.hero) {
          data.hero = {
              slides: data.hero.slides || [],
              styles: {
                  height: data.hero.styles?.height || '600px',
                  overlayColor: data.hero.styles?.overlayColor || 'rgba(0,0,0,0.4)',
                  textColor: data.hero.styles?.textColor || '#FFFFFF',
                  buttonColor: data.hero.styles?.buttonColor || '#48BB78',
                  buttonTextColor: data.hero.styles?.buttonTextColor || '#FFFFFF'
              }
          };
      }

      // Process and normalize footer configuration
      if (data.footer) {
          data.footer = {
              logo: data.footer.logo || '',
              links: data.footer.links || [],
              socialMedia: data.footer.socialMedia || [],
              phone: data.footer.phone || '',
              copyright: data.footer.copyright || '',
              styles: {
                  backgroundColor: data.footer.styles?.backgroundColor || '#1A202C',
                  textColor: data.footer.styles?.textColor || '#FFFFFF',
                  linkColor: data.footer.styles?.linkColor || '#A0AEC0'
              }
          };
      }

      // Process and normalize integration configuration
      if (data.integration) {
          data.integration = {
              EFI_API_URL: data.integration.EFI_API_URL || '',
              EFI_API_KEY: data.integration.EFI_API_KEY || '',
              EFI_WEBHOOK_SECRET: data.integration.EFI_WEBHOOK_SECRET || ''
          };
      }

      // Process and normalize actives configuration
      if (data.actives) {
          const allowedStatuses = ['active', 'maintenance', 'inactive'];
          if (data.actives.pages) {
              for (const [page, status] of Object.entries(data.actives.pages)) {
                  if (!allowedStatuses.includes(status)) {
                      return new Response(JSON.stringify({
                          message: 'Status inválido',
                          error: `O status para a página ${page} deve ser "active", "maintenance" ou "inactive"`,
                          timestamp: new Date().toISOString()
                      }), {
                          status: 400,
                          headers: {
                              'Content-Type': 'application/json',
                              'Cache-Control': 'no-cache'
                          }
                      });
                  }
              }
          } else if (data.actives.status) {
              if (!allowedStatuses.includes(data.actives.status)) {
                  return new Response(JSON.stringify({
                      message: 'Status inválido',
                      error: 'O status deve ser "active", "maintenance" ou "inactive"',
                      timestamp: new Date().toISOString()
                  }), {
                      status: 400,
                      headers: {
                          'Content-Type': 'application/json',
                          'Cache-Control': 'no-cache'
                      }
                  });
              }
          }
      }

      const params = {
          TableName: TABLE_NAME,
          Item: {
              id: 'personalization-config',
              updatedAt: new Date().toISOString(),
              ...data
          }
      };

      console.log("Params being sent to DynamoDB:", JSON.stringify(params, null, 2)); // Log the params

      await docClient.send(new PutCommand(params));

      return new Response(JSON.stringify({
          message: 'Configurações salvas com sucesso',
          timestamp: new Date().toISOString()
      }), {
          status: 200,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
          }
      });
  } catch (error) {
      console.error('Erro ao salvar no DynamoDB:', error);
      return new Response(JSON.stringify({
          message: 'Erro ao salvar as configurações',
          error: error.message,
          timestamp: new Date().toISOString()
      }), {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
          }
      });
  }
}

export async function GET() {
  try {
      // Check if the table exists
      try {
          await client.send(new DescribeTableCommand({
              TableName: TABLE_NAME
          }));
      } catch (describeTableError) {
          console.error('Table does not exist:', describeTableError);
          return new Response(JSON.stringify({
              message: 'Tabela não encontrada',
              error: 'A tabela DynamoDB especificada não existe.',
              timestamp: new Date().toISOString()
          }), {
              status: 500,
              headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
              }
          });
      }

      const params = {
          TableName: TABLE_NAME,
          Key: {
              id: 'personalization-config'
          }
      };

      const result = await docClient.send(new GetCommand(params));

      if (!result.Item) {
          return new Response(JSON.stringify({
              message: 'Configurações não encontradas',
              timestamp: new Date().toISOString()
          }), {
              status: 404,
              headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
              }
          });
      }

      return new Response(JSON.stringify({
          ...result.Item,
          timestamp: new Date().toISOString()
      }), {
          status: 200,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
          }
      });
  } catch (error) {
      console.error('Erro ao buscar dados:', error);
      return new Response(JSON.stringify({
          message: 'Erro ao buscar as configurações',
          error: error.message,
          timestamp: new Date().toISOString()
      }), {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
          }
      });
  }
}