import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'IAJURIS - Inteligência Artificial Jurídica',
  description:
    'Plataforma jurídica inteligente com IA - Automatize processos, gerencie clientes e otimize seu escritório',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Manifesto PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b0825a" />

        {/* Favicon e ícones para dispositivos */}
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />

        {/* Configurações para modo app em iOS/Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="IAJURIS" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen antialiased`}>
        {children}
        {/* O Toaster é adicionado aqui para que as notificações apareçam em toda a aplicação */}
        <Toaster position="bottom-right" reverseOrder={false} /> 
      </body>
    </html>
  );
}