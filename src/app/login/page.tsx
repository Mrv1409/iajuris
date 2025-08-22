'use client';
import { useState } from 'react';
import { login, register } from '@/firebase/auth';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// EMAIL AUTORIZADO - APENAS ADMIN
const ADMIN_EMAIL = 'marvincosta321@gmail.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [modo, setModo] = useState<'login' | 'register'>('login');
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<'success' | 'error' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [erros, setErros] = useState<{email?: string; senha?: string}>({});

  const router = useRouter();

  // Validação de email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de senha
  const validarSenha = (senha: string): boolean => {
    return senha.length >= 6;
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: {email?: string; senha?: string} = {};

    // Validar email
    if (!email) {
      novosErros.email = 'Email é obrigatório';
    } else if (!validarEmail(email)) {
      novosErros.email = 'Email inválido';
    } else if (email !== ADMIN_EMAIL) {
      novosErros.email = 'Acesso restrito ao administrador';
    }

    // Validar senha
    if (!senha) {
      novosErros.senha = 'Senha é obrigatória';
    } else if (!validarSenha(senha)) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Traduzir erros do Firebase
  const traduzirErroFirebase = (errorCode: string): string => {
    const erros: Record<string, string> = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Email já está em uso',
      'auth/weak-password': 'Senha muito fraca',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    };
    return erros[errorCode] || 'Erro desconhecido. Tente novamente';
  };

  const handleAuth = async () => {
    // Limpar mensagens anteriores
    setMensagem('');
    setTipoMensagem('');

    // Validar formulário
    if (!validarFormulario()) {
      return;
    }

    // Validação adicional para registro
    if (modo === 'register' && email !== ADMIN_EMAIL) {
      setMensagem('❌ Acesso restrito ao administrador');
      setTipoMensagem('error');
      return;
    }

    setIsLoading(true);

    try {
      if (modo === 'login') {
        await login(email, senha);
        setMensagem('✅ Login realizado com sucesso!');
        setTipoMensagem('success');
        
        // Aguardar um pouco para mostrar o sucesso
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        await register(email, senha);
        setMensagem('✅ Conta criada com sucesso!');
        setTipoMensagem('success');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }//eslint-disable-next-line
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      const mensagemErro = traduzirErroFirebase(err.code);
      setMensagem(`❌ ${mensagemErro}`);
      setTipoMensagem('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar erros quando usuário digita
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (erros.email) {
      setErros(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSenha(e.target.value);
    if (erros.senha) {
      setErros(prev => ({ ...prev, senha: undefined }));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden" 
          style={{ backgroundColor: '#0a0a0a' }}>
      
      {/* Efeito de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-900/5"></div>
      
      <div className="relative p-8 rounded-xl shadow-2xl w-full max-w-md border border-opacity-20 backdrop-blur-sm" 
           style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#6e6d6b' }}>
        
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" 
                 style={{ backgroundColor: '#b0825a' }}>
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#b0825a' }}>
            IAJURIS
          </h1>
          <p className="text-sm opacity-80" style={{ color: '#ffffff' }}>
            Inteligência Artificial Jurídica
          </p>
          <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium inline-block" 
               style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)', color: '#b0825a' }}>
            Acesso Administrativo
          </div>
        </div>

        {/* Subtítulo do modo */}
        <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: '#ffffff' }}>
          {modo === 'login' ? 'Acessar Plataforma' : 'Criar Conta Admin'}
        </h2>

        {/* Formulário */}
        <div className="space-y-4">
          {/* Campo Email */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="E-mail do administrador"
              disabled={isLoading}
              className={`w-full pl-12 pr-4 py-3 rounded-lg border border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all disabled:opacity-50 ${
                erros.email ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              style={{ 
                backgroundColor: '#2a2a2a', 
                borderColor: erros.email ? '#ef4444' : '#6e6d6b',
                '--tw-ring-color': erros.email ? '#ef4444' : '#b0825a'
              } as React.CSSProperties}
            />
            {erros.email && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {erros.email}
              </div>
            )}
          </div>
          
          {/* Campo Senha */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={senha}
              onChange={handleSenhaChange}
              placeholder="Senha (mín. 6 caracteres)"
              disabled={isLoading}
              className={`w-full pl-12 pr-12 py-3 rounded-lg border border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all disabled:opacity-50 ${
                erros.senha ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              style={{ 
                backgroundColor: '#2a2a2a', 
                borderColor: erros.senha ? '#ef4444' : '#6e6d6b',
                '--tw-ring-color': erros.senha ? '#ef4444' : '#b0825a'
              } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {erros.senha && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {erros.senha}
              </div>
            )}
          </div>

          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ backgroundColor: '#b0825a' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {modo === 'login' ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : (
              modo === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </div>

        {/* Alternador de modo */}
        <div className="text-center mt-6">
          <button
            className="text-sm underline transition-colors duration-300 hover:opacity-80 disabled:opacity-50"
            style={{ color: '#b0825a' }}
            onClick={() => {
              setModo(modo === 'login' ? 'register' : 'login');
              setMensagem('');
              setTipoMensagem('');
              setErros({});
            }}
            disabled={isLoading}
          >
            {modo === 'login' ? 'Criar conta de administrador' : 'Já tenho conta'}
          </button>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-center ${
            tipoMensagem === 'success' ? 'text-green-300' : 'text-red-300'
          }`} 
               style={{ 
                 backgroundColor: tipoMensagem === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                 border: `1px solid ${tipoMensagem === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
               }}>
            {tipoMensagem === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            {mensagem}
          </div>
        )}

        {/* Informação de segurança */}
        <div className="mt-6 p-3 rounded-lg text-xs text-center border border-opacity-20" 
         style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)', borderColor: 'rgba(176, 130, 90, 0.2)' }}>
        <div className="flex items-center justify-center mb-1">
        <Lock className="w-4 h-4 mr-1" style={{ color: '#b0825a' }} />
        <span style={{ color: '#b0825a' }} className="font-medium">Área Restrita</span>
       </div>
         <p className="opacity-70" style={{ color: '#ffffff' }}>
          Acesso limitado ao administrador do sistema
        </p>
       </div>

        {/* Rodapé */}
        <div className="text-center mt-8 pt-6 border-t border-opacity-20" 
             style={{ borderColor: '#6e6d6b' }}>
          <p className="text-xs opacity-60" style={{ color: '#6e6d6b' }}>
            © 2025 IAJURIS - Todos os direitos reservados
          </p>
        </div>
      </div>
    </main>
  );
}