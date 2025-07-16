'use client';
import { useState } from 'react';
import { login, register } from '@/firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [modo, setModo] = useState<'login' | 'register'>('login');
  const [mensagem, setMensagem] = useState('');

  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (modo === 'login') {
        await login(email, senha);
        setMensagem('Login realizado com sucesso!');
        router.push('/dashboard');
      } else {
        await register(email, senha);
        setMensagem('Cadastro realizado com sucesso!');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setMensagem(`Erro: ${(err as Error).message}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="p-8 rounded-lg shadow-2xl w-full max-w-md border border-opacity-20" 
           style={{ backgroundColor: '#1a1a1a', borderColor: '#6e6d6b' }}>
        
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#b0825a' }}>
            IAJURIS
          </h1>
          <p className="text-sm opacity-80" style={{ color: '#ffffff' }}>
            Inteligência Artificial Jurídica
          </p>
        </div>

        {/* Subtítulo do modo */}
        <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: '#ffffff' }}>
          {modo === 'login' ? 'Acessar Plataforma' : 'Criar Conta'}
        </h2>

        {/* Formulário */}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full p-3 rounded-lg border border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
            style={{ 
              backgroundColor: '#2a2a2a', 
              borderColor: '#6e6d6b',
              '--tw-ring-color': '#b0825a'
            } as React.CSSProperties}
          />
          
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full p-3 rounded-lg border border-opacity-30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
            style={{ 
              backgroundColor: '#2a2a2a', 
              borderColor: '#6e6d6b',
              '--tw-ring-color': '#b0825a'
            } as React.CSSProperties}
          />

          <button
            onClick={handleAuth}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: '#b0825a' }}
          >
            {modo === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </div>

        {/* Alternador de modo */}
        <div className="text-center mt-6">
          <button
            className="text-sm underline transition-colors duration-300 hover:opacity-80"
            style={{ color: '#b0825a' }}
            onClick={() => setModo(modo === 'login' ? 'register' : 'login')}
          >
            {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className="mt-4 p-3 rounded-lg text-sm text-center" 
               style={{ 
                 backgroundColor: mensagem.includes('sucesso') ? '#2d5a2d' : '#5a2d2d',
                 color: '#ffffff'
               }}>
            {mensagem}
          </div>
        )}

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