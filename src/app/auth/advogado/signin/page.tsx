// src/app/auth/advogado/signin/page.tsx
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Scale, Lock, Mail, AlertCircle, Gavel, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdvogadoSignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('advogado-credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.ok) {
        // Verificar se a sessão foi criada corretamente
        const session = await getSession();
        if (session?.user?.role === 'advogado') {
          router.push('/dashboard/leads/advogado');
        } else {
          setError('Erro ao criar sessão. Tente novamente.');
        }
      }
    } catch (error) {
      setError('Verifique sua senha. Tente novamente mais tarde.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    // Background Principal com gradiente
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#2a2a2a]">
      {/* Elementos decorativos - Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      {/* Header - Aplicando Header Pattern */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Botão Voltar */}
            <Link 
              href="/"
              className="flex items-center px-4 py-2 bg-[#2a2a2a] border border-[#6e6d6b] rounded-lg transition-all duration-300 transform hover:scale-105 hover:opacity-90 group order-1 sm:order-none"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-[#d4d4d4] group-hover:text-white transition-colors" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
              <span className="text-[#d4d4d4] group-hover:text-white text-sm font-medium">Início</span>
            </Link>

            {/* Logo Centralizada - Usando cores do DS */}
            <div className="flex items-center justify-center order-4 sm:order-none">
              <Scale className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#b0825a] text-shadow-lg">
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
            </div>

            {/* Nome do Escritório - Ajustando cores do DS */}
            <div className="text-center sm:text-right order-3 sm:order-none">
              <div className="text-sm text-white font-medium">Escritório Jurídico</div>
              <div className="text-xs text-[#d4d4d4] opacity-80 font-light">Advocacia & Consultoria</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <div className="max-w-md w-full">
          {/* Header do Login */}
          <div className="text-center mb-8">
            {/* Título de Boas-vindas Sofisticado */}
            <div className="mb-6 pt-4">
              <h1 className="text-xl sm:text-2xl text-[#b0825a] mb-2" 
                  style={{ 
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontWeight: '300',
                    letterSpacing: '0.05em'
                  }}>
                Bem-vindo(a)
              </h1>
              <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent opacity-60" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Acesso Profissional
            </h2>
            <p className="text-[#d4d4d4] text-base sm:text-lg">
              Entre no seu painel de gestão jurídica
            </p>
            {/* Separador - Linha dourada sutil */}
            <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
          </div>

          {/* Login Form - Aplicando Container Principal */}
          <div 
            className="rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)', 
              border: '1px solid rgba(176, 130, 90, 0.2)', 
              backdropFilter: 'blur(8px)', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email - Aplicando Input Pattern */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#d4d4d4] mb-2">
                  Email Profissional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b0825a]" style={{ opacity: 0.7 }} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                    placeholder="seu@email.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password - Aplicando Input Pattern */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#d4d4d4] mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b0825a]" style={{ opacity: 0.7 }} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#b0825a] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message - Aplicando Container de Erro */}
              {error && (
                <div 
                  className="rounded-xl p-4 flex items-start space-x-3 border transition-all duration-300"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button - Aplicando Botão Principal */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center"
                style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="font-medium">Entrando...</span>
                  </div>
                ) : (
                  <span className="font-medium">Acessar Painel</span>
                )}
              </button>
            </form>

            {/* Footer do Form */}
            <div className="mt-6 pt-6 border-t border-[#6e6d6b] border-opacity-20 text-center">
              <p className="text-xs text-[#9ca3af]">
                Problemas para acessar? Entre em contato iajurissuporte@outlook.com
              </p>
            </div>
          </div>

          {/* Bottom Info - Aplicando Container Secundário */}
          <div className="text-center mt-6">
            <div 
              className="inline-block rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.6)', 
                border: '1px solid rgba(176, 130, 90, 0.1)', 
                backdropFilter: 'blur(8px)' 
              }}
            >
              <p className="text-xs sm:text-sm text-[#9ca3af]">
                © 2025 <span className="text-[#b0825a] font-semibold">IAJURIS</span> - Inteligência Artificial Jurídica
              </p>
              <p className="text-xs text-[#6e6d6b] mt-1">
                Escritório Jurídico • Advocacia & Consultoria
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS para animações customizadas */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}