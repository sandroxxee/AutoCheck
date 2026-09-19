import { PlanPricing, CreditPackage } from '../../shared/types/index.ts';

export let PRODUCT_PRICES: PlanPricing[] = [
  {
    id: 'complete',
    name: 'Consulta Completa 360° de Histórico Veicular',
    priceBrl: 49.90,
    highlight: true,
    description: 'Histórico veicular 360° completo com gravames, multas, sinistros, leilão, restrições e emissão de relatório em PDF.',
    ctaText: 'Consultar Histórico Completo (R$ 49,90)',
    features: [
      'Dados cadastrais oficiais (marca, modelo, ano, cor, combustível, chassi/motor)',
      'Checagem oficial de Roubo e Furto (SINESP)',
      'Gravames, Financiamento e Alienação Fiduciária (SNG/B3)',
      'Débitos, Autuações e Infrações em aberto (Renainf)',
      'Histórico de Sinistro (Pequena, Média e Grande monta)',
      'Passagens por Leilões de Seguradoras e Bancos',
      'Score de Segurança e Procedência (0 a 100)',
      'Emissão de Relatório Informativo em PDF',
      'Histórico de consultas salvo na sua conta'
    ]
  },
  {
    id: 'pro',
    name: 'Plano Frotista / Lotes',
    priceBrl: 149.90,
    description: 'Para revendas, despachantes, concessionárias e frotistas com maior volume de consultas.',
    ctaText: 'Adquirir Pacote Pro',
    features: [
      'Consultas completas com o menor custo unitário',
      'Painel multi-usuário com exportação de dados',
      'Acesso à API REST para integração',
      'Consultas e relatórios informativos em lote',
      'Suporte prioritário dedicado',
      'Créditos válidos sem expiração'
    ]
  }
];

export let CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack_complete',
    name: '1 Consulta Completa',
    credits: 1,
    priceBrl: 49.90,
    pricePerCredit: 49.90,
    popular: true,
    badge: 'Unidade'
  },
  {
    id: 'pack_3',
    name: 'Pacote 3 Consultas',
    credits: 3,
    priceBrl: 119.90,
    pricePerCredit: 39.96,
    badge: 'Economia'
  },
  {
    id: 'pack_5',
    name: 'Pacote 5 Consultas',
    credits: 5,
    priceBrl: 179.90,
    pricePerCredit: 35.98,
    badge: 'Mais Vendido'
  },
  {
    id: 'pack_10',
    name: 'Pacote 10 Consultas',
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
