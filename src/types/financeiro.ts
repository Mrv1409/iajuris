import { Timestamp } from 'firebase/firestore'; 

// Collection: financeiro_honorarios
export interface FinanceiroHonorarios {
  id: string;
  clienteId: string; // Referência ao cliente
  clienteNome: string;
  tipoHonorario: 'contratual' | 'sucumbencial' | 'exito';
  valor: number;
  porcentagem?: number; // Para honorários de êxito
  dataVencimento: Timestamp; // Usar Timestamp para refletir o Firestore
  dataPagamento?: Timestamp | null; // Pode ser Timestamp ou null
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  descricao: string;
  numeroProcesso?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface para os dados de Honorário recebidos na API (datas como string)
export interface HonorarioApiData {
  clienteId: string;
  clienteNome: string;
  tipoHonorario: 'contratual' | 'sucumbencial' | 'exito';
  valor: number;
  porcentagem?: number;
  dataVencimento: string; // Vem como string da requisição
  dataPagamento?: string | null; // Vem como string ou pode ser null
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  descricao: string;
  numeroProcesso?: string;
}

// Collection: financeiro_despesas
export interface FinanceiroDespesas {
  id: string;
  clienteId?: string; // Opcional para despesas gerais
  clienteNome?: string;
  numeroProcesso?: string;
  categoria: 'custas' | 'pericia' | 'documentacao' | 'deslocamento' | 'outras';
  descricao: string;
  valor: number;
  dataVencimento: Timestamp;
  dataPagamento?: Timestamp | null;
  status: 'pendente' | 'pago' | 'atrasado';
  comprovante?: string; // URL do arquivo
  observacoes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface para os dados de Despesa recebidos na API (datas como string)
export interface DespesaApiData {
  clienteId?: string;
  clienteNome?: string;
  numeroProcesso?: string;
  categoria: 'custas' | 'pericia' | 'documentacao' | 'deslocamento' | 'outras';
  descricao: string;
  valor: number;
  dataVencimento: string; // Vem como string da requisição
  dataPagamento?: string | null; // Vem como string ou pode ser null
  status?: 'pendente' | 'pago' | 'atrasado'; // Opcional, com padrão 'pendente'
  comprovante?: string;
  observacoes?: string;
}

// Collection: financeiro_recibos
export interface FinanceiroRecibos {
  id: string;
  numeroRecibo: string; // Gerado automaticamente
  clienteId: string;
  clienteNome: string;
  cpfCnpj: string;
  endereco: string;
  servicos: Array<{
    descricao: string;
    valor: number;
  }>;
  valorTotal: number; // Adicionado valorTotal aqui, pois estava faltando na sua interface original
  dataEmissao: Timestamp;
  status: 'emitido' | 'cancelado';
  observacoes?: string;
  createdAt: Timestamp;
  // REMOVIDO: updatedAt, pois não estava na sua definição original para recibos
}

// NOVO: Interface para os dados de Recibo recebidos na API (datas como string)
export interface ReciboApiData {
  clienteId: string;
  clienteNome: string;
  cpfCnpj: string;
  endereco: string;
  servicos: Array<{
    descricao: string;
    valor: number;
  }>;
  valorTotal: number;
  dataEmissao: string; // Vem como string da requisição
  status?: 'emitido' | 'cancelado'; // Opcional, com padrão 'emitido'
  observacoes?: string;
}


// Collection: financeiro_dashboard (para métricas agregadas)
export interface FinanceiroDashboard {
  id: string; // Use format: YYYY-MM para métricas mensais
  mes: number;
  ano: number;
  totalReceitas: number;
  totalDespesas: number;
  totalPendente: number;
  totalAtrasado: number;
  honorariosRecebidos: number;
  despesasProcessuais: number;
  recibosEmitidos: number;
  clientesInadimplentes: number;
  updatedAt: Timestamp;
}

// Collection: financeiro_config (configurações do sistema)
export interface FinanceiroConfig {
  id: 'settings';
  proximoNumeroRecibo: number;
  dadosEscritorio: {
    nome: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  configuracoesRecibo: {
    observacoesPadrao: string;
    validadeDias: number;
  };
  updatedAt: Timestamp;
}