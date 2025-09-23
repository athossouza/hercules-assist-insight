export interface ServiceOrder {
  OS: string;
  Tipo: string;
  Status: string;
  "Data Abertura": string;
  "Data Fechamento": string;
  Finalidade: string;
  Origem: string;
  "CNPJ Posto": string;
  "Razão Social Posto": string;
  "Cidade Posto": string;
  "UF Posto": string;
  "CPF/CNPJ Consum": string;
  Consumidor: string;
  "Cidade Cons": string;
  "UF Cons": string;
  Telefone: string;
  "Telefone 2": string;
  "Ref Prod": string;
  "Desc Produto": string;
  "Família Prod": string;
  "Lote/Serie": string;
  "Data Fabricação": string;
  "Data Faturamento": string;
  "NF de Faturamento": string;
  "Faturado Para": string;
  Revendedor: string;
  "CNPJ Rev": string;
  "Cidade Rev": string;
  "UF Rev": string;
  "NF Compra": string;
  "Data NF Compra": string;
  "NF Conserto": string;
  "Data NF Conserto": string;
  Obs: string;
  "Adicionais da OS": string;
  "Qtde  Adicional da OS": string;
  "Vlr Unit Adicional da OS": string;
  "Vlr Total Adicional da OS": string;
  "Obs Adicional da OS": string;
  "Defeito Reclamado": string;
  "Defeito Constatado": string;
  Garantia: string;
  Tecnico: string;
  "Data Hora Check": string;
  Lat: string;
  Lng: string;
  "Peças Trocadas": string;
  "Descrição Peça": string;
  "Qtde Trocada": string;
  "Ação de Reparo": string;
  "Defeito Peça": string;
  "Obs Defeito Peça": string;
  "Data Lançto Peça": string;
  "Usuários Papel Abertura": string;
  "Nº do Extrato": string;
  "Status da Extrato": string;
  "Data de Pagamento": string;
}

export interface KPIData {
  totalOrders: number;
  avgServiceTime: number;
  avgProductLifetime: number;
  warrantyPercentage: number;
}

export interface ProductRanking {
  produto: string;
  quantidade: number;
}

export interface DefectRanking {
  defeito: string;
  quantidade: number;
}

export interface MonthlyTrend {
  month: string;
  quantidade: number;
}

export interface StatusDistribution {
  status: string;
  quantidade: number;
  percentage: number;
}

export interface StateDistribution {
  estado: string;
  quantidade: number;
}

export interface DashboardFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  productFamily: string;
  status: string;
  state: string;
}