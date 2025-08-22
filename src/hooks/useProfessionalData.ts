'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  limit,
  DocumentData,
  Query,
  Unsubscribe,
  WhereFilterOp,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useProfessionalFilter } from '@/contexts/ProfessionalContext';

// Tipos para os dados de leads
interface LeadData {
  id: string;
  advogadoId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  status: 'novo' | 'em_andamento' | 'finalizado' | 'arquivado';
  dataContato: string;
  cidadeCliente: string;
  especialidadeInteresse: string;
  // Campos adicionais opcionais
  createdAt?: string;
  updatedAt?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Tipo para estatísticas
interface LeadsStats {
  total: number;
  novos: number;
  emAndamento: number;
  finalizados: number;
  arquivados: number;
}

// Tipo para filtros customizados
interface CustomFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

// Hook principal para dados filtrados
export function useProfessionalData() {
  const { advogadoId } = useProfessionalFilter();

  // ===== LEADS-SAAS =====
  const useLeads = (options: {
    realTime?: boolean;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
    statusFilter?: string[];
  } = {}) => {
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
      realTime = false,
      orderByField = 'dataContato',
      orderDirection = 'desc',
      limitCount,
      statusFilter
    } = options;

    const fetchLeads = useCallback(async () => {
      if (!advogadoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Construir query base
        let q: Query<DocumentData> = query(
          collection(db, 'leads-saas'),
          where('advogadoId', '==', advogadoId) // ✅ FILTRO AUTOMÁTICO
        );

        // Adicionar filtro por status se especificado
        if (statusFilter && statusFilter.length > 0) {
          q = query(q, where('status', 'in', statusFilter));
        }

        // Adicionar ordenação
        if (orderByField) {
          q = query(q, orderBy(orderByField, orderDirection));
        }

        // Adicionar limite
        if (limitCount) {
          q = query(q, limit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        const leadsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeadData[];

        setLeads(leadsData);
      } catch (err) {
        console.error('Erro ao buscar leads:', err);
        setError('Erro ao carregar leads');
      } finally {
        setLoading(false);
      }//eslint-disable-next-line
    }, [advogadoId, statusFilter, orderByField, orderDirection, limitCount]);

    // Listener em tempo real
    useEffect(() => {
      if (!advogadoId) {
        setLoading(false);
        return;
      }

      let unsubscribe: Unsubscribe | undefined;

      if (realTime) {
        // Construir query para tempo real
        let q: Query<DocumentData> = query(
          collection(db, 'leads-saas'),
          where('advogadoId', '==', advogadoId)
        );

        if (statusFilter && statusFilter.length > 0) {
          q = query(q, where('status', 'in', statusFilter));
        }

        if (orderByField) {
          q = query(q, orderBy(orderByField, orderDirection));
        }

        if (limitCount) {
          q = query(q, limit(limitCount));
        }

        setLoading(true);
        unsubscribe = onSnapshot(
          q,
          (querySnapshot: QuerySnapshot<DocumentData>) => {
            const leadsData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as LeadData[];

            setLeads(leadsData);
            setLoading(false);
          },
          (err) => {
            console.error('Erro no listener de leads:', err);
            setError('Erro ao monitorar leads em tempo real');
            setLoading(false);
          }
        );
      } else {
        fetchLeads();
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };//eslint-disable-next-line
    }, []);

    return {
      leads,
      loading,
      error,
      refetch: fetchLeads
    };
  };

  // ===== ESTATÍSTICAS RÁPIDAS =====
  const useLeadsStats = () => {
    const [stats, setStats] = useState<LeadsStats>({
      total: 0,
      novos: 0,
      emAndamento: 0,
      finalizados: 0,
      arquivados: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!advogadoId) {
        setLoading(false);
        return;
      }

      const fetchStats = async () => {
        try {
          const q = query(
            collection(db, 'leads-saas'),
            where('advogadoId', '==', advogadoId) // ✅ FILTRO AUTOMÁTICO
          );

          const querySnapshot = await getDocs(q);
          const leads = querySnapshot.docs.map(doc => doc.data()) as LeadData[];

          const newStats: LeadsStats = {
            total: leads.length,
            novos: leads.filter(lead => lead.status === 'novo').length,
            emAndamento: leads.filter(lead => lead.status === 'em_andamento').length,
            finalizados: leads.filter(lead => lead.status === 'finalizado').length,
            arquivados: leads.filter(lead => lead.status === 'arquivado').length,
          };

          setStats(newStats);
        } catch (error) {
          console.error('Erro ao buscar estatísticas:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }, []);

    return { stats, loading };
  };

  // ===== BUSCA PERSONALIZADA =====
  const useCustomQuery = () => {
    const [data, setData] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    const executeQuery = useCallback(async (
      collectionName: string, 
      additionalFilters: CustomFilter[] = []
    ) => {
      if (!advogadoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Query base sempre com filtro por advogadoId
        let q: Query<DocumentData> = query(
          collection(db, collectionName),
          where('advogadoId', '==', advogadoId) // ✅ SEMPRE FILTRADO
        );

        // Adicionar filtros adicionais
        for (const filter of additionalFilters) {
          q = query(q, where(filter.field, filter.operator, filter.value));
        }

        const querySnapshot = await getDocs(q);
        const result = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setData(result);
      } catch (error) {
        console.error('Erro na query personalizada:', error);
      } finally {
        setLoading(false);
      }
    }, []);

    return {
      data,
      loading,
      executeQuery
    };
  };

  return {
    // Hooks principais
    useLeads,
    useLeadsStats,
    useCustomQuery,
    
    // ID do advogado para casos especiais
    advogadoId
  };
}

// ===== HOOKS ESPECÍFICOS (para facilitar uso) =====

// Hook para leads novos (dashboard principal)
export function useNewLeads(limit: number = 10) {
  const { useLeads } = useProfessionalData();
  return useLeads({
    statusFilter: ['novo'],
    limitCount: limit,
    realTime: true
  });
}

// Hook para todos os leads (página de leads)
export function useAllLeads(realTime: boolean = false) {
  const { useLeads } = useProfessionalData();
  return useLeads({
    realTime,
    orderByField: 'dataContato',
    orderDirection: 'desc'
  });
}

// Hook para estatísticas da dashboard
export function useDashboardStats() {
  const { useLeadsStats } = useProfessionalData();
  return useLeadsStats();
}