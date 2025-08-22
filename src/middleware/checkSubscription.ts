// src/middleware/checkSubscription.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SubscriptionService } from '@/services/subscription.service';

// Rotas que precisam de assinatura ativa
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/pdf',
  '/api/analyze'
];

// Rotas que são sempre permitidas (login, checkout, etc)
const ALLOWED_ROUTES = [
  '/auth',
  '/api/auth',
  '/api/stripe',
  '/checkout'
];

export async function checkSubscription(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se a rota precisa de proteção
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Se não é rota protegida ou é rota sempre permitida, continuar
  if (!isProtectedRoute || isAllowedRoute) {
    return NextResponse.next();
  }

  try {
    // Verificar autenticação
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.sub) {
      // Usuário não autenticado, redirecionar para login
      const loginUrl = new URL('/auth/advogado/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar assinatura ativa
    const hasActiveSubscription = await SubscriptionService.isSubscriptionActive(token.sub);

    if (!hasActiveSubscription) {
      // Assinatura inativa, redirecionar para página de upgrade
      const upgradeUrl = new URL('/upgrade', request.url);
      upgradeUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(upgradeUrl);
    }

    // Tudo ok, continuar para a rota
    return NextResponse.next();

  } catch (error) {
    console.error('Erro no middleware de assinatura:', error);
    
    // Em caso de erro, redirecionar para página de erro
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

// Hook para usar no lado do cliente
export function useSubscriptionCheck() {
  // Esta função será usada nos componentes React
  // para verificar assinatura sem fazer redirect
  return {
    checkSubscription: async (userId: string) => {
      try {
        const response = await fetch('/api/subscription/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        
        const { isActive } = await response.json();
        return isActive;
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        return false;
      }
    }
  };
}