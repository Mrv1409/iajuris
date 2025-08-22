// src/contexts/ProfessionalContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// Tipos para o contexto
interface ProfessionalData {
  id: string;
  nome: string;
  email: string;
  slug: string;
  cidade: string;
  especialidades: string[];
  biografia: string;
  contato: string;
  experiencia: string;
  fotoPerfilUrl: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  corTerciaria: string;
  dataCriacao: string;
  role: string;
  status: string;
}

interface ProfessionalContextType {
  // Dados do profissional
  professional: ProfessionalData | null;
  
  // Estados de loading
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // ID para filtrar dados (chave principal)
  advogadoId: string | null;
  
  // Métodos uteis
  refreshProfessionalData: () => Promise<void>;
}

// Criar o contexto
const ProfessionalContext = createContext<ProfessionalContextType | undefined>(undefined);

// Provider Component
export function ProfessionalProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [professional, setProfessional] = useState<ProfessionalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar dados completos do profissional
  const fetchProfessionalData = async (advogadoId: string) => {
    try {
      const docRef = doc(db, 'advogados', advogadoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfessional({
          id: docSnap.id,
          ...data
        } as ProfessionalData);
      } else {
        console.error('Dados do profissional não encontrados');
        setProfessional(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do profissional:', error);
      setProfessional(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para refresh manual dos dados
  const refreshProfessionalData = async () => {
    if (session?.user?.id) {
      setIsLoading(true);
      await fetchProfessionalData(session.user.id);
    }
  };

  // Effect principal - gerencia autenticação e dados
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated' || !session?.user?.id) {
      setIsLoading(false);
      setProfessional(null);
      return;
    }

    // Verificar se é um advogado
    if (session.user.role !== 'advogado') {
      console.error('Usuário não é um advogado');
      setIsLoading(false);
      setProfessional(null);
      return;
    }

    // Buscar dados completos do profissional
    fetchProfessionalData(session.user.id);
  }, [session, status]);

  // Valores do contexto
  const contextValue: ProfessionalContextType = {
    professional,
    isLoading,
    isAuthenticated: !!session?.user?.id && session.user.role === 'advogado',
    advogadoId: session?.user?.id || null, // ✅ CHAVE PRINCIPAL PARA FILTROS
    refreshProfessionalData,
  };

  return (
    <ProfessionalContext.Provider value={contextValue}>
      {children}
    </ProfessionalContext.Provider>
  );
}

// Hook para usar o contexto
export function useProfessional() {
  const context = useContext(ProfessionalContext);
  
  if (context === undefined) {
    throw new Error('useProfessional deve ser usado dentro de um ProfessionalProvider');
  }
  
  return context;
}

// Hook específico para filtros de dados (mais usado nos componentes)
export function useProfessionalFilter() {
  const { advogadoId, isAuthenticated } = useProfessional();
  
  if (!isAuthenticated || !advogadoId) {
    throw new Error('Usuário não autenticado ou advogadoId não disponível');
  }
  
  return {
    advogadoId, // ✅ ID para usar nos filtros: where("advogadoId", "==", advogadoId)
    createFilter: () => ({ advogadoId }), // ✅ Objeto pronto para filtros
  };
}