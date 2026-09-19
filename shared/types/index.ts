export type PlateType = 'mercosul' | 'antiga' | 'invalida';

export interface VehicleBasicData {
  marca: string;
  modelo: string;
  submodelo?: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  combustivel: string;
  chassiMascarado: string;
  motorMascarado?: string;
  renavamMascarado?: string;
  municipio: string;
  uf: string;
  segmento?: string;
  potencia?: string;
  cilindradas?: string;
  tipoVeiculo?: string;
  especieVeiculo?: string;
  categoria?: string;
  carroceria?: string;
  eixos?: number;
  lotacao?: string;
  pesoBrutoTotal?: string;
  capacidadeTracao?: string;
  dataEmplacamento?: string;
  cambio?: string;
  nacionalidade?: 'Nacional' | 'Importado';
  situacaoVeiculo: 'EM_CIRCULACAO' | 'BAIXADO' | 'RESTRICAO' | 'NAO_DISPONIVEL';
}

export interface TheftStatus {
  status: 'NADA_CONSTA' | 'RESTRICAO_ENCONTRADA' | 'NAO_DISPONIVEL';
  mensagem: string;
  dataConsulta: string;
  boletimOcorrencia?: string;
  orgaoRegistro?: string;
  dataOcorrencia?: string;
  observacao?: string;
}

export interface FinancingStatus {
  status: 'SEM_RESTRICAO' | 'ALIENACAO_FIDUCIARIA' | 'ARRENDAMENTO_MERCANTIL' | 'RESERVA_DOMINIO' | 'REGISTRO_ENCONTRADO' | 'NAO_DISPONIVEL';
  descricao: string;
  agenteFinanceiro?: string;
  dataInclusao?: string;
  contratoMascarado?: string;
  restricaoDescricao?: string;
}

export interface AccidentHistory {
  status: 'SEM_REGISTRO' | 'PEQUENA_MONTA' | 'MEDIA_MONTA' | 'GRANDE_MONTA' | 'INDENIZACAO_INTEGRAL' | 'REGISTRO_ENCONTRADO' | 'NAO_DISPONIVEL';
  descricao: string;
  tipoSinistro?: string;
  percentualDanoEstimado?: string;
  dataRegistro?: string;
  seguradoraOrigem?: string;
}

export interface AuctionHistory {
  status: 'SEM_REGISTRO' | 'LEILAO_FINANCEIRA' | 'LEILAO_RECUPERADO_SINISTRO' | 'LEILAO_FROTA_ORGAO' | 'REGISTRO_ENCONTRADO' | 'NAO_DISPONIVEL';
  descricao: string;
  empresaLeilao?: string;
  comitente?: string;
  lote?: string;
  dataLeilao?: string;
  condicaoGeral?: string;
}

export interface VehicleDebts {
  status: 'SEM_DEBITOS' | 'DEBITOS_ENCONTRADOS' | 'NAO_DISPONIVEL';
  totalGeral: number;
  ipvaAtrasado: number;
  taxaLicenciamento: number;
  dpvat: number;
  multasDetran: number;
  multasRenainf: number;
  dividaAtiva: number;
  temRestricaoBloqueio: boolean;
  fonteConsulta?: string;
  detalhesDebitos?: Array<{
    tipo: 'IPVA' | 'Licenciamento' | 'Multa' | 'DPVAT' | 'Dívida Ativa' | 'Outro';
    descricao: string;
    exercicio?: number;
    valor: number;
    vencimento?: string;
    guiaRecolhimento?: string;
  }>;
}

export interface FinesStatus {
  status: 'SEM_REGISTROS' | 'MULTAS_ENCONTRADAS' | 'NAO_DISPONIVEL';
  quantidade: number;
  valorTotalEstimado: number;
  orgaosAutuadores: string[];
  totalDebitos?: number;
  debitos?: VehicleDebts;
  detalhes?: Array<{
    autoInfracao: string;
    orgao: string;
    descricao: string;
    dataHora: string;
    valor: number;
    gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima';
  }>;
}

export interface AdministrativeRestrictions {
  status: 'SEM_RESTRICOES' | 'RESTRICOES_ENCONTRADAS' | 'NAO_DISPONIVEL';
  quantidade: number;
  temBloqueioJudicial: boolean;
  temBloqueioAdministrativo: boolean;
  temRestricaoTributaria: boolean;
  temRestricaoGuincho: boolean;
  temRestricaoRenajud: boolean;
  temOutrasRestricoes: boolean;
  descricao?: string;
  detalhes?: Array<{
    tipo: 'Judicial' | 'Administrativa' | 'Tributária' | 'Renajud' | 'Ambiental' | 'Guincho' | 'Outro';
    descricao: string;
    orgao?: string;
    dataRegistro?: string;
    numeroProcesso?: string;
  }>;
  bloqueios?: string[];
  fonteConsulta?: string;
}

export interface OwnerStatus {
  status: 'RESTRITO_LGPD' | 'DISPONIVEL_HOMOLOGADO' | 'NAO_DISPONIVEL';
  tipoPessoa?: 'Física' | 'Jurídica';
  documentoMascarado?: string; // ex: ***.456.789-** ou **.123.***/0001-**
  avisoLGPD: string;
}

export interface FipeData {
  codigoFipe: string;
  mesReferencia: string;
  valorBrl: number;
  valorFormatado: string;
  variacao12MesesPerc: number;
  historicoPreco?: Array<{ mes: string; valor: number }>;
  combustivelFipe: string;
}

export interface IpvaData {
  uf: string;
  anoExercicio: number;
  aliquotaPerc: number;
  valorIpvaEstimado: number;
  taxaLicenciamentoEstimada: number;
  custoTotalAnual: number;
  isento: boolean;
  regraIsencao: string;
  anosAteIsencao?: number;
}

export interface RecallRecord {
  protocolo: string;
  dataChamamento: string;
  componente: string;
  risco: string;
  solucao: string;
  status: 'PENDENTE' | 'REALIZADO' | 'NAO_CONSTA' | 'INFORMATIVO';
}

export interface RecallData {
  possuiRecall: boolean;
  totalRecalls: number;
  recalls: RecallRecord[];
  orientacaoDetran: string;
}

export interface TechnicalSpecs {
  potenciaCv: number;
  cilindradasCm3: number;
  valvulas: number;
  capacidadeTanqueLitros: number;
  capacidadePortaMalasLitros: number;
  consumoUrbanoGasolinaKml: number;
  consumoRodoviarioGasolinaKml: number;
  consumoUrbanoEtanolKml: number;
  consumoRodoviarioEtanolKml: number;
  autonomiaRodoviariaKm: number;
  classificacaoPbev: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface MercosulData {
  placaOriginal: string;
  padraoAtual: 'mercosul' | 'antiga';
  placaEquivalente: string;
  obrigatorioTroca: boolean;
  custoTrocaEstimadoBrl: number;
  orientacaoTransferencia: string;
}

export interface ConsultedSource {
  id: string;
  name: string;
  type: 'free' | 'paid' | 'official' | 'partner' | 'mock';
  status: 'success' | 'timeout' | 'rate_limited' | 'unavailable' | 'error';
  latencyMs: number;
  timestamp: string;
  modulesReturned: string[];
  errorMessage?: string;
}

export interface ScoreEvidence {
  rule: string;
  points: number;
  explanation: string;
  type: 'positive' | 'warning' | 'danger' | 'neutral';
  module: string;
}

export interface ConsolidatedReport {
  id: string;
  userId?: string;
  plate: string;
  plateFormatted: string;
  plateType: PlateType;
  queryType: 'basic' | 'complete' | 'professional';
  status: 'CONCLUIDA' | 'PARCIAL' | 'ERRO' | 'NAO_ENCONTRADO';
  score: number; // 0 - 100
  riskLevel: 'baixo' | 'medio' | 'alto' | 'critico';
  scoreBreakdown: ScoreEvidence[];
  vehicle?: VehicleBasicData;
  theft: TheftStatus;
  financing: FinancingStatus;
  accident: AccidentHistory;
  auction: AuctionHistory;
  fines: FinesStatus;
  debitos?: VehicleDebts;
  restricoesAdministrativas?: AdministrativeRestrictions;
  administrativeRestrictions?: AdministrativeRestrictions;
  owner: OwnerStatus;
  sources: ConsultedSource[];
  isDemo: boolean;
  cost: number;
  durationMs: number;
  createdAt: string;
  unlockedModules?: string[];
  fipe?: FipeData;
  ipva?: IpvaData;
  recall?: RecallData;
  technicalSpecs?: TechnicalSpecs;
  mercosul?: MercosulData;
  loyaltyDiscountApplied?: boolean;
  loyaltyMessage?: string;
}

export type VehicleReport = ConsolidatedReport;

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit' | 'loyalty_reward';
  description: string;
  priceBrl?: number;
  paymentMethod?: string;
  status: 'completed' | 'pending' | 'failed';
  plate?: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  document?: string; // CPF ou CNPJ
  credits: number;
  paidQueriesCount?: number; // Total histórico de consultas pagas
  loyaltyQueriesCount?: number; // Progresso no ciclo atual de fidelidade (0 a 10)
  loyaltyRewardsEarned?: number; // Bônus de 1 crédito disponíveis para uso
  loyaltyRewardsClaimed?: number; // Total de bônus resgatados
  role: 'user' | 'admin' | 'partner';
  plan: 'free' | 'complete' | 'pro';
  createdAt: string;
  lastLogin?: string;
  apiKey?: string;
  passwordHash?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceBrl: number;
  pricePerCredit: number;
  badge?: string;
  popular?: boolean;
}

export interface PlanPricing {
  id: 'basic' | 'free' | 'complete' | 'pro';
  name: string;
  priceBrl: number;
  description: string;
  features: string[];
  highlight?: boolean;
  ctaText: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'free' | 'paid' | 'official' | 'partner' | 'mock';
  enabled: boolean;
  priority: number;
  costEstimateBrl: number;
  timeoutMs: number;
  rateLimitPerMin: number;
  requiresAuth: boolean;
  supports: string[];
  description: string;
  status: 'online' | 'degraded' | 'offline' | 'mock';
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: 'duvida_laudo' | 'financeiro' | 'b2b_api' | 'parceria' | 'outro';
  message: string;
  plateRelated?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface QueryStats {
  totalQueries: number;
  freeQueries: number;
  paidQueries: number;
  successRate: number;
  avgDurationMs: number;
  totalRevenueBrl: number;
  totalProviderCostBrl: number;
  recentQueries: ConsolidatedReport[];
}

export interface VehicleFreePreview {
  plate: string;
  plateFormatted: string;
  marca: string;
  modelo: string;
  versao?: string;
  cor: string;
  anoFabricacao: number;
  anoModelo: number;
  anoFabMod: string;
  chassiMascarado: string;
  municipio: string;
  uf: string;
  combustivel?: string;
  foundItemsCount: number;
  teasers: Array<{
    id: string;
    label: string;
    value: string;
    alert?: boolean;
  }>;
}
