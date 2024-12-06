import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Utility function to check environment variables
const checkRequiredEnvVars = () => {
  const requiredEnvVars = [
    'REGION',
    'ACCESS_KEY_ID',
    'SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    return false;
  }
  return true;
};

// Utility function to get S3 client
const getS3Client = () => {
  if (!checkRequiredEnvVars()) {
    return null;
  }

  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
};

// Utility function to validate file
const validateFile = (file, maxSize) => {
  if (!file) {
    throw new Error('Nenhum arquivo enviado');
  }

  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande. Tamanho máximo permitido: ${maxSize / 1024 / 1024}MB`);
  }

  return true;
};

// Utility function to process image
const processImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .webp({ quality: 80 })
      .resize({
        width: 2000,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Erro ao processar imagem');
  }
};

export async function POST(request) {
  try {
    // Check environment variables first
    if (!checkRequiredEnvVars()) {
      return NextResponse.json({
        message: 'Erro de configuração do servidor',
        error: 'Variáveis de ambiente ausentes'
      }, {
        status: 500
      });
    }

    // Initialize S3 client
    const s3Client = getS3Client();
    if (!s3Client) {
      return NextResponse.json({
        message: 'Erro de configuração do S3',
        error: 'Não foi possível inicializar o cliente S3'
      }, {
        status: 500
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'image';
    const maxSize = parseInt(formData.get('maxSize')) || 5242880; // 5MB default

    // Validate file
    validateFile(file, maxSize);

    // Process file
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    let contentType = file.type;

    // Process images with Sharp
    if (file.type.startsWith('image/')) {
      buffer = await processImage(buffer);
      contentType = 'image/webp';
    }

    // Generate unique filename
    const fileName = `${uuidv4()}-${file.name.split('.')[0]}.${contentType.split('/')[1]}`;
    
    // Prepare S3 upload parameters
    const params = {
      Bucket: process.env.S3_BUCKET_NAME, // Fixed: Using the correct environment variable
      Key: `${type}/${fileName}`,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    };

    // Upload to S3
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Generate file URL
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${type}/${fileName}`;

    return NextResponse.json({
      url: fileUrl,
      type: contentType,
      size: buffer.length
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error in upload handler:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('Nenhum arquivo') || error.message.includes('muito grande')) {
      statusCode = 400;
    }

    return NextResponse.json({
      message: 'Erro ao fazer upload do arquivo',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }, {
      status: statusCode
    });
  }
}

export async function DELETE(request) {
  try {
    // Check environment variables first
    if (!checkRequiredEnvVars()) {
      return NextResponse.json({
        message: 'Erro de configuração do servidor',
        error: 'Variáveis de ambiente ausentes'
      }, {
        status: 500
      });
    }

    // Initialize S3 client
    const s3Client = getS3Client();
    if (!s3Client) {
      return NextResponse.json({
        message: 'Erro de configuração do S3',
        error: 'Não foi possível inicializar o cliente S3'
      }, {
        status: 500
      });
    }

    const { fileUrl } = await request.json();
    
    if (!fileUrl) {
      return NextResponse.json(
        { message: 'URL do arquivo não fornecida' },
        { status: 400 }
      );
    }

    const key = fileUrl.split('.com/')[1];
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME, // Fixed: Using the correct environment variable
      Key: key
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);

    return NextResponse.json({
      message: 'Arquivo excluído com sucesso'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error in delete handler:', error);
    return NextResponse.json({
      message: 'Erro ao excluir arquivo',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }, {
      status: 500
    });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Método não permitido' },
    { status: 405 }
  );
}