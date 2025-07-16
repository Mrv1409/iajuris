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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firestore'; // Ajuste o caminho conforme sua estrutura

export function usePrazos(escritorioId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prazos, setPrazos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar prazos do Firebase
  const fetchPrazos = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'prazos'),
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

  // Adicionar novo prazo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addPrazo = async (novoPrazo: any): Promise<boolean> => {
    try {
      const docRef = await addDoc(collection(db, 'prazos'), {
        ...novoPrazo,
        escritorioId: escritorioId || 'default',
        createdAt: serverTimestamp()
      });                                               
      
      // Atualizar estado local
      const prazoComId = {
        id: docRef.id,
        ...novoPrazo,
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

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchPrazos();
  }, []);

  return {
    prazos,
    loading,
    addPrazo,
    updatePrazo,
    deletePrazo,
    fetchPrazos
  };
}