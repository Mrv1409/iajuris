'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Trash2, Edit3, ExternalLink, Plus, User, MapPin, Phone, BookOpen, Clock, Save, X, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';

// Tipos
type AdvogadoData = {
  id: string;
  nome: string;
  email: string;
  password?: string; // Opcional para exibição
  especialidades: string[];
  experiencia: string;
  cidade: string;
  contato: string;
  biografia: string;
  slug: string;
  dataCriacao: string;
  status: 'active' | 'inactive';
  role: 'advogado';
};

export default function DashboardAdvogado() {
  const [advogados, setAdvogados] = useState<AdvogadoData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    especialidades: '',
    experiencia: '',
    cidade: '',
    contato: '',
    biografia: ''
  });

  // Carregar advogados do Firebase
  const carregarAdvogados = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'advogados'), orderBy('dataCriacao', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const advogadosCarregados: AdvogadoData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        advogadosCarregados.push({
          id: doc.id,
          ...data,
          // Não incluir senha nos dados carregados por segurança
          password: undefined
        } as AdvogadoData);
      });
      
      setAdvogados(advogadosCarregados);
    } catch (error) {
      console.error('Erro ao carregar advogados:', error);
      alert('Erro ao carregar advogados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar advogados ao montar o componente
  useEffect(() => {
    carregarAdvogados();
  }, []);

  // Gerar slug automático
  const gerarSlug = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  };

  // Gerar senha aleatória
  const gerarSenhaAleatoria = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let senha = '';
    for (let i = 0; i < 12; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
  };

  // Validar email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar formulário
  const validarFormulario = (): string | null => {
    if (!formData.nome.trim()) return 'Nome é obrigatório';
    if (!formData.email.trim()) return 'Email é obrigatório';
    if (!validarEmail(formData.email)) return 'Email inválido';
    if (!editingId && !formData.password.trim()) return 'Senha é obrigatória';
    if (formData.password && formData.password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    if (!formData.especialidades.trim()) return 'Especialidades são obrigatórias';
    if (!formData.experiencia.trim()) return 'Experiência é obrigatória';
    if (!formData.cidade.trim()) return 'Cidade é obrigatória';
    if (!formData.contato.trim()) return 'Contato é obrigatório';
    if (!formData.biografia.trim()) return 'Biografia é obrigatória';
    
    const slug = gerarSlug(formData.nome);
    const existeSlug = advogados.find(adv => adv.slug === slug && adv.id !== editingId);
    if (existeSlug) return 'Já existe um advogado com nome similar. Tente um nome diferente.';

    // Verificar email duplicado
    const existeEmail = advogados.find(adv => adv.email === formData.email && adv.id !== editingId);
    if (existeEmail) return 'Este email já está cadastrado.';
    
    return null;
  };

  // Salvar advogado no Firebase
  const salvarAdvogado = async () => {
    const erro = validarFormulario();
    if (erro) {
      alert(erro);
      return;
    }

    try {
      setSaving(true);
      
      const especialidadesArray = formData.especialidades
        .split(',')
        .map(esp => esp.trim())
        .filter(esp => esp.length > 0);
      //eslint-disable-next-line
      const dadosAdvogado : any = {
        nome: formData.nome,
        email: formData.email.toLowerCase(),
        especialidades: especialidadesArray,
        experiencia: formData.experiencia,
        cidade: formData.cidade,
        contato: formData.contato,
        biografia: formData.biografia,
        slug: gerarSlug(formData.nome),
        status: 'active',
        role: 'advogado'
      };

      // Hash da senha se fornecida
      if (formData.password.trim()) {
        const saltRounds = 12;
        dadosAdvogado.password = await bcrypt.hash(formData.password, saltRounds);
      }

      if (editingId) {
        // Editando advogado existente
        const docRef = doc(db, 'advogados', editingId);
        await updateDoc(docRef, dadosAdvogado);
        
        // Atualizar estado local
        setAdvogados(prev => prev.map(adv => 
          adv.id === editingId 
            ? { ...adv, ...dadosAdvogado, password: undefined }
            : adv
        ));
        
        alert('Advogado atualizado com sucesso!');
      } else {
        // Criando novo advogado
        const novoAdvogado = {
          ...dadosAdvogado,
          dataCriacao: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'advogados'), novoAdvogado);
        
        // Adicionar ao estado local
        setAdvogados(prev => [{
          id: docRef.id,
          ...novoAdvogado,
          password: undefined // Não incluir senha no estado
        }, ...prev]);
        
        // Mostrar credenciais geradas
        alert(`Advogado cadastrado com sucesso!\n\nCredenciais de acesso:\nEmail: ${formData.email}\nSenha: ${formData.password}\n\nENVIE ESSAS CREDENCIAIS PARA O ADVOGADO!`);
      }

      // Reset form
      setFormData({
        nome: '',
        email: '',
        password: '',
        especialidades: '',
        experiencia: '',
        cidade: '',
        contato: '',
        biografia: ''
      });
      setShowForm(false);
      setEditingId(null);
      
    } catch (error) {
      console.error('Erro ao salvar advogado:', error);
      alert('Erro ao salvar advogado. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Editar advogado
  const editarAdvogado = (advogado: AdvogadoData) => {
    setFormData({
      nome: advogado.nome,
      email: advogado.email,
      password: '', // Não preencher senha na edição
      especialidades: advogado.especialidades.join(', '),
      experiencia: advogado.experiencia,
      cidade: advogado.cidade,
      contato: advogado.contato,
      biografia: advogado.biografia
    });
    setEditingId(advogado.id);
    setShowForm(true);
  };

  // Excluir advogado do Firebase
  const excluirAdvogado = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este advogado? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'advogados', id));
      
      // Remover do estado local
      setAdvogados(prev => prev.filter(adv => adv.id !== id));
      
      alert('Advogado excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir advogado:', error);
      alert('Erro ao excluir advogado. Tente novamente.');
    }
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setFormData({
      nome: '',
      email: '',
      password: '',
      especialidades: '',
      experiencia: '',
      cidade: '',
      contato: '',
      biografia: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  // Gerar senha automática
  const gerarSenhaAutomatica = () => {
    const senhaGerada = gerarSenhaAleatoria();
    setFormData({...formData, password: senhaGerada});
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#3a2a1a]" />
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-[#b86924] rounded-full flex items-center justify-center">
              <User className="text-2xl text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#d4d4d4]">
              Dashboard de Advogados
            </h1>
          </div>
          <p className="text-xl text-[#d4d4d4]">
            Gerencie os advogados do sistema IAJuris SaaS
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#b86924] to-transparent mx-auto mt-6"></div>
        </div>

        {/* Botão Adicionar */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
          >
            <Plus size={20} />
            Cadastrar Novo Advogado
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="mb-12">
            <div 
              className="rounded-2xl p-8 transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)', 
                backdropFilter: 'blur(8px)' 
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'Editar Advogado' : 'Cadastrar Novo Advogado'}
                </h2>
                <button
                  onClick={cancelarEdicao}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Dr. João Silva"
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                  />
                  {formData.nome && (
                    <p className="text-xs text-[#d4d4d4] mt-1">
                      URL: <span className="text-[#b86924]">/{gerarSlug(formData.nome)}</span>
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    <Mail size={16} className="inline mr-1" />
                    Email de Acesso *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="joao.silva@email.com"
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    <Lock size={16} className="inline mr-1" />
                    Senha {editingId ? '(deixe vazio para manter atual)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingId ? "Nova senha (opcional)" : "Senha de acesso"}
                      disabled={saving}
                      className="w-full p-3 pr-20 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-[#9ca3af] hover:text-white transition-colors"
                        disabled={saving}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {!editingId && (
                    <button
                      type="button"
                      onClick={gerarSenhaAutomatica}
                      className="text-xs text-[#b86924] hover:text-white transition-colors mt-1"
                      disabled={saving}
                    >
                      🎲 Gerar senha automática
                    </button>
                  )}
                </div>

                {/* Especialidades */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    Especialidades * (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formData.especialidades}
                    onChange={(e) => setFormData({...formData, especialidades: e.target.value})}
                    placeholder="Direito Civil, Direito de Família"
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                  />
                </div>

                {/* Experiência */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    Anos de Experiência *
                  </label>
                  <input
                    type="text"
                    value={formData.experiencia}
                    onChange={(e) => setFormData({...formData, experiencia: e.target.value})}
                    placeholder="15 anos"
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    Cidade/Estado *
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="São Paulo, SP"
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                  />
                </div>

                {/* Contato */}
                <div>
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({...formData, contato: e.target.value})}
                    placeholder="(11) 99999-1234"
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] disabled:opacity-50"
                  />
                </div>

                {/* Biografia */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#b86924] mb-2">
                    Biografia *
                  </label>
                  <textarea
                    value={formData.biografia}
                    onChange={(e) => setFormData({...formData, biografia: e.target.value})}
                    placeholder="Especialista em resolver questões familiares e civis com agilidade e eficiência."
                    rows={3}
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b86924] resize-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={salvarAdvogado}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {editingId ? 'Salvando...' : 'Cadastrando...'}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingId ? 'Salvar Alterações' : 'Cadastrar Advogado'}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelarEdicao}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold transition-all duration-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Advogados */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Advogados Cadastrados {loading ? '' : `(${advogados.length})`}
          </h2>

          {loading ? (
            <div 
              className="text-center py-12 rounded-2xl"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)' 
              }}
            >
              <Loader2 className="mx-auto text-[#b0825a] mb-4 animate-spin" size={48} />
              <p className="text-[#d4d4d4] text-lg">
                Carregando advogados...
              </p>
            </div>
          ) : advogados.length === 0 ? (
            <div 
              className="text-center py-12 rounded-2xl"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)' 
              }}
            >
              <User className="mx-auto text-[#b0825a] mb-4" size={48} />
              <p className="text-[#d4d4d4] text-lg">
                Nenhum advogado cadastrado ainda.
              </p>
              <p className="text-[#9ca3af] mt-2">
                Clique em &quot;Cadastrar Novo Advogado&quot; para começar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advogados.map((advogado) => (
                <div
                  key={advogado.id}
                  className="rounded-2xl p-6 transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                    border: '1px solid rgba(176, 130, 90, 0.2)', 
                    backdropFilter: 'blur(8px)' 
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#b86924] rounded-full flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarAdvogado(advogado)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => excluirAdvogado(advogado.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {advogado.nome}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#d4d4d4]">
                      <Mail size={16} className="text-[#b86924]" />
                      {advogado.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#d4d4d4]">
                      <BookOpen size={16} className="text-[#b86924]" />
                      {advogado.especialidades.join(', ')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#d4d4d4]">
                      <Clock size={16} className="text-[#b86924]" />
                      {advogado.experiencia} de experiência
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#d4d4d4]">
                      <MapPin size={16} className="text-[#b86924]" />
                      {advogado.cidade}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#d4d4d4]">
                      <Phone size={16} className="text-[#b86924]" />
                      {advogado.contato}
                    </div>
                  </div>

                  <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
                    {advogado.biografia}
                  </p>

                  <div className="pt-4 border-t border-[#6e6d6b] border-opacity-20">
                    <div className="flex items-center justify-between">
                      <a
                        href={`/${advogado.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#b86924] hover:text-white transition-colors"
                      >
                        <ExternalLink size={16} />
                        Ver página pública
                      </a>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        advogado.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {advogado.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-1">
                      /{advogado.slug}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}