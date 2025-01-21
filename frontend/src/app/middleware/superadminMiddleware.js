// src/middleware/superadminMiddleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from '../utils/auth';

export function middleware(request) {
  // Verificar se a rota começa com /api/superadmin
  if (request.nextUrl.pathname.startsWith('/api/superadmin')) {
    try {
      // Verificar o token de autorização
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = verifyToken(token);

      // Verificar se o usuário é superadmin
      if (!decoded || decoded.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'Forbidden - Superadmin access required' },
          { status: 403 }
        );
      }

      // Se tudo estiver ok, continuar com a requisição
      return NextResponse.next();
    } catch (error) {
      console.error('Error in superadmin middleware:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }

  // Para outras rotas, continuar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: '/api/superadmin/:path*'
};