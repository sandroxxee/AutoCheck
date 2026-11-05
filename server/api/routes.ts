import { Router, Request, Response } from 'express';
import type { UserAccount } from '../../shared/types/index.ts';
import type { PixOrder } from '../services/db.ts';
import { queryEngine } from '../services/QueryEngine.ts';
import { dbService } from '../services/db.ts';
import { providerRegistry } from '../providers/ProviderRegistry.ts';
import { PRODUCT_PRICES, CREDIT_PACKAGES, updatePrices, updateCreditPackages } from '../config/prices.ts';
import { PdfService } from '../services/PdfService.ts';
import { PixService } from '../services/PixService.ts';
import { brasilApiService } from '../services/BrasilApiService.ts';
import { QueryRequestSchema } from '../../shared/schemas/vehicle.ts';

export const apiRouter = Router();

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim() || undefined;
}

function getAuthenticatedUser(req: Request): UserAccount | undefined {
  const token = getBearerToken(req);
  if (!token) return undefined;
  const userId = dbService.verifySessionToken(token);
  return userId ? dbService.getUser(userId) : undefined;
}

function requireAuthenticatedUser(req: Request, res: Response): UserAccount | undefined {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ success: false, requiresAuth: true, error: 'Sua sessão expirou. Entre novamente para continuar.' });
    return undefined;
  }
  return user;
}

function requireAdmin(req: Request, res: Response): UserAccount | undefined {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return undefined;
  if (user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acesso restrito ao administrador.' });
    return undefined;
  }
  return user;
}

function getExpectedPixAmount(packageId?: string, plate?: string): number {
  if (packageId) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new Error('Pacote de créditos inválido.');
    return pkg.priceBrl;
  }
  if (plate) return PRODUCT_PRICES.find(p => p.id === 'complete')?.priceBrl || 49.90;
  throw new Error('Informe um pacote ou uma placa para gerar o PIX.');
}

async function getMercadoPagoPix(params: {
  user: UserAccount;
  amount: number;
  description: string;
  externalReference: string;
}): Promise<{ paymentId: string; copyPaste: string; qrCodeUrl: string }> {
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
  if (!token) throw new Error('Gateway PIX não configurado. O QR estático está disponível, mas a confirmação automática exige MERCADOPAGO_ACCESS_TOKEN.');

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': params.externalReference
    },
    body: JSON.stringify({
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: 'pix',
      payer: { email: params.user.email },
      external_reference: params.externalReference
    })
  });
  const data: any = await response.json().catch(() => null);
  if (!response.ok || !data?.id || !data?.point_of_interaction?.transaction_data?.qr_code) {
    throw new Error(data?.message || `Falha ao criar cobrança PIX no Mercado Pago (HTTP ${response.status}).`);
  }

  const transactionData = data.point_of_interaction.transaction_data;
  const qrCodeUrl = transactionData.qr_code_base64
    ? `data:image/png;base64,${transactionData.qr_code_base64}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(transactionData.qr_code)}&margin=10`;
  return { paymentId: String(data.id), copyPaste: transactionData.qr_code, qrCodeUrl };
}

async function isMercadoPagoPaymentApproved(order: PixOrder): Promise<boolean> {
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
  if (!token || !order.gatewayPaymentId) return false;
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(order.gatewayPaymentId)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
  const data: any = await response.json().catch(() => null);
  if (!response.ok) return false;
  return data?.status === 'approved' || data?.status_detail === 'accredited';
}

async function fulfillPaidPixOrder(order: PixOrder): Promise<{ report?: any; creditsAdded: number }> {
  if (order.status === 'paid') return { creditsAdded: 0 };

  let report: any;
  let creditsAdded = 0;
  if (order.plate) {
    report = await queryEngine.executeQuery({
      plate: order.plate,
      queryType: 'complete',
      userId: order.userId,
      forceRefresh: true
    });
    dbService.saveReport(report);
  } else if (order.packageId) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === order.packageId);
    if (!pkg) throw new Error('Pacote do pedido PIX não localizado.');
    dbService.addCredits(order.userId, pkg.credits);
    creditsAdded = pkg.credits;
  }

  dbService.addTransaction({
    id: order.txId,
    userId: order.userId,
    amount: creditsAdded,
    priceBrl: order.amount,
    paymentMethod: 'Pix Instantâneo',
    type: 'credit',
    description: order.plate ? `Consulta Completa 360 Placa ${order.plate}` : `Recarga de ${creditsAdded} crédito(s) via Pix`,
    plate: order.plate,
    status: 'completed',
    timestamp: new Date().toISOString()
  });
  dbService.markPixOrderPaid(order.txId);
  return { report, creditsAdded };
}

// 1. Check Vehicle by Plate
apiRouter.post('/vehicle/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = QueryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Parâmetros inválidos'
      });
      return;
    }

    const { plate, queryType, forceRefresh } = parseResult.data;
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let user = requireAuthenticatedUser(req, res);
    if (!user) return;

    // Toda consulta completa, inclusive as placas de teste exibidas na interface, consome uma conta autenticada.
    const loyaltyStatus = dbService.isUserEligibleForLoyaltyDiscount(user.id);
    const hasLoyaltyDiscount = loyaltyStatus.eligible;
    if (user.role !== 'admin' && !hasLoyaltyDiscount && user.credits < 1) {
      dbService.logAction('BLOCKED_NO_CREDITS', cleanPlate, `Tentativa de consulta ${queryType} bloqueada: saldo zerado.`, user.id);
      const priceBrl = queryType === 'complete' ? 49.90 : 34.90;
      res.status(402).json({
        success: false,
        requiresCredits: true,
        currentCredits: user.credits,
        loyaltyProgress: loyaltyStatus.loyaltyQueriesCount,
        loyaltyTarget: 10,
        queryType,
        plate: cleanPlate,
        priceBrl,
        error: `Saldo insuficiente para realizar a consulta ${queryType === 'complete' ? 'Completa (R$ 49,90)' : 'Básica (R$ 34,90)'}. Gere um PIX para recarregar.`
      });
      return;
    }

    const report = await queryEngine.executeQuery({
      plate: cleanPlate,
      queryType,
      userId: user.id,
      forceRefresh
    });

    let loyaltyBonusApplied = false;
    let earnedNewBonus = false;

    if (user.role !== 'admin') {
      const loyaltyStatus = dbService.isUserEligibleForLoyaltyDiscount(user.id);
      const priceBrl = queryType === 'complete' ? 49.90 : 34.90;

      if (loyaltyStatus.eligible) {
        // Aplica o desconto de 1 crédito pelo programa de fidelidade (10 consultas pagas)
        const result = dbService.applyLoyaltyDiscount(user.id, cleanPlate, queryType);
        user = result.user;
        loyaltyBonusApplied = true;
        report.loyaltyDiscountApplied = true;
        report.loyaltyMessage = '🎉 Desconto Fidelidade Aplicado: 1 crédito concedido gratuitamente por você ter completado 10 consultas pagas.';
      } else {
        // Processa débito normal de 1 crédito e computa histórico para o programa de fidelidade
        const result = dbService.recordPaidQuery(user.id, cleanPlate, queryType, priceBrl);
        user = result.user;
        earnedNewBonus = result.earnedNewBonus;
        if (earnedNewBonus) {
          report.loyaltyMessage = '★ Parabéns! Você completou 10 consultas pagas. Sua próxima consulta terá 1 crédito de desconto por fidelidade!';
        }
      }

      dbService.saveReport(report);
    }

    const currentLoyalty = dbService.isUserEligibleForLoyaltyDiscount(user.id);

    res.json({
      success: true,
      report,
      remainingCredits: user?.credits,
      loyaltyBonusApplied,
      earnedNewBonus,
      loyalty: currentLoyalty
    });
  } catch (error: unknown) {
    const message = (error as Error).message || 'Falha ao processar consulta veicular.';
    res.status(400).json({
      success: false,
      error: message
    });
  }
});

// 1.1 Free Preliminary Vehicle Preview (Análise Gratuita / Test-Drive de Baixo Custo)
// Chama APENAS a API básica/gratuita de dados cadastrais do modelo.
// NÃO executa consultas pagas (Leilão, Sinistro, Gravame, Renajud, Multas) até que o PIX seja pago!
apiRouter.post('/vehicle/free-preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plate } = req.body;
    const cleanPlate = (plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!cleanPlate || cleanPlate.length < 7) {
      res.status(400).json({ success: false, error: 'Placa inválida. Digite uma placa de 7 caracteres.' });
      return;
    }

    const data = await queryEngine.getPreliminaryVehicleData(cleanPlate);

    res.json({
      success: true,
      preview: {
        plate: cleanPlate,
        plateFormatted: data.plateFormatted || cleanPlate,
        marca: data.marca,
        modelo: data.modelo,
        versao: data.versao,
        cor: data.cor,
        anoFabricacao: data.anoFabricacao,
        anoModelo: data.anoModelo,
        anoFabMod: data.anoFabMod,
        chassiMascarado: data.chassiMascarado,
        municipio: data.municipio,
        uf: data.uf,
        combustivel: data.combustivel,
        foundItemsCount: data.foundItemsCount || 27,
        teasers: [
          { id: 'leilao', label: 'Leilão:', value: '**********' },
          { id: 'sinistro', label: 'Sinistros:', value: '**********' },
          { id: 'gravame', label: 'Gravame:', value: '**********' },
          { id: 'restricoes', label: 'Restrições:', value: '**********' },
          { id: 'debitos', label: 'Débitos / Multas:', value: '**********' },
          { id: 'roubo_furto', label: 'Roubo e Furto:', value: '**********' }
        ]
      }
    });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 2. Get Vehicle Report by ID
apiRouter.get('/vehicle/report/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const report = dbService.getReport(req.params.id);
    if (!report) {
      res.status(404).json({ success: false, error: 'Relatório não encontrado.' });
      return;
    }
    if (user.role !== 'admin' && report.userId !== user.id) {
      res.status(403).json({ success: false, error: 'Este relatório não pertence à sua conta.' });
      return;
    }
    res.json({ success: true, report });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 3. Upgrade Report (from Basic to Complete)
apiRouter.post('/vehicle/report/:id/upgrade', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const report = await queryEngine.upgradeReport(req.params.id, user.id);
    res.json({ success: true, report });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 4. Demo Plates presets for testing
apiRouter.get('/vehicle/demo-plates', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    plates: [
      {
        plate: 'ABC1D23',
        type: 'mercosul',
        vehicle: 'Toyota Corolla XEi 2020',
        score: 95,
        status: 'Excelente / Impecável',
        badge: 'Veículo 100% Regular',
        description: 'Sem restrições, sem sinistros, gravame quitado.'
      },
      {
        plate: 'BRA2E19',
        type: 'mercosul',
        vehicle: 'Jeep Renegade 2023',
        score: 85,
        status: 'Gravame Ativo',
        badge: 'Alienação Fiduciária',
        description: 'Financiamento bancário ativo no SNG.'
      },
      {
        plate: 'KOL9876',
        type: 'antiga',
        vehicle: 'Chevrolet Onix Plus 2021',
        score: 70,
        status: 'Passagem por Leilão',
        badge: 'Leilão Financeira',
        description: 'Arrematado em leilão de recuperação bancária.'
      },
      {
        plate: 'SAV1010',
        type: 'antiga',
        vehicle: 'VW Golf GTI 2018',
        score: 60,
        status: 'Alerta de Sinistro',
        badge: 'Sinistro Média Monta',
        description: 'Histórico de colisão e reparo estrutural médio.'
      },
      {
        plate: 'ROU8080',
        type: 'mercosul',
        vehicle: 'Hyundai HB20 2023',
        score: 20,
        status: 'Restrição Policial',
        badge: 'Roubo / Furto Ativo',
        description: 'Boletim de ocorrência ativo registrado no SINESP.'
      }
    ]
  });
});

// 5. Providers Management
apiRouter.get('/providers', (_req: Request, res: Response): void => {
  const providers = providerRegistry.getAllProviders();
  res.json({ success: true, providers });
});

apiRouter.post('/admin/test-apibrasil', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAdmin(req, res)) return;
    const { plate = 'BRA2E19', token, apiUrl, deviceToken } = req.body;
    const finalToken = (token || process.env.APIBRASIL_BEARER_TOKEN || process.env.APIBRASIL_TOKEN || process.env.VEHICLE_API_KEY || '').trim();
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const finalDevice = (deviceToken || process.env.APIBRASIL_DEVICE_TOKEN || process.env.DEVICE_TOKEN || '').trim();

    if (!finalToken) {
      res.status(400).json({
        success: false,
        error: 'Nenhum token fornecido ou configurado no ambiente (APIBRASIL_BEARER_TOKEN ou APIBRASIL_TOKEN).'
      });
      return;
    }

    const candidateUrls = [
      (apiUrl || '').trim(),
      process.env.CONSULTA_VEICULAR_API_URL,
      process.env.APIBRASIL_URL,
      'https://gateway.apibrasil.io/api/v2/vehicles/dados',
      'https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits',
      'https://gateway.apibrasil.io/api/v2/vehicles/fipe',
      'https://gateway.apibrasil.io/api/v2/vehicles/base/001/consulta'
    ];
    const uniqueUrls = Array.from(new Set(candidateUrls.filter(Boolean)));

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${finalToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (finalDevice) {
      headers['DeviceToken'] = finalDevice;
      headers['Device-Token'] = finalDevice;
    }

    let lastResult: any = null;

    for (const url of uniqueUrls) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ placa: cleanPlate, plate: cleanPlate })
      });

      const status = response.status;
      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      lastResult = {
        success: response.ok,
        httpStatus: status,
        rawResponse: json || text,
        endpointUsed: url,
        plateQueried: cleanPlate
      };

      if (response.ok) {
        res.json(lastResult);
        return;
      }
    }

    res.json(lastResult);
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/admin/set-apibrasil-token', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;
  const { token, deviceToken, apiUrl } = req.body;
  if (token) process.env.APIBRASIL_TOKEN = token;
  if (deviceToken) process.env.APIBRASIL_DEVICE_TOKEN = deviceToken;
  if (apiUrl) process.env.APIBRASIL_URL = apiUrl;
  process.env.DEMO_MODE = 'false';

  res.json({
    success: true,
    message: 'Credenciais da APIBrasil atualizadas na memória do servidor com sucesso.',
    demoMode: process.env.DEMO_MODE === 'true'
  });
});

apiRouter.post('/admin/providers/:id', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;
  const id = req.params.id;
  const updates = req.body;
  const success = providerRegistry.updateProviderConfig(id, updates);
  if (!success) {
    res.status(404).json({ success: false, error: 'Provedor não localizado.' });
    return;
  }
  res.json({ success: true, message: 'Configurações do provedor atualizadas.' });
});

// 6. Admin Analytics & Stats
apiRouter.get('/admin/stats', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;
  const stats = dbService.getStats();
  const providers = providerRegistry.getAllProviders();
  const auditLogs = dbService.getAuditLogs(15);
  res.json({ success: true, stats, providers, auditLogs });
});

// 7. Audit Logs
apiRouter.get('/admin/audit-logs', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;
  const logs = dbService.getAuditLogs(50);
  res.json({ success: true, logs });
});

// 8. Pricing & Plans
apiRouter.get('/prices', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    plans: PRODUCT_PRICES,
    creditPackages: CREDIT_PACKAGES
  });
});

apiRouter.post('/admin/prices', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;
  if (req.body.plans) {
    updatePrices(req.body.plans);
  }
  if (req.body.creditPackages) {
    updateCreditPackages(req.body.creditPackages);
  }
  res.json({ success: true, message: 'Tabela de preços atualizada com sucesso.' });
});

// 9. Auth & User Management
apiRouter.post('/auth/register', (req: Request, res: Response): void => {
  try {
    const { name, email, password, phone, document, company } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    const { user, token } = dbService.registerUser({
      name,
      email,
      password,
      phone,
      document,
      company
    });

    res.json({
      success: true,
      message: 'Conta criada com sucesso! Você ganhou 2 créditos de bônus.',
      user,
      token
    });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/auth/oauth-sync', (req: Request, res: Response): void => {
  try {
    const { email, name, uid, phone } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'E-mail é obrigatório para sincronização OAuth.' });
      return;
    }

    const { user, token } = dbService.upsertOAuthUser({
      uid,
      email,
      name,
      phone
    });

    res.json({
      success: true,
      message: `Bem-vindo, ${user.name.split(' ')[0]}!`,
      user,
      token
    });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Informe e-mail e senha.' });
      return;
    }

    const { user, token } = dbService.authenticateUser(email, password);
    res.json({
      success: true,
      message: `Bem-vindo de volta, ${user.name.split(' ')[0]}!`,
      user,
      token
    });
  } catch (error: unknown) {
    res.status(401).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response): void => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Informe seu e-mail cadastrado.' });
      return;
    }

    const code = dbService.generateRecoveryCode(email);
    res.json({
      success: true,
      message: `Código de verificação gerado e enviado para ${email}.`,
      demoCode: code // Display code in response for demo convenience
    });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response): void => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ success: false, error: 'E-mail, código e nova senha são obrigatórios.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    dbService.resetPasswordWithCode(email, code, newPassword);
    res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Faça login com a nova senha.'
    });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.put('/user/profile', (req: Request, res: Response): void => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const userId = user.id;
    const { name, phone, document, company } = req.body;
    const updated = dbService.updateUserProfile(userId, { name, phone, document, company });
    res.json({ success: true, message: 'Perfil atualizado com sucesso.', user: updated });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/user/change-password', (req: Request, res: Response): void => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const userId = user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Informe a senha atual e a nova senha.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    dbService.changePassword(userId, oldPassword, newPassword);
    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/user/delete-account', (req: Request, res: Response): void => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const success = dbService.deleteUser(user.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Conta não localizada.' });
      return;
    }
    res.json({ success: true, message: 'Conta apagada com sucesso.' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.delete('/admin/users/:id', (req: Request, res: Response): void => {
  try {
    if (!requireAdmin(req, res)) return;
    const userId = req.params.id;
    const success = dbService.deleteUser(userId);
    if (!success) {
      res.status(404).json({ success: false, error: 'Conta não localizada.' });
      return;
    }
    res.json({ success: true, message: 'Usuário removido com sucesso pelo administrador.' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/user/transactions', (req: Request, res: Response): void => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const transactions = dbService.getUserTransactions(user.id);
  res.json({ success: true, transactions });
});

// 10. User Profile & Queries
apiRouter.get('/user/me', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  res.json({ success: true, user: user || null });
});

apiRouter.get('/user/loyalty', (req: Request, res: Response): void => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const loyalty = dbService.isUserEligibleForLoyaltyDiscount(user.id);
  res.json({ success: true, loyalty });
});

apiRouter.get('/user/queries', (req: Request, res: Response): void => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const queries = dbService.getReportsByUserId(user.id);
  res.json({ success: true, queries });
});

// 10. PIX Payment & Configuration
apiRouter.get('/payment/pix-config', (_req: Request, res: Response): void => {
  const pix = dbService.getPixSettings();
  res.json({ success: true, pix });
});

apiRouter.post('/admin/pix-config', (req: Request, res: Response): void => {
  try {
    if (!requireAdmin(req, res)) return;
    const { pixKey, pixKeyType, beneficiaryName, beneficiaryCity, autoApprove } = req.body;
    const updated = dbService.updatePixSettings({
      ...(pixKey ? { pixKey: pixKey.trim() } : {}),
      ...(pixKeyType ? { pixKeyType } : {}),
      ...(beneficiaryName ? { beneficiaryName: beneficiaryName.trim() } : {}),
      ...(beneficiaryCity ? { beneficiaryCity: beneficiaryCity.trim() } : {}),
      ...(autoApprove !== undefined ? { autoApprove } : {})
    });
    res.json({ success: true, message: 'Configurações de recebimento PIX atualizadas com sucesso.', pix: updated });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/payment/generate-pix', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const { description = 'Consulta AutoCheck Brasil', reportId, packageId, plate } = req.body;
    const expectedAmount = getExpectedPixAmount(packageId, plate);
    const pixSettings = dbService.getPixSettings();
    const txId = `ac${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const externalReference = JSON.stringify({ txId, userId: user.id, packageId, reportId, plate, amount: expectedAmount });

    let generatedPix;
    const mpToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
    if (mpToken) {
      const mpPix = await getMercadoPagoPix({
        user,
        amount: expectedAmount,
        description: String(description).substring(0, 120),
        externalReference
      });
      generatedPix = { ...mpPix, txId };
    } else {
      generatedPix = PixService.generatePixCopyPaste({
        pixKey: pixSettings.pixKey,
        beneficiaryName: pixSettings.beneficiaryName,
        beneficiaryCity: pixSettings.beneficiaryCity,
        amount: expectedAmount,
        transactionId: txId,
        description: String(description).substring(0, 20)
      });
    }

    dbService.createPixOrder({
      txId,
      userId: user.id,
      amount: expectedAmount,
      packageId,
      reportId,
      plate: plate ? String(plate).replace(/[^A-Za-z0-9]/g, '').toUpperCase() : undefined,
      gatewayPaymentId: mpToken ? (generatedPix as any).paymentId : undefined
    });

    res.json({
      success: true,
      pix: {
        ...generatedPix,
        pixKey: pixSettings.pixKey,
        beneficiaryName: pixSettings.beneficiaryName,
        beneficiaryCity: pixSettings.beneficiaryCity,
        reportId,
        packageId,
        expiresInSeconds: 900
      }
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/payment/confirm-pix', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const { txId } = req.body;
    if (!txId) {
      res.status(400).json({ success: false, message: 'Identificador do PIX não informado.' });
      return;
    }
    const order = dbService.getPixOrder(String(txId));
    if (!order || order.userId !== user.id) {
      res.status(404).json({ success: false, message: 'Pedido PIX não localizado para esta conta.' });
      return;
    }
    if (order.status === 'paid') {
      res.json({ success: true, message: 'Pagamento já confirmado.', report: order.reportId ? dbService.getReport(order.reportId) : undefined });
      return;
    }
    const approved = await isMercadoPagoPaymentApproved(order);
    if (!approved) {
      res.status(202).json({ success: false, pending: true, message: 'Pagamento ainda não identificado. Aguarde a confirmação do banco e tente novamente.' });
      return;
    }
    const fulfilled = await fulfillPaidPixOrder(order);
    res.json({ success: true, message: 'Pagamento via PIX confirmado com sucesso!', report: fulfilled.report, creditsAdded: fulfilled.creditsAdded });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Mercado Pago Webhook for Pix automatic payment confirmation and instant credit delivery
apiRouter.post('/payment/mercadopago/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentId = req.body.data?.id || req.body.id || req.query.id;
    const mpAccessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
    if (!paymentId || !mpAccessToken) {
      res.status(400).json({ success: false, error: 'Webhook inválido ou gateway não configurado.' });
      return;
    }
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}`, Accept: 'application/json' }
    });
    const paymentData: any = await mpRes.json().catch(() => null);
    if (!mpRes.ok || !paymentData) {
      res.status(502).json({ success: false, error: 'Não foi possível validar o pagamento no Mercado Pago.' });
      return;
    }

    const externalReference = paymentData.external_reference;
    if (paymentData.status !== 'approved' && paymentData.status_detail !== 'accredited') {
      res.json({ success: true, message: `Webhook recebido, status do pagamento: ${paymentData.status}` });
      return;
    }

    let parsed: { txId?: string } = {};
    try { parsed = JSON.parse(externalReference || '{}'); } catch { parsed = {}; }
    const order = parsed.txId ? dbService.getPixOrder(parsed.txId) : undefined;
    if (!order || order.gatewayPaymentId !== String(paymentId)) {
      res.status(404).json({ success: false, error: 'Pedido PIX não localizado ou não corresponde ao pagamento.' });
      return;
    }
    const fulfilled = await fulfillPaidPixOrder(order);
    res.json({ success: true, message: 'Pedido PIX processado.', userId: order.userId, creditsAdded: fulfilled.creditsAdded, reportId: fulfilled.report?.id });
  } catch (error: unknown) {
    console.error('[MercadoPago Webhook] Falha ao processar webhook:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 10. Credit Purchase Checkout (use /payment/generate-pix and confirm only after gateway approval)
apiRouter.post('/user/credits/buy', (req: Request, res: Response): void => {
  res.status(410).json({ success: false, error: 'Checkout legado desativado. Gere um PIX e aguarde a aprovação do gateway.' });
});

// 10.1 Sandbox Development Free Test Credits
apiRouter.post('/user/credits/sandbox-bonus', (req: Request, res: Response): void => {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      res.status(404).json({ success: false, error: 'Modo de testes desativado.' });
      return;
    }
    const user = requireAdmin(req, res);
    if (!user) return;
    const userId = user.id;

    user.credits = (user.credits || 0) + 5;
    dbService.saveUser(user);

    dbService.addTransaction({
      id: 'tx_sandbox_' + Math.random().toString(36).substring(2, 10),
      userId: user.id,
      amount: 5,
      priceBrl: 0,
      paymentMethod: 'Sandbox / Modo de Testes',
      type: 'credit',
      description: 'Recarga de 5 créditos para testes em desenvolvimento',
      status: 'completed',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: '5 créditos gratuitos de teste adicionados com sucesso!',
      credits: user.credits
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 11. PDF Export
apiRouter.post('/reports/:id/pdf', (req: Request, res: Response): void => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const report = dbService.getReport(req.params.id);
    if (!report) {
      res.status(404).json({ success: false, error: 'Relatório não localizado.' });
      return;
    }

    if (user.role !== 'admin' && report.userId !== user.id) {
      res.status(403).json({ success: false, error: 'Este relatório não pertence à sua conta.' });
      return;
    }

    const pdfBuffer = PdfService.generateVehicleReportPdf(report, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AutoCheck-Consulta-Historico-${report.plateFormatted || report.plate}.pdf`);
    res.send(pdfBuffer);
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 11.2 Comprovante de Serviço Fiscal e Dados Cadastrais da Empresa (Mercado Pago / Efí / LGPD)
apiRouter.get('/company/info', (_req: Request, res: Response): void => {
  const company = dbService.getCompanySettings();
  res.json({ success: true, company });
});

apiRouter.post('/admin/company-config', (req: Request, res: Response): void => {
  try {
    if (!requireAdmin(req, res)) return;
    const updated = dbService.updateCompanySettings(req.body);
    res.json({ success: true, message: 'Dados cadastrais da empresa e CNPJ atualizados com sucesso.', company: updated });
  } catch (error: unknown) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/transactions/:txId/receipt', (req: Request, res: Response): void => {
  const { txId } = req.params;
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const tx = dbService.getTransaction(txId);
  if (!tx || (user.role !== 'admin' && tx.userId !== user.id)) {
    res.status(403).json({ success: false, error: 'Comprovante não pertence à sua conta.' });
    return;
  }
  const receipt = dbService.generateReceipt(txId, user.id);
  if (!receipt) {
    res.status(404).json({ success: false, error: 'Comprovante não localizado para a transação especificada.' });
    return;
  }
  res.json({ success: true, receipt });
});

// 12. JSON Export
apiRouter.get('/reports/:id/json', (req: Request, res: Response): void => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const report = dbService.getReport(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, error: 'Relatório não localizado.' });
    return;
  }
  if (user.role !== 'admin' && report.userId !== user.id) {
    res.status(403).json({ success: false, error: 'Este relatório não pertence à sua conta.' });
    return;
  }
  res.setHeader('Content-Disposition', `attachment; filename=AutoCheck-${report.plate}.json`);
  res.json(report);
});

// 13. Support & Contact
apiRouter.post('/support/ticket', (req: Request, res: Response): void => {
  try {
    const { name, email, phone, subject, category, message, plateRelated } = req.body;
    if (!name || !email || !subject || !message) {
      res.status(400).json({ success: false, error: 'Nome, e-mail, assunto e mensagem são obrigatórios.' });
      return;
    }

    const ticket = dbService.createSupportTicket({
      name,
      email,
      phone,
      subject,
      category: category || 'outro',
      message,
      plateRelated
    });

    res.json({
      success: true,
      message: 'Sua mensagem foi recebida com sucesso! Protocolo gerado: #' + ticket.id,
      ticket
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/support/tickets', (req: Request, res: Response): void => {
  const tickets = dbService.getSupportTickets();
  res.json({ success: true, tickets });
});

// ============================================================================
// 14. BRASIL API - SERVIÇOS PÚBLICOS E GRATUITOS DE DADOS DO BRASIL
// ============================================================================

// 14.1. Consulta Preço Tabela FIPE por código FIPE
apiRouter.get('/brasilapi/fipe/preco/:codigoFipe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigoFipe } = req.params;
    const precos = await brasilApiService.getFipePreco(codigoFipe);
    res.json({ success: true, precos });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 14.2. Consulta Marcas FIPE
apiRouter.get('/brasilapi/fipe/marcas/:tipo?', async (req: Request, res: Response): Promise<void> => {
  try {
    const tipo = (req.params.tipo as any) || 'carros';
    const marcas = await brasilApiService.getFipeMarcas(tipo);
    res.json({ success: true, marcas });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 14.3. Consulta de CEP
apiRouter.get('/brasilapi/cep/:cep', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cep } = req.params;
    const dados = await brasilApiService.getCep(cep);
    res.json({ success: true, dados });
  } catch (error: unknown) {
    res.status(404).json({ success: false, error: (error as Error).message });
  }
});

// 14.4. Consulta de CNPJ na Receita Federal
apiRouter.get('/brasilapi/cnpj/:cnpj', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cnpj } = req.params;
    const empresa = await brasilApiService.getCnpj(cnpj);
    res.json({ success: true, empresa });
  } catch (error: unknown) {
    res.status(404).json({ success: false, error: (error as Error).message });
  }
});

// 14.5. Consulta de Cidades por DDD
apiRouter.get('/brasilapi/ddd/:ddd', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ddd } = req.params;
    const dddData = await brasilApiService.getDdd(ddd);
    res.json({ success: true, ddd: dddData });
  } catch (error: unknown) {
    res.status(404).json({ success: false, error: (error as Error).message });
  }
});

// 14.6. Consulta de Taxas de Mercado (Selic, CDI, IPCA)
apiRouter.get('/brasilapi/taxas', async (_req: Request, res: Response): Promise<void> => {
  try {
    const taxas = await brasilApiService.getTaxas();
    res.json({ success: true, taxas });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 14.7. Consulta de Bancos Nacionais
apiRouter.get('/brasilapi/bancos', async (_req: Request, res: Response): Promise<void> => {
  try {
    const bancos = await brasilApiService.getBanks();
    res.json({ success: true, bancos });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 14.8. Consulta de Feriados Nacionais
apiRouter.get('/brasilapi/feriados/:ano?', async (req: Request, res: Response): Promise<void> => {
  try {
    const ano = req.params.ano ? parseInt(req.params.ano, 10) : undefined;
    const feriados = await brasilApiService.getFeriados(ano);
    res.json({ success: true, feriados });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
