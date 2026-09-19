import { PlanPricing, CreditPackage } from '../../shared/types/index.ts';

export let PRODUCT_PRICES: PlanPricing[] = [
  {
    id: 'basic',
    name: 'Consulta Básica',
    priceBrl: 34.90,
    description: 'Identificação cadastral completa e checagem oficial de roubo e furto na base nacional.',
    ctaText: 'Escolher Básica (R$ 34,90)',
    features: [
      'Dados cadastrais oficiais (marca, modelo, ano, cor, combustível)',
      'Checagem oficial de Roubo e Furto (SINESP)',
      'Identificadores técnicos (chassi e motor mascarados)',
      'Município e UF de emplacamento',
      'Situação cadastral de circulação',
      'Resultado instantâneo na tela'
    ]
  },
  {
    id: 'complete',
    name: 'Consulta Completa',
    priceBrl: 49.90,
    highlight: true,
    description: 'Histórico veicular 360° com gravames, multas, sinistros, leilão e laudo pericial.',
    ctaText: 'Escolher Completa (R$ 49,90)',
    features: [
      'Tudo incluso na Consulta Básica',
      'Gravames, Financiamento e Alienação Fiduciária (SNG/B3)',
      'Débitos, Autuações e Infrações em aberto (Renainf)',
      'Histórico de Sinistro (Pequena, Média e Grande monta)',
      'Passagens por Leilões de Seguradoras e Bancos',
      'Score de Segurança e Procedência (0 a 100)',
      'Emissão do Laudo Pericial em PDF Oficial',
      'Histórico salvo na sua conta por 90 dias'
    ]
  },
  {
    id: 'pro',
    name: 'Plano Frotista / Lotes',
    priceBrl: 149.90,
    description: 'Para revendas, despachantes, concessionárias e frotistas com maior volume.',
    ctaText: 'Adquirir Pacote Pro',
    features: [
      'Consultas com o menor custo unitário',
      'Painel multi-usuário com exportação',
      'Acesso à API REST para integração',
      'Emissão de laudos periciais em lote',
      'Suporte prioritário via WhatsApp',
      'Créditos válidos sem expiração'
    ]
  }
];

export let CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack_basic',
    name: '1 Consulta Básica Avulsa',
    credits: 1,
    priceBrl: 34.90,
    pricePerCredit: 34.90,
    badge: 'Básica'
  },
  {
    id: 'pack_complete',
    name: '1 Consulta Completa Avulsa',
    credits: 1,
    priceBrl: 49.90,
    pricePerCredit: 49.90,
    popular: true,
    badge: 'Completa'
  },
  {
    id: 'pack_3',
    name: 'Pacote 3 Consultas Completas',
    credits: 3,
    priceBrl: 119.90,
    pricePerCredit: 39.96,
    badge: 'Economia'
  },
  {
    id: 'pack_5',
    name: 'Pacote 5 Consultas Completas',
    credits: 5,
    priceBrl: 179.90,
    pricePerCredit: 35.98,
    badge: 'Mais Vendido'
  },
  {
    id: 'pack_10',
    name: 'Pacote 10 Consultas Completas',
    credits: 10,
    priceBrl: 299.90,
    pricePerCredit: 29.99,
    badge: 'Maior Desconto'
  }
];

export function updatePrices(newPrices: PlanPricing[]) {
  PRODUCT_PRICES = newPrices;
}

export function updateCreditPackages(newPackages: CreditPackage[]) {
  CREDIT_PACKAGES = newPackages;
}
