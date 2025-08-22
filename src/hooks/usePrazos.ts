// hooks/usePrazos.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  query,
  where, // ✅ ADICIONADO - Necessário para filtro
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firestore'; // Ajuste o caminho conforme sua estrutura

// ✅ CORRIGIDO - Mudança de escritorioId para advogadoId
export function usePrazos(advogadoId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prazos, setPrazos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ CORRIGIDO - Buscar prazos do Firebase COM FILTRO de isolamento
  const fetchPrazos = async () => {
    try {
      setLoading(true);
      
      // ✅ ISOLAMENTO IMPLEMENTADO - Filtrar por advogadoId
      const q = query(
        collection(db, 'prazos'),
        where('advogadoId', '==', advogadoId), // ✅ FILTRO HÍBRIDO
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const prazosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPrazos(prazosData);
    } catch (error) {
      console.error('Erro ao buscar prazos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRIGIDO - Adicionar novo prazo COM advogadoId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addPrazo = async (novoPrazo: any): Promise<boolean> => {
    try {
      const docRef = await addDoc(collection(db, 'prazos'), {
        ...novoPrazo,
        advogadoId: advogadoId || 'default', // ✅ CORRIGIDO - advogadoId ao invés de escritorioId
        createdAt: serverTimestamp()
      });                                               
      
      // Atualizar estado local
      const prazoComId = {
        id: docRef.id,
        ...novoPrazo,
        advogadoId, // ✅ ADICIONADO - Para consistência local
        createdAt: new Date()
      };
      
      setPrazos(prev => [prazoComId, ...prev]);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar prazo:', error);
      return false;
    }
  };

  // Atualizar prazo existente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePrazo = async (id: string, dadosAtualizados: any): Promise<boolean> => {
    try {
      const prazoRef = doc(db, 'prazos', id);
      await updateDoc(prazoRef, {
        ...dadosAtualizados,
        updatedAt: serverTimestamp()
      });
      
      // Atualizar estado local
      setPrazos(prev => 
        prev.map(prazo => 
          prazo.id === id ? { ...prazo, ...dadosAtualizados } : prazo
        )
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar prazo:', error);
      return false;
    }
  };

  // Remover prazo
  const deletePrazo = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'prazos', id));
      
      // Atualizar estado local
      setPrazos(prev => prev.filter(prazo => prazo.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao remover prazo:', error);
      return false;
    }
  };

  // ✅ CORRIGIDO - Recarregar quando advogadoId mudar
  useEffect(() => {
    if (advogadoId) {
      fetchPrazos();
    }//eslint-disable-next-line
  }, [advogadoId]); // ✅ DEPENDÊNCIA CORRIGIDA

  return {
    prazos,
    loading,
    addPrazo,
    updatePrazo,
    deletePrazo,
    fetchPrazos
  };
}