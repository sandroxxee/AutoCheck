import { ConsolidatedReport, PlanPricing, CreditPackage, ProviderConfig, QueryStats, UserAccount, CreditTransaction, SupportTicket, VehicleFreePreview } from '../types/index.ts';
import { getCachedReport, setCachedReport, removeCachedReport } from './reportCache.ts';

// Helper robusto para tratamento de erros e exibição de respostas inteiras do servidor (HTML/Logs)
async function safeRequest(url: string, options: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(`Falha de conexão com o servidor. Verifique sua internet.\nErro: ${netErr.message}`);
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Erro do Servidor (Status ${res.status})`);
    }
    return data;
  } catch (err) {
    // Caso o servidor retorne um erro em HTML (ex: Vercel, Node crash dump), extraímos o texto útil legível
    const cleanText = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // remove estilos css
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // remove scripts js
      .replace(/<[^>]*>/g, ' ') // remove tags HTML
      .replace(/\s+/g, ' ') // remove espaços extras
      .trim();
    
    throw new Error(`[Erro ${res.status} da Vercel/Servidor]: ${cleanText || text}`);
  }
}

function sessionHeaders(contentType = false): Record<string, string> {
  const token = localStorage.getItem('autocheck_session_token');
  return {
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function persistSession(data: { token?: string; user?: UserAccount }): void {
  if (data.token) localStorage.setItem('autocheck_session_token', data.token);
  if (data.user?.id) {
    localStorage.setItem('autocheck_user_id', data.user.id);
    localStorage.setItem('autocheck_user_email', data.user.email);
  }
}

export const api = {
  // --- Auth & Session ---
  async syncOAuthUser(payload: { uid: string; email: string; name?: string; phone?: string }): Promise<{ success: boolean; user: UserAccount; token: string; message: string }> {
    const data = await safeRequest('/api/auth/oauth-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    persistSession(data);
    return data;
  },

  async register(payload: { name: string; email: string; password: string; phone?: string; document?: string; company?: string }): Promise<{ success: boolean; user: UserAccount; token: string; message: string }> {
    const data = await safeRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    persistSession(data);
    return data;
  },

  async login(payload: { email: string; password: string }): Promise<{ success: boolean; user: UserAccount; token: string; message: string }> {
    const data = await safeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    persistSession(data);
    return data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; demoCode?: string }> {
    return safeRequest('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(payload: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return safeRequest('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async updateProfile(payload: { name?: string; phone?: string; document?: string; company?: string }): Promise<{ success: boolean; message: string; user: UserAccount }> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: sessionHeaders(true),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao atualizar perfil.');
    }
    return data;
  },

  async changePassword(payload: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: sessionHeaders(true),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao alterar senha.');
    }
    return data;
  },

  async getTransactions(): Promise<CreditTransaction[]> {
    const userId = localStorage.getItem('autocheck_user_id');
    if (!userId) {
      return [];
    }
    const res = await fetch('/api/user/transactions', {
      headers: sessionHeaders()
    });
    const data = await res.json();
    return data.transactions || [];
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/user/delete-account', {
      method: 'POST',
      headers: sessionHeaders(true),
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao apagar conta.');
    }
    this.logout();
    return data;
  },

  async adminDeleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao remover usuário.');
    }
    return data;
  },

  logout(): void {
    localStorage.removeItem('autocheck_user_id');
    localStorage.removeItem('autocheck_user_email');
    localStorage.removeItem('autocheck_session_token');
  },

  // 1. Check vehicle with local storage caching layer (prevents redundant API calls)
  async checkVehicle(plate: string, queryType: 'basic' | 'complete' | 'professional' = 'basic', forceRefresh = false): Promise<{
    success: boolean;
    report: ConsolidatedReport;
    fromCache?: boolean;
    remainingCredits?: number;
    loyaltyBonusApplied?: boolean;
    earnedNewBonus?: boolean;
    loyalty?: {
      eligible: boolean;
      paidQueriesCount: number;
      loyaltyQueriesCount: number;
      rewardsAvailable: number;
      progressPercentage: number;
    };
  }> {
    const cleanPlate = (plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // 1.1 Check Local Storage Cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedReport(cleanPlate, queryType);
      if (cached) {
        return {
          success: true,
          report: cached,
          fromCache: true
        };
      }
    }

    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/vehicle/check', {
      method: 'POST',
      headers: sessionHeaders(true),
      body: JSON.stringify({ plate: cleanPlate, queryType })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const error: any = new Error(data.error || 'Falha ao consultar placa.');
      error.requiresAuth = data.requiresAuth || res.status === 401;
      error.requiresCredits = data.requiresCredits || res.status === 402;
      error.priceBrl = data.priceBrl;
      error.queryType = data.queryType || queryType;
      error.plate = data.plate || cleanPlate;
      error.loyaltyProgress = data.loyaltyProgress;
      error.loyaltyTarget = data.loyaltyTarget;
      throw error;
    }

    // Persist to local storage cache
    if (data.report) {
      setCachedReport(data.report);
    }

    return data;
  },

  // 1.1 Free Preliminary Vehicle Preview (Análise Gratuita)
  async getFreePreview(plate: string): Promise<{ success: boolean; preview: VehicleFreePreview }> {
    const cleanPlate = (plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const res = await fetch('/api/vehicle/free-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate: cleanPlate })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao buscar prévia gratuita da placa.');
    }
    return data;
  },

  // 1.2 Get Loyalty Status
  async getLoyaltyStatus(): Promise<{
    eligible: boolean;
    paidQueriesCount: number;
    loyaltyQueriesCount: number;
    rewardsAvailable: number;
    progressPercentage: number;
  }> {
    const userId = localStorage.getItem('autocheck_user_id');
    if (!userId) {
      return { eligible: false, paidQueriesCount: 0, loyaltyQueriesCount: 0, rewardsAvailable: 0, progressPercentage: 0 };
    }
    const res = await fetch('/api/user/loyalty', {
      headers: sessionHeaders()
    });
    const data = await res.json();
    return data.loyalty || { eligible: false, paidQueriesCount: 0, loyaltyQueriesCount: 0, rewardsAvailable: 0, progressPercentage: 0 };
  },

  // 2. Get report by ID
  async getReport(id: string): Promise<ConsolidatedReport> {
    const res = await fetch(`/api/vehicle/report/${id}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Relatório não encontrado.');
    }
    if (data.report) {
      setCachedReport(data.report);
    }
    return data.report;
  },

  // 3. Upgrade report
  async upgradeReport(id: string): Promise<ConsolidatedReport> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch(`/api/vehicle/report/${id}/upgrade`, {
      method: 'POST',
      headers: sessionHeaders(true)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao desbloquear relatório completo.');
    }
    if (data.report) {
      setCachedReport(data.report);
    }
    return data.report;
  },

  // 4. Get demo plates
  async getDemoPlates(): Promise<Array<{ plate: string; type: string; vehicle: string; score: number; status: string; badge: string; description: string }>> {
    const res = await fetch('/api/vehicle/demo-plates');
    const data = await res.json();
    return data.plates || [];
  },

  // 5. Get user details
  async getUser(): Promise<UserAccount | null> {
    const userId = localStorage.getItem('autocheck_user_id');
    if (!userId) {
      return null;
    }
    const res = await fetch('/api/user/me', {
      headers: sessionHeaders()
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.user || null;
  },

  // 6. Get user query history
  async getUserQueries(): Promise<ConsolidatedReport[]> {
    const userId = localStorage.getItem('autocheck_user_id');
    if (!userId) {
      return [];
    }
    const res = await fetch('/api/user/queries', {
      headers: sessionHeaders()
    });
    const data = await res.json();
    return data.queries || [];
  },

  // 7. Buy credits (mock checkout)
  async buyCredits(packageId: string, paymentMethod: string): Promise<{ success: boolean; message: string; credits: number }> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/user/credits/buy', {
      method: 'POST',
      headers: sessionHeaders(true),
      body: JSON.stringify({ packageId, paymentMethod })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao processar pagamento.');
    }
    return data;
  },

  // 7.1 Claim Sandbox Test Credits (Free for development testing)
  async claimSandboxCredits(): Promise<{ success: boolean; message: string; credits: number }> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/user/credits/sandbox-bonus', {
      method: 'POST',
      headers: sessionHeaders(true),
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao adicionar créditos de teste.');
    }
    return data;
  },

  // 8. Get prices
  async getPrices(): Promise<{ plans: PlanPricing[]; creditPackages: CreditPackage[] }> {
    const res = await fetch('/api/prices');
    const data = await res.json();
    return data;
  },

  // 9. Admin Stats
  async getAdminStats(): Promise<{ stats: QueryStats; providers: ProviderConfig[]; auditLogs: any[] }> {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    return data;
  },

  // 10. Update Provider Config
  async updateProvider(id: string, updates: Partial<ProviderConfig>): Promise<void> {
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      throw new Error('Falha ao atualizar provedor.');
    }
  },

  // 11. Download PDF
  async downloadPdf(reportId: string, filename = 'AutoCheck-Relatorio.pdf'): Promise<void> {
    const res = await fetch(`/api/reports/${reportId}/pdf`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Falha ao gerar arquivo PDF.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // 12. Download JSON
  async downloadJson(reportId: string, filename = 'AutoCheck-Relatorio.json'): Promise<void> {
    const res = await fetch(`/api/reports/${reportId}/json`);
    if (!res.ok) throw new Error('Falha ao exportar JSON.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // 13. Support & Tickets
  async createSupportTicket(payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    category: 'duvida_consulta' | 'duvida_laudo' | 'financeiro' | 'b2b_api' | 'parceria' | 'outro';
    message: string;
    plateRelated?: string;
  }): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch('/api/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao enviar mensagem de suporte.');
    }
    return data;
  },

  async getSupportTickets(): Promise<SupportTicket[]> {
    const res = await fetch('/api/support/tickets');
    const data = await res.json();
    return data.tickets || [];
  },

  async testApiBrasil(payload: { plate: string; token?: string; apiUrl?: string; deviceToken?: string }): Promise<{
    success: boolean;
    httpStatus: number;
    rawResponse: any;
    endpointUsed: string;
    plateQueried: string;
    error?: string;
  }> {
    const res = await fetch('/api/admin/test-apibrasil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async setApiBrasilToken(payload: { token: string; deviceToken?: string; apiUrl?: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await fetch('/api/admin/set-apibrasil-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // 14. PIX Operations
  async getPixConfig(): Promise<{ pixKey: string; pixKeyType: string; beneficiaryName: string; beneficiaryCity: string }> {
    const res = await fetch('/api/payment/pix-config');
    const data = await res.json();
    return data.pix;
  },

  async updatePixConfig(payload: { pixKey: string; pixKeyType?: string; beneficiaryName?: string; beneficiaryCity?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/pix-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async generatePix(payload: { amount?: number; description?: string; reportId?: string; packageId?: string; plate?: string }): Promise<{
    success: boolean;
    pix: {
      copyPaste: string;
      qrCodeUrl: string;
      txId: string;
      amount: number;
      beneficiaryName: string;
      beneficiaryCity: string;
      expiresInSeconds: number;
    };
  }> {
    const res = await fetch('/api/payment/generate-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async confirmPix(payload: { txId: string; reportId?: string; plate?: string; packageId?: string; amount?: number }): Promise<{
    success: boolean;
    message: string;
    report?: ConsolidatedReport;
  }> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch('/api/payment/confirm-pix', {
      method: 'POST',
      headers: sessionHeaders(true),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // 15. BrasilAPI - Consultas Públicas Gratuitas
  async getFipePreco(codigoFipe: string): Promise<any[]> {
    const res = await fetch(`/api/brasilapi/fipe/preco/${encodeURIComponent(codigoFipe)}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao consultar preço na FIPE.');
    return data.precos || [];
  },

  async getFipeMarcas(tipo: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<any[]> {
    const res = await fetch(`/api/brasilapi/fipe/marcas/${tipo}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao consultar marcas FIPE.');
    return data.marcas || [];
  },

  async getCep(cep: string): Promise<any> {
    const res = await fetch(`/api/brasilapi/cep/${encodeURIComponent(cep.replace(/\D/g, ''))}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'CEP não encontrado.');
    return data.dados;
  },

  async getCnpj(cnpj: string): Promise<any> {
    const res = await fetch(`/api/brasilapi/cnpj/${encodeURIComponent(cnpj.replace(/\D/g, ''))}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'CNPJ não encontrado na Receita Federal.');
    return data.empresa;
  },

  async getDdd(ddd: number | string): Promise<any> {
    const res = await fetch(`/api/brasilapi/ddd/${encodeURIComponent(String(ddd).replace(/\D/g, ''))}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'DDD não encontrado.');
    return data.ddd;
  },

  async getTaxas(): Promise<any[]> {
    const res = await fetch('/api/brasilapi/taxas');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao obter taxas.');
    return data.taxas || [];
  },

  async getBancos(): Promise<any[]> {
    const res = await fetch('/api/brasilapi/bancos');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao obter bancos.');
    return data.bancos || [];
  },

  // 16. Dados da Empresa, CNPJ e Recibos Fiscais (Mercado Pago / Efí / LGPD)
  async getCompanyInfo(): Promise<any> {
    const res = await fetch('/api/company/info');
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao obter dados da empresa.');
    return data.company;
  },

  async updateCompanyConfig(payload: any): Promise<any> {
    const res = await fetch('/api/admin/company-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao atualizar dados da empresa.');
    return data.company;
  },

  async getTransactionReceipt(txId: string): Promise<any> {
    const userId = localStorage.getItem('autocheck_user_id');
    const res = await fetch(`/api/transactions/${encodeURIComponent(txId)}/receipt`, {
      headers: sessionHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao obter recibo da transação.');
    return data.receipt;
  },

  // 17. Mercado Pago Webhook Simulation & Testing
  async processMercadoPagoWebhook(payload: {
    id?: string | number;
    action?: string;
    type?: string;
    data?: { id: string };
    status?: 'approved' | 'pending' | 'rejected';
    external_reference?: string;
    transaction_amount?: number;
  }): Promise<{
    success: boolean;
    message: string;
    userId?: string;
    creditsAdded?: number;
    reportId?: string;
  }> {
    const res = await fetch('/api/payment/mercadopago/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha ao processar webhook do Mercado Pago.');
    }
    return data;
  }
};
