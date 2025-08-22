// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // ===== CONFIGURAÇÃO DE UPLOAD DE ARQUIVOS =====
  if (request.nextUrl.pathname.startsWith('/api/pdf-analysis')) {
    const response = NextResponse.next();
    // Permite arquivos de até 50MB
    response.headers.set('Content-Length-Limit', '52428800'); // 50MB em bytes
    return response;
  }

  // ===== PROTEÇÃO DE ROTAS DOS PROFISSIONAIS =====
  if (request.nextUrl.pathname.startsWith('/dashboard/leads/advogado')) {
    try {
      // Buscar token JWT da sessão
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Verificar se existe token
      if (!token) {
        console.log('❌ Middleware: Token não encontrado');
        return NextResponse.redirect(
          new URL('/auth/advogado/signin?error=SessionExpired', request.url)
        );
      }

      // Verificar se é um advogado
      if (token.role !== 'advogado') {
        console.log('❌ Middleware: Usuário não é advogado, role:', token.role);
        return NextResponse.redirect(
          new URL('/auth/advogado/signin?error=Unauthorized', request.url)
        );
      }

      // Verificar se tem ID do advogado
      if (!token.id) {
        console.log('❌ Middleware: ID do advogado não encontrado no token');
        return NextResponse.redirect(
          new URL('/auth/advogado/signin?error=InvalidSession', request.url)
        );
      }

      // ✅ Tudo OK - adicionar headers de segurança e continuar
      const response = NextResponse.next();

      // Headers de segurança
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Headers customizados para identificação (útil para logs)
      response.headers.set('X-Professional-ID', token.id as string);
      response.headers.set('X-Professional-Role', 'advogado');

      console.log('✅ Middleware: Acesso autorizado para advogado:', token.id);
      return response;

    } catch (error) {
      console.error('❌ Middleware: Erro na verificação do token:', error);
      return NextResponse.redirect(
        new URL('/auth/advogado/signin?error=AuthError', request.url)
      );
    }
  }

  // ===== PROTEÇÃO DAS ROTAS DE API DOS PROFISSIONAIS =====
  if (request.nextUrl.pathname.startsWith('/api/professional/')) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || token.role !== 'advogado' || !token.id) {
        return NextResponse.json(
          { 
            error: 'Unauthorized', 
            message: 'Acesso restrito a profissionais autenticados' 
          },
          { status: 401 }
        );
      }

      // ✅ API autorizada - adicionar headers
      const response = NextResponse.next();
      response.headers.set('X-Professional-ID', token.id as string);
      return response;

    } catch (error) {
      console.error('❌ Middleware API: Erro na verificação:', error);
      return NextResponse.json(
        { error: 'AuthError', message: 'Erro na autenticação' },
        { status: 500 }
      );
    }
  }

  // ===== REDIRECIONAMENTO AUTOMÁTICO DA ROTA BASE =====
  // Se acessar /dashboard/leads/advogado sem barra final, redirecionar
  if (request.nextUrl.pathname === '/dashboard/leads/advogado') {
    return NextResponse.redirect(
      new URL('/dashboard/leads/advogado/', request.url)
    );
  }

  // ===== PROTEÇÃO ADICIONAL: ROTAS ADMIN =====
  // Bloquear acesso de advogados a rotas administrativas
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/dashboard') && 
     !request.nextUrl.pathname.startsWith('/dashboard')) {
    

    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Se é advogado tentando acessar área admin, bloquear
      if (token && token.role === 'advogado') {
        console.log('❌ Middleware: Advogado tentando acessar área admin');
        return NextResponse.redirect(
          new URL('/dashboard/leads/advogado/?error=AccessDenied', request.url)
        );
      }
    } catch (error) {
      console.error('❌ Middleware Admin: Erro na verificação:', error);
    }
  }

  // ===== HEADERS DE SEGURANÇA GLOBAIS =====
  const response = NextResponse.next();
  
  // Aplicar headers de segurança em todas as rotas protegidas
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }

  return response;
}

export const config = {
  matcher: [
    // Rotas de upload
    '/api/pdf-analysis/:path*',
    
    // Rotas dos profissionais (páginas)
    '/dashboard/leads/advogado/:path*',
    
    // APIs dos profissionais
    '/api/professional/:path*',
    
    // Rotas administrativas (para bloqueio)
    '/admin/:path*',
    '/dashboard/:path*',
    
    // APIs em geral
    '/api/:path*',
  ],
};