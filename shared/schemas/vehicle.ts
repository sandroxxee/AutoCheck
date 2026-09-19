import { z } from 'zod';
import { PlateType, ScoreEvidence, AdministrativeRestrictions } from '../types/index.ts';

/**
 * Validates and normalizes Brazilian license plates
 * Formats:
 * - Mercosul: LLLNLNN (ex: ABC1D23)
 * - Padrão Antigo: LLLNNNN (ex: ABC1234)
 */
export function validateAndNormalizePlate(input: string): {
  valid: boolean;
  cleanPlate: string;
  formattedPlate: string;
  type: PlateType;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { valid: false, cleanPlate: '', formattedPlate: '', type: 'invalida', error: 'Informe uma placa veicular válida.' };
  }

  // Remove spaces, hyphens, dots and convert to uppercase
  const clean = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (clean.length !== 7) {
    return { valid: false, cleanPlate: clean, formattedPlate: clean, type: 'invalida', error: 'A placa deve conter exatamente 7 caracteres alfanuméricos.' };
  }

  const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const antigaRegex = /^[A-Z]{3}[0-9]{4}$/;

  if (mercosulRegex.test(clean)) {
    return {
      valid: true,
      cleanPlate: clean,
      formattedPlate: `${clean.slice(0, 3)}-${clean.slice(3)}`,
      type: 'mercosul'
    };
  }

  if (antigaRegex.test(clean)) {
    return {
      valid: true,
      cleanPlate: clean,
      formattedPlate: `${clean.slice(0, 3)}-${clean.slice(3)}`,
      type: 'antiga'
    };
  }

  return {
    valid: false,
    cleanPlate: clean,
    formattedPlate: clean,
    type: 'invalida',
    error: 'Formato de placa inválido. Aceitamos padrão Mercosul (ABC1D23) ou antigo (ABC-1234).'
  };
}

export const QueryRequestSchema = z.object({
  plate: z.string().min(7).max(8),
  queryType: z.enum(['basic', 'complete', 'professional']).default('basic'),
  forceRefresh: z.boolean().optional().default(false),
});

/**
 * Masks sensitive information in compliance with Brazilian LGPD
 */
export function maskSensitive(text: string, type: 'chassi' | 'cpf' | 'cnpj' | 'motor'): string {
  if (!text) return 'Não disponível';

  if (type === 'chassi') {
    // Show first 6 characters and mask the rest: 9BWAG41*********
    if (text.length <= 6) return text;
    return text.substring(0, 7) + '*'.repeat(Math.max(0, text.length - 7));
  }

  if (type === 'motor') {
    if (text.length <= 4) return '***';
    return text.substring(0, 4) + '***';
  }

  if (type === 'cpf') {
    // Format: ***.456.789-**
    const clean = text.replace(/\D/g, '');
    if (clean.length === 11) {
      return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
    }
    return '***.***.***-**';
  }

  if (type === 'cnpj') {
    // Format: **.123.***/0001-**
    const clean = text.replace(/\D/g, '');
    if (clean.length === 14) {
      return `**.${clean.substring(2, 5)}.***/${clean.substring(8, 12)}-**`;
    }
    return '**.***.***/****-**';
  }

  return '***';
}

/**
 * Calculates safety score strictly based on explicit returned data.
 * Does NOT penalize missing modules as negative risks.
 */
export function calculateVehicleScore(data: {
  theftStatus: string;
  financingStatus: string;
  accidentStatus: string;
  auctionStatus: string;
  finesQuantity: number;
  vehicleStatus: string;
  administrativeRestrictions?: AdministrativeRestrictions;
}): { score: number; riskLevel: 'baixo' | 'medio' | 'alto' | 'critico'; breakdown: ScoreEvidence[] } {
  let score = 100;
  const breakdown: ScoreEvidence[] = [];

  // 1. Theft / Furto (Immediate Critical Risk)
  if (data.theftStatus === 'RESTRICAO_ENCONTRADA') {
    score -= 60;
    breakdown.push({
      rule: 'Restrição Ativa de Roubo ou Furto',
      points: -60,
      explanation: 'Veículo possui alerta ativo de roubo ou furto nas bases policiais consultadas.',
      type: 'danger',
      module: 'theft'
    });
  } else if (data.theftStatus === 'NADA_CONSTA') {
    breakdown.push({
      rule: 'Roubo e Furto: Nada Consta',
      points: 0,
      explanation: 'Nenhuma ocorrência de roubo ou furto foi registrada nas fontes oficiais.',
      type: 'positive',
      module: 'theft'
    });
  } else {
    breakdown.push({
      rule: 'Roubo e Furto: Fonte Indisponível',
      points: 0,
      explanation: 'Módulo de roubo e furto não respondeu na consulta atual. Pontuação não penalizada.',
      type: 'neutral',
      module: 'theft'
    });
  }

  // 2. Accident / Sinistro
  if (data.accidentStatus === 'GRANDE_MONTA' || data.accidentStatus === 'INDENIZACAO_INTEGRAL') {
    score -= 40;
    breakdown.push({
      rule: 'Sinistro de Grande Monta / Perda Total',
      points: -40,
      explanation: 'Histórico de colisão severa com indenização integral registrado em base de seguradoras.',
      type: 'danger',
      module: 'accident'
    });
  } else if (data.accidentStatus === 'MEDIA_MONTA') {
    score -= 25;
    breakdown.push({
      rule: 'Sinistro de Média Monta',
      points: -25,
      explanation: 'Veículo sofreu danos estruturais médios com necessidade de laudo e desbloqueio.',
      type: 'warning',
      module: 'accident'
    });
  } else if (data.accidentStatus === 'PEQUENA_MONTA') {
    score -= 10;
    breakdown.push({
      rule: 'Sinistro de Pequena Monta',
      points: -10,
      explanation: 'Histórico de colisão leve com reparos sem danos estruturais graves.',
      type: 'warning',
      module: 'accident'
    });
  } else if (data.accidentStatus === 'SEM_REGISTRO') {
    breakdown.push({
      rule: 'Sem Registro de Sinistro',
      points: 0,
      explanation: 'Nenhum histórico de sinistro ou perda total encontrado.',
      type: 'positive',
      module: 'accident'
    });
  }

  // 3. Auction / Leilão
  if (data.auctionStatus === 'LEILAO_RECUPERADO_SINISTRO') {
    score -= 30;
    breakdown.push({
      rule: 'Passagem por Leilão (Seguradora / Sinistro)',
      points: -30,
      explanation: 'Veículo foi leiloado por companhia seguradora após evento de sinistro.',
      type: 'danger',
      module: 'auction'
    });
  } else if (data.auctionStatus === 'LEILAO_FINANCEIRA' || data.auctionStatus === 'LEILAO_FROTA_ORGAO') {
    score -= 15;
    breakdown.push({
      rule: 'Passagem por Leilão (Recuperação Financeira / Frota)',
      points: -15,
      explanation: 'Veículo leiloado por banco/instituição financeira ou renovação de frota corporativa.',
      type: 'warning',
      module: 'auction'
    });
  } else if (data.auctionStatus === 'SEM_REGISTRO') {
    breakdown.push({
      rule: 'Sem Registro de Leilão',
      points: 0,
      explanation: 'Nenhum registro de leilão encontrado nas principais casas leiloeiras nacionais.',
      type: 'positive',
      module: 'auction'
    });
  }

  // 4. Financing / Gravame
  if (data.financingStatus === 'ALIENACAO_FIDUCIARIA' || data.financingStatus === 'ARRENDAMENTO_MERCANTIL') {
    score -= 10;
    breakdown.push({
      rule: 'Gravame Ativo (Alienação / Financiamento)',
      points: -10,
      explanation: 'Veículo possui restrição financeira ativa junto ao SNG (Sistema Nacional de Gravames). Necessita quitação para transferência.',
      type: 'warning',
      module: 'financing'
    });
  } else if (data.financingStatus === 'SEM_RESTRICAO') {
    breakdown.push({
      rule: 'Livre de Gravame',
      points: 0,
      explanation: 'Veículo quitado sem restrição financeira ou alienação ativa.',
      type: 'positive',
      module: 'financing'
    });
  }

  // 5. Fines / Multas
  if (data.finesQuantity > 3) {
    score -= 10;
    breakdown.push({
      rule: `Débitos e Multas (${data.finesQuantity} autuações)`,
      points: -10,
      explanation: 'Existe quantidade relevante de autuações pendentes no Renainf/Detran.',
      type: 'warning',
      module: 'fines'
    });
  } else if (data.finesQuantity > 0) {
    score -= 5;
    breakdown.push({
      rule: `Infrações Pendentes (${data.finesQuantity} autuação)`,
      points: -5,
      explanation: 'Possui infração de trânsito em aberto para regularização.',
      type: 'warning',
      module: 'fines'
    });
  } else if (data.finesQuantity === 0) {
    breakdown.push({
      rule: 'Sem Débitos de Multas Encontrados',
      points: 0,
      explanation: 'Nenhuma autuação ativa registrada nas fontes conectadas.',
      type: 'positive',
      module: 'fines'
    });
  }

  // 6. Cadastral
  if (data.vehicleStatus === 'EM_CIRCULACAO') {
    breakdown.push({
      rule: 'Situação Cadastral Regular',
      points: 0,
      explanation: 'Veículo em circulação regular na base nacional do Renavam.',
      type: 'positive',
      module: 'vehicle'
    });
  } else if (data.vehicleStatus === 'BAIXADO') {
    score -= 50;
    breakdown.push({
      rule: 'Veículo com Registro de Baixa',
      points: -50,
      explanation: 'Veículo registrado como baixado permanentemente do cadastro nacional.',
      type: 'danger',
      module: 'vehicle'
    });
  }

  // 7. Administrative & Judicial Restrictions (RENAJUD, DETRAN)
  if (data.administrativeRestrictions) {
    if (data.administrativeRestrictions.temBloqueioJudicial) {
      score -= 35;
      breakdown.push({
        rule: 'Bloqueio Judicial RENAJUD Ativo',
        points: -35,
        explanation: 'Ordem judicial ativa (penhora, indisponibilidade ou transferência) averbada no sistema RENAJUD.',
        type: 'danger',
        module: 'restrictions'
      });
    }

    if (data.administrativeRestrictions.temBloqueioAdministrativo) {
      score -= 15;
      breakdown.push({
        rule: 'Restrição Administrativa DETRAN Ativa',
        points: -15,
        explanation: 'Restrição administrativa impediente ativa no DETRAN (ex: comunicação de venda, falta de transferência ou vistoria).',
        type: 'warning',
        module: 'restrictions'
      });
    }

    if (data.administrativeRestrictions.temRestricaoTributaria) {
      score -= 10;
      breakdown.push({
        rule: 'Restrição Tributária / Dívida Ativa SEFAZ',
        points: -10,
        explanation: 'Pendência fiscal/tributária estadual averbada no prontuário do veículo.',
        type: 'warning',
        module: 'restrictions'
      });
    }

    if (data.administrativeRestrictions.status === 'SEM_RESTRICOES') {
      breakdown.push({
        rule: 'Livre de Restrições Administrativas ou Judiciais',
        points: 0,
        explanation: 'Nenhum bloqueio judicial (Renajud) ou restrição administrativa do Detran encontrado.',
        type: 'positive',
        module: 'restrictions'
      });
    }
  }

  // Ensure bounds
  score = Math.max(0, Math.min(100, score));

  let riskLevel: 'baixo' | 'medio' | 'alto' | 'critico' = 'baixo';
  if (score >= 80) riskLevel = 'baixo';
  else if (score >= 60) riskLevel = 'medio';
  else if (score >= 40) riskLevel = 'alto';
  else riskLevel = 'critico';

  return { score, riskLevel, breakdown };
}
