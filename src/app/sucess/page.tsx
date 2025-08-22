import Link from 'next/link'
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Ícone de Sucesso */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Compra Realizada com Sucesso!
        </h1>

        {/* Descrição */}
        <p className="text-gray-600 mb-6">
          Obrigado por escolher nossos serviços jurídicos. Seu pagamento foi processado com sucesso.
        </p>

        {/* Card de Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-3">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Próximos Passos</span>
          </div>
          <p className="text-sm text-blue-700">
            Você receberá suas credenciais de acesso por email em até <strong>30 minutos</strong>. 
            Verifique também sua caixa de spam.
          </p>
        </div>

        {/* Botão de Acesso */}
        <Link 
          href="/auth/advogado/signin"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center group"
        >
          Acessar Área Profissional
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>

        {/* Texto de Apoio */}
        <p className="text-xs text-gray-500 mt-4">
          Precisa de ajuda? Entre em contato conosco através do suporte.
        </p>
      </div>
    </div>
  )
}