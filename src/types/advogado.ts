// types/advogado.ts
export interface AdvogadoData {
    id?: string;
    nome: string;
    especialidades: string[];
    experiencia: string;
    cidade: string;
    estado: string;
    telefone: string;
    email?: string;
    biografia: string;
    slug?: string;
    criadoEm?: Date;
    ativo?: boolean;
  }
  
  export interface AdvogadoChatContext {
    advogadoSlug: string;
    mensagem: string;
    isInicial?: boolean;
    clienteNome?: string;
    clienteTelefone?: string;
  }
  
  export interface AdvogadoChatResponse {
    resposta: string;
    sucesso: boolean;
    metadata?: {
      advogado: string;
      especialidades: string[];
      contato: string;
    };
    error?: string;
  }