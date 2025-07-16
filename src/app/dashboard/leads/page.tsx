'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllLeads, Lead } from '@/lib/firestoreLeads';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      console.log('Buscando leads...');
      const leadsData = await getAllLeads();
      console.log('Leads encontrados:', leadsData.length);
      console.log('Dados dos leads:', leadsData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.telefone.includes(searchTerm) ||
                          lead.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || lead.statusAtendimento === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });//eslint-disable-next-line
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: Lead['statusAtendimento']) => {
    const statusConfig = {
      novo: { 
        color: '#22c55e', 
        bg: 'linear-gradient(135deg, #22c55e20 0%, #22c55e30 100%)', 
        text: 'Novo',
        icon: '✨'
      },
      contatado: { 
        color: '#b0825a', 
        bg: 'linear-gradient(135deg, #b0825a20 0%, #b0825a30 100%)', 
        text: 'Contatado',
        icon: '📞'
      },
      agendado: { 
        color: '#3b82f6', 
        bg: 'linear-gradient(135deg, #3b82f620 0%, #3b82f630 100%)', 
        text: 'Agendado',
        icon: '📅'
      },
      finalizado: { 
        color: '#6e6d6b', 
        bg: 'linear-gradient(135deg, #6e6d6b20 0%, #6e6d6b30 100%)', 
        text: 'Finalizado',
        icon: '✅'
      },
      cancelado: { 
        color: '#ef4444', 
        bg: 'linear-gradient(135deg, #ef444420 0%, #ef444430 100%)', 
        text: 'Cancelado',
        icon: '❌'
      }
    };
    
    const config = statusConfig[status] || statusConfig.novo;
    
    return (
      <div 
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-sm"
        style={{ 
          color: config.color, 
          background: config.bg,
          borderColor: config.color + '40'
        }}
      >
        <span className="text-sm">{config.icon}</span>
        {config.text}
      </div>
    );
  };

  const getAgendamentoStatus = (lead: Lead) => {
    if (lead.tipoSolicitacaoCliente === 'agendamento') {
      return lead.preferenciaAgendamentoCliente 
        ? `Agendou: Sim (${lead.preferenciaAgendamentoCliente})`
        : 'Agendou: Sim (Preferência pendente)';
    } else if (lead.tipoSolicitacaoCliente === 'contato_advogado') {
      return 'Solicitou Contato Advogado';
    }
    return 'Agendou: Não';
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatusStats = () => {
    return {
      total: leads.length,
      novo: leads.filter(l => l.statusAtendimento === 'novo').length,
      contatado: leads.filter(l => l.statusAtendimento === 'contatado').length,
      agendado: leads.filter(l => l.statusAtendimento === 'agendado').length,
      finalizado: leads.filter(l => l.statusAtendimento === 'finalizado').length,
      cancelado: leads.filter(l => l.statusAtendimento === 'cancelado').length
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        {/* Background gradiente IAJURIS */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-amber-900" />
        
        {/* Elementos decorativos */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Container de loading */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center p-8 rounded-2xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-amber-800/30 rounded-full animate-spin border-t-amber-600 mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-amber-600/20 rounded-full animate-pulse mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Carregando leads...</h2>
            <p className="text-gray-400">Aguarde um momento</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background gradiente IAJURIS */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-amber-900" />
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Container principal */}
      <div className="relative z-10">
        {/* Header Premium */}
        <div className="p-8 rounded-2xl backdrop-blur-sm border border-amber-800/20 mx-8 mt-8" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Logo com ícone da balança */}
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)' }}>
                  <div className="flex items-center justify-center w-8 h-8 text-black font-bold text-2xl">
                    ⚖️
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white text-shadow-lg">
                    Leads Recebidos
                  </h1>
                  <p className="text-gray-400 mt-2 opacity-80 font-light">
                    Gerencie todos os atendimentos realizados pela IA
                  </p>
                </div>
              </div>
            </div>
            
            {/* Separador dourado */}
            <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-amber-600 to-transparent opacity-50"></div>
            
            {/* Botão voltar */}
            <Link 
              href="/dashboard"
              className="group flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)'
              }}
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              <span className="text-black">Voltar ao Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Container de conteúdo */}
        <div className="p-8">
          {/* Filtros Premium */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border border-amber-800/20 mb-8 shadow-xl" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Campo de busca */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-600 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-gray-400 border border-gray-600 transition-all duration-300 focus:ring-2 focus:ring-amber-600 focus:border-transparent transform focus:scale-105"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)' }}
                  />
                </div>
              </div>
              
              {/* Filtro de status */}
              <div className="lg:w-64">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-600 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"/>
                  </svg>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white border border-gray-600 transition-all duration-300 focus:ring-2 focus:ring-amber-600 focus:border-transparent transform focus:scale-105 appearance-none"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)' }}
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="novo">✨ Novo</option>
                    <option value="contatado">📞 Contatado</option>
                    <option value="agendado">📅 Agendado</option>
                    <option value="finalizado">✅ Finalizado</option>
                    <option value="cancelado">❌ Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas Premium */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="p-6 rounded-2xl backdrop-blur-sm border border-amber-800/20 text-center transition-all duration-300 transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <div className="text-4xl font-bold text-amber-600 mb-2">
                {stats.total}
              </div>
              <div className="text-gray-400 text-sm font-medium">Total</div>
            </div>
            <div className="p-6 rounded-2xl backdrop-blur-sm border border-green-800/20 text-center transition-all duration-300 transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stats.novo}
              </div>
              <div className="text-gray-400 text-sm font-medium">Novos</div>
            </div>
            <div className="p-6 rounded-2xl backdrop-blur-sm border border-amber-800/20 text-center transition-all duration-300 transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <div className="text-4xl font-bold text-amber-600 mb-2">
                {stats.contatado}
              </div>
              <div className="text-gray-400 text-sm font-medium">Contatados</div>
            </div>
            <div className="p-6 rounded-2xl backdrop-blur-sm border border-blue-800/20 text-center transition-all duration-300 transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {stats.agendado}
              </div>
              <div className="text-gray-400 text-sm font-medium">Agendados</div>
            </div>
            <div className="p-6 rounded-2xl backdrop-blur-sm border border-gray-600/20 text-center transition-all duration-300 transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <div className="text-4xl font-bold text-gray-400 mb-2">
                {stats.finalizado}
              </div>
              <div className="text-gray-400 text-sm font-medium">Finalizados</div>
            </div>
            <div className="p-6 rounded-2xl backdrop-blur-sm border border-red-800/20 text-center transition-all duration-300 transform hover:scale-105 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <div className="text-4xl font-bold text-red-400 mb-2">
                {stats.cancelado}
              </div>
              <div className="text-gray-400 text-sm font-medium">Cancelados</div>
            </div>
          </div>

          {/* Debug Info - Remover após funcionar */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 rounded-xl backdrop-blur-sm border border-amber-800/20 text-sm" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
              <p className="text-amber-600">Debug: Total de leads: {leads.length}</p>
              <p className="text-amber-600">Debug: Leads filtrados: {filteredLeads.length}</p>
              <p className="text-amber-600">Debug: Status filter: {statusFilter}</p>
              <p className="text-amber-600">Debug: Search term: {searchTerm}</p>
            </div>
          )}

          {/* Lista de Leads */}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-amber-800/20 shadow-lg" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
                <svg className="w-16 h-16 text-amber-600 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                {leads.length === 0 ? 'Nenhum lead encontrado' : 'Nenhum lead corresponde aos filtros'}
              </h3>
              <p className="text-gray-400 text-lg">
                {leads.length === 0 
                  ? 'Aguarde os primeiros atendimentos da IA'
                  : searchTerm || statusFilter !== 'todos' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Todos os leads estão ocultos pelos filtros'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="group block"
                >
                  <div className="p-6 rounded-2xl backdrop-blur-sm border border-amber-800/20 transition-all duration-300 transform hover:scale-102 hover:border-amber-600/50 shadow-lg hover:shadow-xl group-hover:shadow-amber-600/10" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
                    
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-600 transition-colors duration-300 mb-2">
                          {lead.nome}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className="text-sm">{formatDate(lead.dataRegistro)}</span>
                        </div>
                      </div>
                      {getStatusBadge(lead.statusAtendimento)}
                    </div>

                    {/* Informações principais */}
                    <div className="space-y-4 mb-6">
                      {/* Telefone */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #b0825a20 0%, #b0825a30 100%)' }}>
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                          </svg>
                        </div>
                        <span className="text-white font-medium">{lead.telefone}</span>
                      </div>

                      {/* Categoria */}
                      {lead.categoria && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f620 0%, #3b82f630 100%)' }}>
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                          </div>
                          <span className="text-gray-300 capitalize">{lead.categoria}</span>
                        </div>
                      )}

                      {/* Motivo */}
                      <div className="rounded-lg p-4 border border-gray-600/30" style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)' }}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #22c55e20 0%, #22c55e30 100%)' }}>
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {truncateText(lead.motivo, 120)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações adicionais */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Situação:</span>
                        <span className="text-gray-300 font-medium">{getAgendamentoStatus(lead)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Mensagens:</span>
                        <span className="text-gray-300 font-medium">{lead.historico?.length || 0} mensagens</span>
                      </div>
                    </div>

                    {/* Separador dourado */}
                    <div className="h-0.5 w-24 mx-auto mb-4 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-gray-400 text-sm group-hover:text-amber-600 transition-colors duration-300 font-medium">
                        Ver detalhes completos
                      </span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" style={{ background: 'linear-gradient(135deg, #b0825a20 0%, #b0825a30 100%)' }}>
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}