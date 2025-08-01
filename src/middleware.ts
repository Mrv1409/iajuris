import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Configura headers para upload de arquivos grandes
  if (request.nextUrl.pathname.startsWith('/api/pdf-analysis')) {
    const response = NextResponse.next();
    
    // Permite arquivos de até 50MB
    response.headers.set('Content-Length-Limit', '52428800'); // 50MB em bytes
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/pdf-analysis/:path*',
  ],
};