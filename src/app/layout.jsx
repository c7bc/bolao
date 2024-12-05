import { Providers } from './providers'
import { Poppins, Nunito_Sans } from 'next/font/google'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-nunito-sans',
})

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'personalization-config';
const REGION = process.env.REGION || 'sa-east-1';

const getClient = () => {
  if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
    return null;
  }

  const client = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    }
  });

  return DynamoDBDocumentClient.from(client);
};

async function getHeadConfig() {
  const docClient = getClient();
  
  if (!docClient) {
    console.warn('AWS credentials not configured');
    return null;
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: 'personalization-config'
      }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item?.head || null;
  } catch (error) {
    console.error('Error fetching head config:', error);
    return null;
  }
}

export default async function RootLayout({ children }) {
  const headConfig = await getHeadConfig();
  const defaultTitle = 'Meu Site';
  const defaultDescription = 'Descrição do meu site';
  const defaultKeywords = 'site,web,aplicação';

  return (
    <html lang="pt-BR" data-lt-installed="true">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{headConfig?.title || defaultTitle}</title>
        <meta name="description" content={headConfig?.description || defaultDescription} />
        <meta name="keywords" content={headConfig?.keywords || defaultKeywords} />
        {headConfig?.favicon && <link rel="icon" href={headConfig.favicon} type="image/x-icon" />}
      </head>
      <body className={`${poppins.variable} ${nunitoSans.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}