'use client';
import { useState } from 'react';
import { addProcess } from '@/firebase/firestore';

export default function ProcessForm() {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async () => {
    if (!titulo || !categoria || !clienteEmail) {
      setMensagem('Preencha todos os campos');
      return;
    }

    await addProcess({ titulo, categoria, clienteEmail });
    setMensagem('Processo cadastrado com sucesso!');
    setTitulo('');
    setCategoria('');
    setClienteEmail('');
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-xl font-bold mb-3 text-gray-700">Novo Processo Jurídico</h3>
      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="text"
        placeholder="Categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="email"
        placeholder="E-mail do cliente"
        value={clienteEmail}
        onChange={(e) => setClienteEmail(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white py-2 px-4 rounded w-full"
      >
        Cadastrar Processo
      </button>
      {mensagem && <p className="mt-2 text-green-600 font-medium">{mensagem}</p>}
    </div>
  );
}
