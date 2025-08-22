'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Scale, Shield, AlertTriangle, Loader2 } from 'lucide-react';

// Tipos para o Guard
interface ProfessionalGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string;
  showLoadingScreen?: boolean;
}

// Componente de Loading
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#3a2a1a] flex items-center justify-center">
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] rounded-full flex items-center justify-center mb-6 shadow-xl animate-pulse">
        <Scale className="w-8 h-8 text-white" />
      </div>
      <div className="flex items-center justify-center gap-3 mb-4">
        <Loader2 className="w-6 h-6 text-[#b0825a] animate-spin" />
        <h2 className="text-xl font-semibold text-white">Verificando acesso...</h2>
      </div>
      <p className="text-[#d4d4d4]">Aguarde um momento</p>
    </div>
  </div>
);

// Componente de Erro de Acesso
const AccessDeniedScreen = ({ message, redirectPath }: { message: string; redirectPath?: string }) => {
  const router = useRouter();

  useEffect(() => {
    if (redirectPath) {
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [redirectPath, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#3a2a1a] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mb-6 shadow-xl">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Acesso Negado</h2>
        <div 
          className="rounded-xl p-4 mb-6"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">{message}</p>
        </div>
        {redirectPath && (
          <p className="text-sm text-[#9ca3af]">
            Redirecionando em alguns segundos...
          </p>
        )}
      </div>
    </div>
  );
};

// ===== GUARD PRINCIPAL =====
export function ProfessionalGuard({
  children,
  fallback,
  redirectTo = '/auth/advogado/signin',
  requiredRole = 'advogado',
  showLoadingScreen = true
}: ProfessionalGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === 'loading') {
    return showLoadingScreen ? <LoadingScreen /> : (fallback || <div>Carregando...</div>);
  }

  // Não autenticado
  if (status === 'unauthenticated' || !session) {
    if (redirectTo) {
      router.push(redirectTo);
      return showLoadingScreen ? <LoadingScreen /> : null;
    }
    
    return fallback || (
      <AccessDeniedScreen 
        message="Você precisa estar logado para acessar esta página."
        redirectPath={redirectTo}
      />
    );
  }

  // Verificar role
  if (session.user?.role !== requiredRole) {
    return fallback || (
      <AccessDeniedScreen 
        message="Você não tem permissão para acessar esta área. Acesso restrito a profissionais."
      />
    );
  }

  // Verificar se tem ID do advogado
  if (!session.user?.id) {
    return fallback || (
      <AccessDeniedScreen 
        message="Erro na sessão. ID do profissional não encontrado."
        redirectPath={redirectTo}
      />
    );
  }

  // Tudo OK - renderizar conteúdo protegido
  return <>{children}</>;
}

// ===== GUARDS ESPECÍFICOS =====

// Guard apenas para verificar autenticação (mais leve)
export function AuthGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/advogado/signin');
    return null;
  }

  return fallback || <>{children}</>;
}

// Guard para componentes específicos (sem tela cheia)
export function ComponentGuard({ children, showError = true }: { children: React.ReactNode; showError?: boolean }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-[#b0825a] animate-spin mr-2" />
        <span className="text-[#d4d4d4]">Carregando...</span>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.id || session.user.role !== 'advogado') {
    return showError ? (
      <div 
        className="rounded-xl p-4 text-center"
        style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <Shield className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-300 font-medium">Acesso Restrito</p>
        <p className="text-red-300/70 text-sm mt-1">Conteúdo disponível apenas para profissionais</p>
      </div>
    ) : null;
  }

  return <>{children}</>;
}

// Hook para verificar permissões em qualquer lugar
export function useProfessionalGuard() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated' && !!session;
  const isProfessional = isAuthenticated && session?.user?.role === 'advogado';
  const hasAdvogadoId = isProfessional && !!session?.user?.id;
  const isLoading = status === 'loading';

  return {
    isAuthenticated,
    isProfessional,
    hasAdvogadoId,
    isLoading,
    canAccess: hasAdvogadoId, // ✅ Permissão total
    advogadoId: session?.user?.id || null,
    session
  };
}

// ===== WRAPPER PARA PÁGINAS INTEIRAS =====
export function withProfessionalGuard<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    fallback?: React.ReactNode;
    redirectTo?: string;
    requiredRole?: string;
  } = {}
) {
  return function WrappedComponent(props: T) {
    return (
      <ProfessionalGuard {...options}>
        <Component {...props} />
      </ProfessionalGuard>
    );
  };
}