import { ConsolidatedReport, UserAccount, QueryStats, CreditTransaction, SupportTicket } from '../../shared/types/index.ts';
import crypto from 'crypto';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  plateHash: string;
  ipMasked?: string;
  details: string;
  timestamp: string;
}

export interface PixSettings {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  beneficiaryName: string;
  beneficiaryCity: string;
  autoApprove: boolean;
}

class DatabaseService {
  private static instance: DatabaseService;

  private users: Map<string, UserAccount> = new Map();
  private reports: Map<string, ConsolidatedReport> = new Map();
  private plateHashToReportId: Map<string, string[]> = new Map();
  private auditLogs: AuditLog[] = [];
  private transactions: CreditTransaction[] = [];
  private recoveryCodes: Map<string, { code: string; expiresAt: number }> = new Map();
  private supportTickets: SupportTicket[] = [];
  private pixSettings: PixSettings = {
    pixKey: process.env.PIX_KEY || '09512592967',
    pixKeyType: 'cpf',
    beneficiaryName: process.env.PIX_RECEIVER_NAME || 'SANDRO (AUTOCHECK BRASIL)',
    beneficiaryCity: process.env.PIX_CITY || 'SAO PAULO',
    autoApprove: true
  };

  private constructor() {
    this.seedDefaultUsers();
    this.seedDefaultTickets();
  }

  public getPixSettings(): PixSettings {
    return { ...this.pixSettings };
  }

  public updatePixSettings(updates: Partial<PixSettings>): PixSettings {
    this.pixSettings = { ...this.pixSettings, ...updates };
    return { ...this.pixSettings };
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + '_autocheck_salt_2026').digest('hex');
  }

  private seedDefaultTickets() {
    this.supportTickets.push({
      id: 'tkt_demo_101',
      name: 'Marcos Almeida',
      email: 'marcos@almeidaveiculos.com.br',
      phone: '(11) 99123-4567',
      subject: 'Dúvida sobre integração API em lote',
      category: 'b2b_api',
      message: 'Gostaria de saber como contratar o pacote de 5.000 consultas mensais com webhook de notificação.',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    });
  }

  private seedDefaultUsers() {
    const adminEmail = 'sandrooxxee@gmail.com';
    const adminUser: UserAccount = {
      id: 'usr_admin_sandro',
      name: 'Sandro (Administrador)',
      email: adminEmail,
      phone: '(11) 99999-9999',
      credits: 999,
      paidQueriesCount: 0,
      loyaltyQueriesCount: 0,
      loyaltyRewardsEarned: 0,
      loyaltyRewardsClaimed: 0,
      role: 'admin',
      plan: 'pro',
      createdAt: new Date().toISOString(),
      apiKey: 'ac_live_pk_admin_master_sandro_2026',
      passwordHash: this.hashPassword('admin123')
    };
    this.saveUser(adminUser);
  }

  public deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    if (user.email) {
      this.recoveryCodes.delete(user.email.toLowerCase());
    }
    this.users.delete(userId);
    this.logAction('USER_ACCOUNT_DELETED', 'NO_PLATE', `Conta do usuário ${user.email} (${user.name}) foi apagada permanentemente.`, userId);
    return true;
  }

  // --- Authentication & User Operations ---
  public registerUser(params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    document?: string;
    company?: string;
  }): { user: UserAccount; token: string } {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('Já existe uma conta cadastrada com este e-mail.');
    }

    const isAdmin = cleanEmail === 'sandrooxxee@gmail.com';
    const id = isAdmin ? 'usr_admin_sandro' : 'usr_' + Math.random().toString(36).substring(2, 10);
    const apiKey = 'ac_live_pk_' + crypto.randomBytes(8).toString('hex');
    const newUser: UserAccount = {
      id,
      name: params.name.trim(),
      email: cleanEmail,
      phone: params.phone?.trim(),
      document: params.document?.trim(),
      company: params.company?.trim(),
      credits: isAdmin ? 999 : 0,
      paidQueriesCount: 0,
      loyaltyQueriesCount: 0,
      loyaltyRewardsEarned: 0,
      loyaltyRewardsClaimed: 0,
      role: isAdmin ? 'admin' : 'user',
      plan: isAdmin ? 'pro' : 'free',
      createdAt: new Date().toISOString(),
      apiKey,
      passwordHash: this.hashPassword(params.password)
    };

    this.saveUser(newUser);

    this.logAction('USER_REGISTERED', 'NO_PLATE', `Novo usuário cadastrado (${newUser.role})`, id);

    return { user: newUser, token: 'tok_' + id + '_' + Date.now() };
  }

  public authenticateUser(email: string, password: string): { user: UserAccount; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    let user = this.getUserByEmail(cleanEmail);
    
    // Auto-provision admin if not exists
    if (!user && cleanEmail === 'sandrooxxee@gmail.com') {
      this.seedDefaultUsers();
      user = this.getUserByEmail(cleanEmail);
    }

    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const hash = this.hashPassword(password);
    const isMasterAdmin = cleanEmail === 'sandrooxxee@gmail.com';
    
    // For master admin, accept password 'admin123', 'admin', 'sandro123' or configured hash
    const isValidAdminPass = isMasterAdmin && (
      password === 'admin123' ||
      password === 'admin' ||
      password === 'sandro123' ||
      password === '123456'
    );

    if (user.passwordHash && user.passwordHash !== hash && !isValidAdminPass) {
      throw new Error('E-mail ou senha incorretos.');
    }

    user.lastLogin = new Date().toISOString();
    this.saveUser(user);

    return { user, token: 'tok_' + user.id + '_' + Date.now() };
  }

  public generateRecoveryCode(email: string): string {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('Não localizamos nenhuma conta cadastrada com este e-mail.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.recoveryCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    return code;
  }

  public resetPasswordWithCode(email: string, code: string, newPass: string): boolean {
    const record = this.recoveryCodes.get(email.toLowerCase());
    if (!record || record.code !== code.trim() || Date.now() > record.expiresAt) {
      throw new Error('Código de segurança inválido ou expirado.');
    }

    const user = this.getUserByEmail(email);
    if (!user) throw new Error('Usuário não localizado.');

    user.passwordHash = this.hashPassword(newPass);
    this.saveUser(user);
    this.recoveryCodes.delete(email.toLowerCase());
    return true;
  }

  public updateUserProfile(userId: string, data: Partial<UserAccount>): UserAccount {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuário não localizado.');

    if (data.name) user.name = data.name.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.document !== undefined) user.document = data.document.trim();
    if (data.company !== undefined) user.company = data.company.trim();

    return this.saveUser(user);
  }

  public changePassword(userId: string, oldPass: string, newPass: string): boolean {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuário não localizado.');

    if (user.passwordHash && user.passwordHash !== this.hashPassword(oldPass)) {
      throw new Error('A senha atual informada está incorreta.');
    }

    user.passwordHash = this.hashPassword(newPass);
    this.saveUser(user);
    return true;
  }

  public upsertOAuthUser(params: {
    uid?: string;
    email: string;
    name?: string;
    phone?: string;
  }): { user: UserAccount; token: string } {
    const cleanEmail = params.email.trim().toLowerCase();
    let user = this.getUserByEmail(cleanEmail);

    if (user) {
      if (params.name && (!user.name || user.name === 'Usuário')) {
        user.name = params.name.trim();
      }
      user.lastLogin = new Date().toISOString();
      this.saveUser(user);
    } else {
      const id = params.uid || 'usr_' + Math.random().toString(36).substring(2, 10);
      const apiKey = 'ac_live_pk_' + crypto.randomBytes(8).toString('hex');
      user = {
        id,
        name: params.name?.trim() || cleanEmail.split('@')[0] || 'Usuário',
        email: cleanEmail,
        phone: params.phone?.trim(),
        credits: 0,
        paidQueriesCount: 0,
        loyaltyQueriesCount: 0,
        loyaltyRewardsEarned: 0,
        loyaltyRewardsClaimed: 0,
        role: cleanEmail === 'sandrooxxee@gmail.com' ? 'admin' : 'user',
        plan: 'free',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        apiKey
      };
      this.saveUser(user);
      this.logAction('USER_OAUTH_REGISTERED', 'NO_PLATE', `Novo usuário registrado via Google OAuth`, id);
    }

    return { user, token: 'tok_' + user.id + '_' + Date.now() };
  }

  public getUser(id: string): UserAccount | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): UserAccount | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: UserAccount): UserAccount {
    this.users.set(user.id, user);
    return user;
  }

  public addCredits(userId: string, amount: number): UserAccount {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuário não localizado.');
    user.credits = (user.credits || 0) + amount;
    this.saveUser(user);
    this.logAction('CREDITS_ADDED', 'NO_PLATE', `Adicionados ${amount} crédito(s). Novo saldo: ${user.credits}`, userId);
    return user;
  }

  // --- Programa de Fidelidade (10 consultas pagas = 1 crédito/consulta de desconto) ---
  public isUserEligibleForLoyaltyDiscount(userId: string): {
    eligible: boolean;
    paidQueriesCount: number;
    loyaltyQueriesCount: number;
    rewardsAvailable: number;
    progressPercentage: number;
  } {
    const user = this.getUser(userId);
    if (!user) {
      return { eligible: false, paidQueriesCount: 0, loyaltyQueriesCount: 0, rewardsAvailable: 0, progressPercentage: 0 };
    }

    const paidTotal = user.paidQueriesCount || 0;
    const progress = user.loyaltyQueriesCount !== undefined ? user.loyaltyQueriesCount : (paidTotal % 10);
    const rewards = user.loyaltyRewardsEarned || (progress >= 10 ? Math.floor(progress / 10) : 0);

    const isEligible = rewards > 0 || progress >= 10;

    return {
      eligible: isEligible,
      paidQueriesCount: paidTotal,
      loyaltyQueriesCount: progress,
      rewardsAvailable: rewards,
      progressPercentage: Math.min(100, Math.round((progress / 10) * 100))
    };
  }

  public recordPaidQuery(
    userId: string,
    plate: string,
    queryType: string,
    priceBrl: number
  ): { user: UserAccount; earnedNewBonus: boolean; currentProgress: number } {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuário não localizado.');

    // Debita 1 crédito do saldo
    user.credits = Math.max(0, (user.credits || 0) - 1);

    // Incrementa contadores de histórico de consultas pagas
    user.paidQueriesCount = (user.paidQueriesCount || 0) + 1;
    user.loyaltyQueriesCount = (user.loyaltyQueriesCount || 0) + 1;

    let earnedNewBonus = false;
    // Se atingiu o ciclo de 10 consultas pagas:
    if (user.loyaltyQueriesCount >= 10) {
      user.loyaltyRewardsEarned = (user.loyaltyRewardsEarned || 0) + 1;
      user.loyaltyQueriesCount = 0; // Reinicia ciclo para as próximas 10
      earnedNewBonus = true;
    }

    this.saveUser(user);

    // Registra transação de débito normal
    this.addTransaction({
      id: 'tx_q_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      amount: 1,
      type: 'debit',
      description: `Consulta veicular ${queryType === 'complete' ? 'Completa' : 'Básica'} (Placa: ${plate})`,
      plate,
      priceBrl,
      status: 'completed',
      timestamp: new Date().toISOString()
    });

    this.logAction(
      'QUERY_CHARGED',
      plate,
      `Consulta ${queryType.toUpperCase()} debitada (R$ ${priceBrl.toFixed(2).replace('.', ',')}). Histórico: ${user.paidQueriesCount} pagas. Saldo restante: ${user.credits} vistorias. ${earnedNewBonus ? '★ BÔNUS FIDELIDADE CONQUISTADO (1 crédito grátis para próxima consulta)' : `Progresso fidelidade: ${user.loyaltyQueriesCount}/10`}`,
      user.id
    );

    return {
      user,
      earnedNewBonus,
      currentProgress: user.loyaltyQueriesCount || 0
    };
  }

  public applyLoyaltyDiscount(
    userId: string,
    plate: string,
    queryType: string
  ): { user: UserAccount; discountApplied: boolean } {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuário não localizado.');

    const eligibility = this.isUserEligibleForLoyaltyDiscount(userId);
    if (!eligibility.eligible) {
      return { user, discountApplied: false };
    }

    // Aplica o desconto de 1 crédito: NÃO debita dos créditos normais
    if (user.loyaltyRewardsEarned && user.loyaltyRewardsEarned > 0) {
      user.loyaltyRewardsEarned -= 1;
    } else if (user.loyaltyQueriesCount && user.loyaltyQueriesCount >= 10) {
      user.loyaltyQueriesCount -= 10;
    }

    user.loyaltyRewardsClaimed = (user.loyaltyRewardsClaimed || 0) + 1;
    this.saveUser(user);

    // Registra transação de fidelidade (100% de desconto)
    this.addTransaction({
      id: 'tx_loyalty_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      amount: 1,
      type: 'loyalty_reward',
      description: `Desconto Fidelidade (1 Crédito 100% OFF por 10 consultas pagas completadas) - Placa: ${plate}`,
      plate,
      priceBrl: 0,
      status: 'completed',
      timestamp: new Date().toISOString()
    });

    this.logAction(
      'LOYALTY_DISCOUNT_APPLIED',
      plate,
      `Desconto Fidelidade aplicado com sucesso na consulta ${queryType.toUpperCase()}. 1 crédito concedido gratuitamente por histórico de 10 consultas. Saldo de créditos preservado: ${user.credits}`,
      user.id
    );

    return { user, discountApplied: true };
  }

  public getAllUsers(): UserAccount[] {
    return Array.from(this.users.values());
  }

  // --- Reports & Queries ---
  public saveReport(report: ConsolidatedReport): ConsolidatedReport {
    this.reports.set(report.id, report);

    const plate = report.plate.toUpperCase();
    const existing = this.plateHashToReportId.get(plate) || [];
    if (!existing.includes(report.id)) {
      existing.unshift(report.id);
      this.plateHashToReportId.set(plate, existing);
    }

    return report;
  }

  public getReport(id: string): ConsolidatedReport | undefined {
    return this.reports.get(id);
  }

  public getLatestReportByPlate(plate: string, queryType?: string): ConsolidatedReport | undefined {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const reportIds = this.plateHashToReportId.get(clean) || [];
    for (const id of reportIds) {
      const rep = this.reports.get(id);
      if (rep) {
        // Retorna somente se o queryType for exatamente o mesmo solicitado
        if (!queryType || rep.queryType === queryType) {
          return rep;
        }
      }
    }
    return undefined;
  }

  public getReportsByUserId(userId: string): ConsolidatedReport[] {
    return Array.from(this.reports.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRecentReports(limit = 20): ConsolidatedReport[] {
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // --- Transactions & Credits ---
  public addTransaction(tx: CreditTransaction): CreditTransaction {
    this.transactions.unshift(tx);
    return tx;
  }

  public getUserTransactions(userId: string): CreditTransaction[] {
    return this.transactions.filter(t => t.userId === userId);
  }

  // --- Support Tickets ---
  public createSupportTicket(data: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>): SupportTicket {
    const ticket: SupportTicket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      ...data,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    this.supportTickets.unshift(ticket);
    return ticket;
  }

  public getSupportTickets(): SupportTicket[] {
    return this.supportTickets;
  }

  // --- Audit Logs ---
  public logAction(action: string, plate: string, details: string, userId?: string): void {
    const hash = Buffer.from(plate.toUpperCase()).toString('base64').substring(0, 8);
    this.auditLogs.unshift({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      userId,
      action,
      plateHash: `hash_${hash}`,
      details,
      timestamp: new Date().toISOString()
    });

    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(limit = 50): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- Stats for Admin ---
  public getStats(): QueryStats {
    const allReports = Array.from(this.reports.values());
    const total = allReports.length;
    const freeQueries = allReports.filter(r => r.queryType === 'basic').length;
    const paidQueries = allReports.filter(r => r.queryType !== 'basic').length;
    const successful = allReports.filter(r => r.status === 'CONCLUIDA').length;
    const successRate = total > 0 ? Number(((successful / total) * 100).toFixed(1)) : 100;
    const avgDurationMs = total > 0
      ? Math.round(allReports.reduce((acc, r) => acc + (r.durationMs || 0), 0) / total)
      : 240;

    const totalRevenue = this.transactions
      .filter(t => t.type === 'credit' && t.status === 'completed')
      .reduce((acc, t) => acc + (t.priceBrl || 0), 0) + (freeQueries * 34.90) + (paidQueries * 49.90);

    const totalProviderCost = allReports.reduce((acc, r) => acc + (r.cost || 0), 0);

    return {
      totalQueries: total,
      freeQueries,
      paidQueries,
      successRate,
      avgDurationMs,
      totalRevenueBrl: Number(totalRevenue.toFixed(2)),
      totalProviderCostBrl: Number(totalProviderCost.toFixed(2)),
      recentQueries: this.getRecentReports(10)
    };
  }
}

export const dbService = DatabaseService.getInstance();
