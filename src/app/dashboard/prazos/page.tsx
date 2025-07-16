'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scale, Gavel, ArrowLeft, Plus, Download, Edit, Trash2, Save, Calendar, Phone, User, FileText, AlertCircle } from 'lucide-react';
import { usePrazos } from '@/hooks/usePrazos'; // Ajuste o caminho conforme sua estrutura

// Definindo o tipo para os dados do prazo
interface PrazoData {
  nomeCliente: string;
  dataProcesso: string;
  telefone: string;
  assunto: string;
  situacao: string;
  prazoVencimento: string;
  prioridade: string;
}

export default function PrazosProcessuaisPage() {
  // Substitua 'seu-escritorio-id' pelo ID real do escritório logado
  const { prazos, loading, addPrazo, updatePrazo, deletePrazo } = usePrazos('seu-escritorio-id');

  const [anotacoes, setAnotacoes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<PrazoData>({
    nomeCliente: '',
    dataProcesso: '',
    telefone: '',
    assunto: '',
    situacao: 'Em andamento',
    prazoVencimento: '',
    prioridade: 'media'
  });
  const [newPrazo, setNewPrazo] = useState<PrazoData>({
    nomeCliente: '',
    dataProcesso: '',
    telefone: '',
    assunto: '',
    situacao: 'Em andamento',
    prazoVencimento: '',
    prioridade: 'media'
  });

  // Função para adicionar prazo (agora com Firebase)
  const handleAddPrazo = async () => {
    if (newPrazo.nomeCliente && newPrazo.dataProcesso && newPrazo.assunto) {
      const success = await addPrazo(newPrazo);
      
      if (success) {
        setNewPrazo({
          nomeCliente: '',
          dataProcesso: '',
          telefone: '',
          assunto: '',
          situacao: 'Em andamento',
          prazoVencimento: '',
          prioridade: 'media'
        });
        setShowAddForm(false);
        alert('Prazo adicionado com sucesso!');
      } else {
        alert('Erro ao adicionar prazo. Tente novamente.');
      }
    }
  };

  // Função para remover prazo (agora com Firebase)
  const handleRemovePrazo = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este prazo?')) {
      const success = await deletePrazo(id);
      
      if (success) {
        alert('Prazo removido com sucesso!');
      } else {
        alert('Erro ao remover prazo. Tente novamente.');
      }
    }
  };

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditPrazo = (prazo: any) => {
    setEditingId(prazo.id);
    setEditingData({
      nomeCliente: prazo.nomeCliente || '',
      dataProcesso: prazo.dataProcesso || '',
      telefone: prazo.telefone || '',
      assunto: prazo.assunto || '',
      situacao: prazo.situacao || 'Em andamento',
      prazoVencimento: prazo.prazoVencimento || '',
      prioridade: prazo.prioridade || 'media'
    });
  };

  // Função para salvar edição (agora com Firebase)
  const handleSaveEdit = async () => {
    if (editingId) {
      const success = await updatePrazo(editingId, editingData);
      
      if (success) {
        setEditingId(null);
        setEditingData({
          nomeCliente: '',
          dataProcesso: '',
          telefone: '',
          assunto: '',
          situacao: 'Em andamento',
          prazoVencimento: '',
          prioridade: 'media'
        });
        alert('Prazo atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar prazo. Tente novamente.');
      }
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({
      nomeCliente: '',
      dataProcesso: '',
      telefone: '',
      assunto: '',
      situacao: 'Em andamento',
      prazoVencimento: '',
      prioridade: 'media'
    });
  };

  const handleGeneratePDF = () => {
    alert('Funcionalidade de gerar PDF será implementada em breve!');
  };

  const handleSaveAnotacoes = () => {
    alert('Anotações salvas com sucesso!');
  };

  // Loading state - Aplicando cores do DS
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b0825a] mx-auto mb-4"></div>
          <p className="text-[#d4d4d4]">Carregando prazos...</p>
        </div>
      </div>
    );
  }

  return (
    // Background Principal com gradiente
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#2a2a2a]">
      {/* Elementos decorativos - Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" /> {/* Adicionado um delay para variação */}

      {/* Header - Aplicando Header Pattern */}
      {/* Container Principal para o Header para aplicar backdrop-filter e bordas */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}> {/* Cor do container principal */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Botão Voltar */}
            <Link 
              href="/dashboard"
              className="flex items-center px-4 py-2 bg-[#2a2a2a] border border-[#6e6d6b] rounded-lg transition-all duration-300 transform hover:scale-105 hover:opacity-90 group" // Ajustes de bg e hover
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-[#d4d4d4] group-hover:text-white transition-colors" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Estilo de ícone */}
              <span className="text-[#d4d4d4] group-hover:text-white text-sm font-medium">Dashboard</span>
            </Link>

            {/* Logo Centralizada - Usando cores do DS */}
            <div className="flex items-center justify-center">
              <Scale className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone dourado */}
              <h1 className="text-2xl sm:text-3xl font-bold text-[#b0825a] text-shadow-lg"> {/* Título dourado com text-shadow (Tailwind não tem nativo, mas podemos simular com um plugin ou adicionar via CSS) */}
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone dourado */}
            </div>

            {/* Nome do Escritório - Ajustando cores do DS */}
            <div className="text-right">
              <div className="text-sm text-white font-medium">Escritório Jurídico</div>
              <div className="text-xs text-[#d4d4d4] opacity-80 font-light">Advocacia & Consultoria</div> {/* Subtítulo */}
            </div>
          </div>
        </div>
      </div>

      {/* Título da Página - Ajustando cores do DS */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 border-b border-[#6e6d6b] border-opacity-20"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}> {/* Container do título */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <Calendar className="w-8 h-8 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone dourado */}
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Prazos Processuais</h2>
          </div>
          {/* Separador - Linha dourada sutil */}
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
        </div>
      </div>

      {/* Botões de Ação - Aplicando Botões Principais */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 border-b border-[#6e6d6b] border-opacity-20"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}> {/* Container dos botões de ação */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              // Gradiente Dourado para botões principais
              className="flex items-center px-6 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl" // Ajustes de padding, border-radius, font-weight, hover/active e shadow
              style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
            >
              <Plus className="w-5 h-5 mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
              <span className="font-medium">Adicionar Prazo</span>
            </button>

            <button
              onClick={handleGeneratePDF}
              // Gradiente Dourado para botões principais
              className="flex items-center px-6 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl" // Ajustes de padding, border-radius, font-weight, hover/active e shadow
              style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
            >
              <Download className="w-5 h-5 mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
              <span className="font-medium">Gerar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário Adicionar Prazo - Aplicando Container Principal e Inputs */}
        {showAddForm && (
          <div 
            className="mb-8 rounded-2xl p-6 shadow-2xl transition-all duration-300"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)', // Cor do container principal
              border: '1px solid rgba(176, 130, 90, 0.2)', // Borda dourada sutil
              backdropFilter: 'blur(8px)', // Backdrop-filter
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' // Box-shadow
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-[#b0825a]" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone dourado */}
              Adicionar Novo Prazo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Inputs - Aplicando Inputs Padrão */}
              {Object.keys(newPrazo).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#d4d4d4] mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()} {/* Formata o nome do campo para exibição */}
                  </label>
                  <input
                    type={key.includes('data') || key.includes('Vencimento') ? 'date' : (key === 'telefone' ? 'tel' : 'text')}
                    value={newPrazo[key as keyof PrazoData]}
                    onChange={(e) => setNewPrazo({...newPrazo, [key]: e.target.value})}
                    className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]" // Ajustes de padding, border-radius, bg, border, focus e hover
                    placeholder={`Digite ${key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`}
                  />
                </div>
              ))}
              {/* Selects precisam de tratamento separado se forem mais complexos, mas o input padrão já ajuda */}
              <div>
                <label className="block text-sm font-medium text-[#d4d4d4] mb-2">Situação</label>
                <select
                  value={newPrazo.situacao}
                  onChange={(e) => setNewPrazo({...newPrazo, situacao: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                >
                  <option value="">Selecione a situação</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#d4d4d4] mb-2">Prioridade</label>
                <select
                  value={newPrazo.prioridade}
                  onChange={(e) => setNewPrazo({...newPrazo, prioridade: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#d4d4d4] mb-2">Assunto</label>
                <input
                  type="text"
                  value={newPrazo.assunto}
                  onChange={(e) => setNewPrazo({...newPrazo, assunto: e.target.value})}
                  className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                  placeholder="Descreva o assunto do processo"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-[#6e6d6b] hover:bg-[#5a5955] rounded-xl transition-all duration-300 transform hover:scale-105 hover:opacity-90" // Botão secundário
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPrazo}
                // Gradiente Dourado para botões principais
                className="px-6 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl"
                style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
              >
                Adicionar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Prazos */}
        <div className="space-y-6">
          {prazos.length === 0 ? (
            <div 
              className="text-center py-12 rounded-2xl shadow-2xl transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)', 
                backdropFilter: 'blur(8px)', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
              }}
            >
              <Calendar className="w-16 h-16 text-[#b0825a] mx-auto mb-4" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
              <p className="text-[#d4d4d4] text-lg">Nenhum prazo cadastrado ainda</p>
              <p className="text-gray-400 text-sm">Clique em &quot;Adicionar Prazo&quot; para começar</p> {/* Mantido gray-400 para contraste leve, mas pode ser d4d4d4 */}
            </div>
          ) : (
            prazos.map((prazo) => (
              <div 
                key={prazo.id} 
                // Estilo do card de prazo
                className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl" // Efeito de hover no card
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)', // Cor do container principal
                  border: '1px solid rgba(176, 130, 90, 0.2)', // Borda dourada sutil
                  backdropFilter: 'blur(8px)', // Backdrop-filter
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' // Box-shadow
                }}
              >
                {editingId === prazo.id ? (
                  // Modo de edição
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Inputs de Edição - Aplicando Inputs Padrão */}
                      {Object.keys(editingData).map((key) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-[#d4d4d4] mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <input
                            type={key.includes('data') || key.includes('Vencimento') ? 'date' : (key === 'telefone' ? 'tel' : 'text')}
                            value={editingData[key as keyof PrazoData]}
                            onChange={(e) => setEditingData({...editingData, [key]: e.target.value})}
                            className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                            placeholder={`Digite ${key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`}
                          />
                        </div>
                      ))}
                      {/* Selects de Edição */}
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-2">Situação</label>
                        <select
                          value={editingData.situacao}
                          onChange={(e) => setEditingData({...editingData, situacao: e.target.value})}
                          className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                        >
                          <option value="Em andamento">Em andamento</option>
                          <option value="Pendente">Pendente</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Urgente">Urgente</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-2">Prioridade</label>
                        <select
                          value={editingData.prioridade}
                          onChange={(e) => setEditingData({...editingData, prioridade: e.target.value})}
                          className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-2">Assunto</label>
                        <input
                          type="text"
                          value={editingData.assunto}
                          onChange={(e) => setEditingData({...editingData, assunto: e.target.value})}
                          className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 border-t border-[#6e6d6b] border-opacity-20">
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 bg-[#6e6d6b] hover:bg-[#5a5955] rounded-xl transition-all duration-300 transform hover:scale-105 hover:opacity-90"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        // Gradiente Dourado para botões principais
                        className="flex items-center px-6 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl"
                        style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                      >
                        <Save className="w-4 h-4 mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo de visualização
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
                        <div>
                          <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Nome do Cliente</label>
                          <div className="text-white font-medium">{prazo.nomeCliente}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
                        <div>
                          <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Data do Processo</label>
                          <div className="text-white font-medium">{prazo.dataProcesso}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
                        <div>
                          <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Telefone</label>
                          <div className="text-white font-medium">{prazo.telefone}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
                        <div>
                          <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Assunto</label>
                          <div className="text-white font-medium">{prazo.assunto}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone temático */}
                        <div>
                          <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Situação</label>
                          <div className="text-white font-medium">{prazo.situacao}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 border-t border-[#6e6d6b] border-opacity-20">
                      <button
                        onClick={() => handleEditPrazo(prazo)}
                        // Botão de ação secundário
                        className="flex items-center px-4 py-2 bg-[#1a1a1a] border border-[#6e6d6b] rounded-xl hover:bg-[#2a2a2a] transition-all duration-300 transform hover:scale-105 hover:opacity-90 text-[#d4d4d4]"
                      >
                        <Edit className="w-4 h-4 mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
                        Editar
                      </button>
                      
                      <button
                        onClick={() => handleRemovePrazo(prazo.id)}
                        // Botão de ação secundário (exceção para o vermelho de erro)
                        className="flex items-center px-4 py-2 bg-[#1a1a1a] border border-[#ef4444] rounded-xl hover:bg-[#2a2a2a] transition-all duration-300 transform hover:scale-105 hover:opacity-90 text-[#ef4444]"
                      >
                        <Trash2 className="w-4 h-4 mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
                        Remover
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Anotações Gerais - Aplicando Container Principal e Inputs */}
        <div 
          className="mt-8 rounded-2xl p-6 shadow-2xl transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)', 
            border: '1px solid rgba(176, 130, 90, 0.2)', 
            backdropFilter: 'blur(8px)', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
          }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-[#b0825a]" style={{ opacity: 0.7, fontSize: '1.2rem' }} /> {/* Ícone dourado */}
            Notas e Observações
          </h3>
          
          <textarea
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            className="w-full h-32 p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02] resize-none" // Ajustes de padding, border-radius, bg, border, focus e hover
            placeholder="Digite suas anotações gerais sobre os prazos processuais..."
          />
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveAnotacoes}
              // Gradiente Dourado para botões principais
              className="flex items-center px-6 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl"
              style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
            >
              <Save className="w-4 h-4 mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
              Salvar Anotações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}