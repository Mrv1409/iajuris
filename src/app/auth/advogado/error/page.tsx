'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Erro de Autenticação</h1>
        <p className="text-gray-300 mb-6">
          Ocorreu um erro ao tentar fazer login: {error || 'Erro desconhecido'}
        </p>
        <Link 
          href="/auth/advogado/signin"
          className="bg-[#b0825a] text-black px-6 py-3 rounded-lg hover:bg-[#8b6942] transition-colors"
        >
          Tentar Novamente
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b0825a] mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}