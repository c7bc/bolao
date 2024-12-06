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
  region: 'sa-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(req) {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    
    const data = await req.json();
    
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

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: 'personalization-config',
        updatedAt: new Date().toISOString(),
        ...data
      }
    };

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
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    
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