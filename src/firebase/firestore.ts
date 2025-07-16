// src/firebase/firestore.ts
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { firebaseApp } from './firebaseConfig';

export const db = getFirestore(firebaseApp);

// Adicionar novo processo jurídico
export const addProcess = async (data: {
  titulo: string;
  categoria: string;
  clienteEmail: string;
  status?: string;
}) => {
  await addDoc(collection(db, 'processos'), {
    ...data,
    status: data.status || 'em análise',
    criadoEm: new Date(),
  });
};

// Buscar todos os processos
export const getAllProcesses = async () => {
  const snapshot = await getDocs(collection(db, 'processos'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
