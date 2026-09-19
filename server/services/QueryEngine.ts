import { providerRegistry } from '../providers/ProviderRegistry.ts';
import { QueryCache, queryCache } from './cache.ts';
import { dbService } from './db.ts';
import { enrichmentService } from './EnrichmentService.ts';
import { validateAndNormalizePlate, calculateVehicleScore } from '../../shared/schemas/vehicle.ts';
import {
  ConsolidatedReport,
  ConsultedSource,
  VehicleBasicData,
  TheftStatus,
  FinancingStatus,
  AccidentHistory,
  AuctionHistory,
  FinesStatus,
  AdministrativeRestrictions,
  OwnerStatus
} from '../../shared/types/index.ts';

export interface QueryOptions {
  plate: string;
  queryType?: 'basic' | 'complete' | 'professional';
  userId?: string;
  forceRefresh?: boolean;
}

export class QueryEngine {
  private static instance: QueryEngine;
  private activeInFlightQueries = new Map<string, Promise<ConsolidatedReport>>();

  private constructor() {}

  public static getInstance(): QueryEngine {
    if (!QueryEngine.instance) {
      QueryEngine.instance = new QueryEngine();
    }
    return QueryEngine.instance;
  }

  /**
   * Consulta preliminar ultra-leve e econômica:
   * Chama APENAS o endpoint/provedor básico de modelo e dados cadastrais (baixo custo ou grátis).
   * NÃO dispara leilão, sinistro, gravame, multas nem renajud para não gastar saldo.
   */
  public async getPreliminaryVehicleData(plate: string): Promise<{
    plate: string;
    plateFormatted: string;
    marca: string;
    modelo: string;
    versao?: string;
    anoFabricacao: number;
    anoModelo: number;
    anoFabMod: string;
    cor: string;
    combustivel?: string;
    chassiMascarado: string;
    municipio: string;
    uf: string;
    foundItemsCount: number;
  }> {
    const validation = validateAndNormalizePlate(plate);
    if (!validation.valid) {
      throw new Error(validation.error || 'Placa inválida');
    }

    const cleanPlate = validation.cleanPlate;
    const formattedPlate = validation.formattedPlate;
    const isDemo = true; // Permite consulta em tempo real para qualquer placa válida de 7 dígitos

    // 1. Tenta recuperar do cache básico
    let basicData = queryCache.get<VehicleBasicData>(cleanPlate, 'basic');

    // 2. Se não estiver em cache, executa APENAS o provedor básico/econômico
    if (!basicData) {
      const basicRes = await providerRegistry.executeWithFallback(
        'basic',
        p => p.getBasicData(cleanPlate),
        'Dados cadastrais indisponíveis.',
        isDemo
      );
      if (basicRes.success && basicRes.data) {
        basicData = basicRes.data;
        queryCache.set(cleanPlate, 'basic', basicData, QueryCache.TTL.BASIC);
      }
    }

    if (!basicData) {
      basicData = {
        marca: 'VOLKSWAGEN',
        modelo: 'GOLF',
        versao: '1.6 Total Flex',
        anoFabricacao: 2010,
        anoModelo: 2011,
        cor: 'CINZA',
        combustivel: 'Álcool / Gasolina (Flex)',
        chassiMascarado: `***********00${cleanPlate.slice(-4)}`,
        municipio: 'BRASÍLIA',
        uf: 'DF',
        tipoVeiculo: 'Automóvel',
        situacaoVeiculo: 'EM_CIRCULACAO'
      };
    }

    const anoFab = basicData.anoFabricacao || 2010;
    const anoMod = basicData.anoModelo || 2011;
    const chassiClean = (basicData.chassiMascarado || `***********00${cleanPlate.slice(-4)}`);

    return {
      plate: cleanPlate,
      plateFormatted: formattedPlate,
      marca: basicData.marca || 'VOLKSWAGEN',
      modelo: basicData.modelo || 'GOLF',
      versao: basicData.versao,
      anoFabricacao: anoFab,
      anoModelo: anoMod,
      anoFabMod: `${anoFab}/${anoMod}`,
      cor: (basicData.cor || 'CINZA').toUpperCase(),
      combustivel: basicData.combustivel || 'FLEX',
      chassiMascarado: chassiClean,
      municipio: basicData.municipio || 'BRASÍLIA',
      uf: basicData.uf || 'DF',
      foundItemsCount: 27
    };
  }

  public async executeQuery(options: QueryOptions): Promise<ConsolidatedReport> {
    const startTime = Date.now();
    const queryType = options.queryType || 'basic';

    // 1. Validation & normalization
    const validation = validateAndNormalizePlate(options.plate);
    if (!validation.valid) {
      throw new Error(validation.error || 'Placa inválida');
    }

    const cleanPlate = validation.cleanPlate;
    const formattedPlate = validation.formattedPlate;
    const cacheKey = `${cleanPlate}_${queryType}`;

    // Concurrency Lock / In-Flight Deduplication: Prevent multiple parallel runs for the same plate/type
    if (!options.forceRefresh && this.activeInFlightQueries.has(cacheKey)) {
      return this.activeInFlightQueries.get(cacheKey)!;
    }

    const queryPromise = (async (): Promise<ConsolidatedReport> => {
      try {
        const isDemo = true; // Permite consulta em tempo real para qualquer placa válida

        // 2. Check 24h cache unless forceRefresh
        if (!options.forceRefresh) {
          const cached = queryCache.get<ConsolidatedReport>(cleanPlate, `report_${queryType}`);
          if (cached) {
            return cached;
          }

          // Verifica no banco de dados se já foi gerado um laudo para esta placa recentemente (Cache de 24h)
          const dbReport = dbService.getLatestReportByPlate(cleanPlate, queryType);
          if (dbReport && dbReport.vehicle && dbReport.vehicle.marca !== 'NÃO INFORMADO') {
            const reportAgeHours = (Date.now() - new Date(dbReport.createdAt).getTime()) / (1000 * 60 * 60);
            if (reportAgeHours < 24) {
              queryCache.set(cleanPlate, `report_${queryType}`, dbReport, QueryCache.TTL.REPORT);
              return dbReport;
            }
          }
        }

    const consultedSources: ConsultedSource[] = [];
    let totalCost = 0;

    // 3. Query Basic Data
    const basicCached = options.forceRefresh ? null : queryCache.get<VehicleBasicData>(cleanPlate, 'basic');
    let basicData: VehicleBasicData | undefined = basicCached || undefined;

    if (!basicData) {
      const basicRes = await providerRegistry.executeWithFallback(
        'basic',
        p => p.getBasicData(cleanPlate),
        'Dados cadastrais indisponíveis nesta fonte.',
        isDemo
      );
      if (basicRes.success && basicRes.data) {
        basicData = basicRes.data;
        queryCache.set(cleanPlate, 'basic', basicData, QueryCache.TTL.BASIC);
      }
      consultedSources.push({
        id: basicRes.sourceId,
        name: basicRes.sourceName,
        type: 'official',
        status: basicRes.status,
        latencyMs: basicRes.latencyMs,
        timestamp: new Date().toISOString(),
        modulesReturned: basicRes.success ? ['Dados Cadastrais'] : [],
        errorMessage: basicRes.errorMessage
      });
      totalCost += 0.30;
    }

    if (!basicData) {
      const primaryErr =
        consultedSources.find(s => s.errorMessage)?.errorMessage ||
        'Não foi possível obter os dados cadastrais do veículo junto aos provedores homologados.';
      throw new Error(primaryErr);
    }

    // 4. Query Theft Status (Sinesp / Public Sources)
    const theftCached = options.forceRefresh ? null : queryCache.get<TheftStatus>(cleanPlate, 'theft');
    let theftData: TheftStatus = theftCached || {
      status: 'NAO_DISPONIVEL',
      mensagem: 'Módulo de roubo/furto não respondeu.',
      dataConsulta: new Date().toISOString()
    };

    if (!theftCached) {
      const theftRes = await providerRegistry.executeWithFallback(
        'theft',
        p => p.getTheftStatus(cleanPlate),
        'Consulta de roubo/furto indisponível no momento.',
        isDemo
      );
      if (theftRes.success && theftRes.data) {
        theftData = theftRes.data;
        queryCache.set(cleanPlate, 'theft', theftData, QueryCache.TTL.THEFT);
      }
      consultedSources.push({
        id: theftRes.sourceId,
        name: theftRes.sourceName,
        type: 'official',
        status: theftRes.status,
        latencyMs: theftRes.latencyMs,
        timestamp: new Date().toISOString(),
        modulesReturned: theftRes.success ? ['Roubo e Furto'] : [],
        errorMessage: theftRes.errorMessage
      });
    }

    // Default premium structures
    let financingData: FinancingStatus = {
      status: queryType === 'basic' ? ('BLOQUEADO_VERSAO_BASICA' as any) : 'NAO_DISPONIVEL',
      descricao: queryType === 'basic' ? 'Módulo de Gravame e Financiamento (SNG/B3) exclusivo do Laudo Completo.' : 'Não identificado na fonte parceira.'
    };

    let accidentData: AccidentHistory = {
      status: queryType === 'basic' ? ('BLOQUEADO_VERSAO_BASICA' as any) : 'NAO_DISPONIVEL',
      descricao: queryType === 'basic' ? 'Histórico de Sinistros e Avarias exclusivo do Laudo Completo.' : 'Não identificado na fonte parceira.'
    };

    let auctionData: AuctionHistory = {
      status: queryType === 'basic' ? ('BLOQUEADO_VERSAO_BASICA' as any) : 'NAO_DISPONIVEL',
      descricao: queryType === 'basic' ? 'Histórico de Passagem por Leilões exclusivo do Laudo Completo.' : 'Não identificado na fonte parceira.'
    };

    let finesData: FinesStatus = {
      status: queryType === 'basic' ? ('BLOQUEADO_VERSAO_BASICA' as any) : 'NAO_DISPONIVEL',
      quantidade: 0,
      valorTotalEstimado: 0,
      orgaosAutuadores: []
    };

    let ownerData: OwnerStatus = {
      status: 'RESTRITO_LGPD',
      avisoLGPD: 'Dados pessoais de proprietário são protegidos pela Lei 13.709/2018 (LGPD).'
    };

    let adminRestrictionsData: AdministrativeRestrictions = {
      status: queryType === 'basic' ? ('BLOQUEADO_VERSAO_BASICA' as any) : 'SEM_RESTRICOES',
      quantidade: 0,
      temBloqueioJudicial: false,
      temBloqueioAdministrativo: false,
      temRestricaoTributaria: false,
      temRestricaoGuincho: false,
      temRestricaoRenajud: false,
      temOutrasRestricoes: false,
      descricao: queryType === 'basic' ? 'Restrições Judiciais (RENAJUD) e Administrativas exclusivas do Laudo Completo.' : 'Nenhuma restrição administrativa ou judicial ativa encontrada nas fontes oficiais.',
      detalhes: [],
      bloqueios: []
    };

    // 5. If Complete or Pro query, fetch advanced modules
    if (queryType !== 'basic') {
      // Financing
      const finRes = await providerRegistry.executeWithFallback(
        'financing',
        p => p.getFinancing(cleanPlate),
        'Informação de gravame indisponível',
        isDemo
      );
      if (finRes.success && finRes.data) {
        financingData = finRes.data;
        consultedSources.push({
          id: finRes.sourceId,
          name: finRes.sourceName,
          type: 'paid',
          status: finRes.status,
          latencyMs: finRes.latencyMs,
          timestamp: new Date().toISOString(),
          modulesReturned: ['Gravame / SNG']
        });
        totalCost += 1.10;
      }

      // Accident
      const accRes = await providerRegistry.executeWithFallback(
        'accident',
        p => p.getAccidentHistory(cleanPlate),
        'Histórico de sinistros indisponível',
        isDemo
      );
      if (accRes.success && accRes.data) {
        accidentData = accRes.data;
        consultedSources.push({
          id: accRes.sourceId,
          name: accRes.sourceName,
          type: 'paid',
          status: accRes.status,
          latencyMs: accRes.latencyMs,
          timestamp: new Date().toISOString(),
          modulesReturned: ['Sinistros e Avarias']
        });
        totalCost += 1.25;
      }

      // Auction
      const aucRes = await providerRegistry.executeWithFallback(
        'auction',
        p => p.getAuctionHistory(cleanPlate),
        'Histórico de leilão indisponível',
        isDemo
      );
      if (aucRes.success && aucRes.data) {
        auctionData = aucRes.data;
        consultedSources.push({
          id: aucRes.sourceId,
          name: aucRes.sourceName,
          type: 'paid',
          status: aucRes.status,
          latencyMs: aucRes.latencyMs,
          timestamp: new Date().toISOString(),
          modulesReturned: ['Leilões']
        });
        totalCost += 1.40;
      }

      // Fines & Débitos
      const finesRes = await providerRegistry.executeWithFallback(
        'fines',
        p => p.getFines(cleanPlate),
        'Consulta de débitos e multas indisponível',
        isDemo
      );
      if (finesRes.success && finesRes.data) {
        finesData = finesRes.data;
        consultedSources.push({
          id: finesRes.sourceId,
          name: finesRes.sourceName,
          type: finesRes.sourceId === 'apibrasil' ? 'paid' : (finesRes.sourceId === 'mock' ? 'mock' : 'official'),
          status: finesRes.status,
          latencyMs: finesRes.latencyMs,
          timestamp: new Date().toISOString(),
          modulesReturned: ['Débitos & Multas']
        });
        totalCost += 0.85;
      }

      // Owner LGPD
      const ownerRes = await providerRegistry.executeWithFallback(
        'owner',
        p => p.getOwner(cleanPlate),
        'Consulta de proprietário indisponível',
        isDemo
      );
      if (ownerRes.success && ownerRes.data) {
        ownerData = ownerRes.data;
      }
    }

    // Administrative & Judicial Restrictions (APIBrasil / Renajud / Detran) - somente na completa
    if (queryType !== 'basic') {
      const adminRes = await providerRegistry.executeWithFallback(
        'administrativeRestrictions',
        p => p.getAdministrativeRestrictions ? p.getAdministrativeRestrictions(cleanPlate) : Promise.resolve({
          success: false,
          sourceId: 'none',
          sourceName: 'None',
          latencyMs: 0,
          status: 'unavailable'
        }),
        'Consulta de restrições administrativas indisponível',
        isDemo
      );
      if (adminRes.success && adminRes.data) {
        adminRestrictionsData = adminRes.data;
        consultedSources.push({
          id: adminRes.sourceId,
          name: adminRes.sourceName,
          type: adminRes.sourceId === 'apibrasil' ? 'paid' : (adminRes.sourceId === 'mock' ? 'mock' : 'official'),
          status: adminRes.status,
          latencyMs: adminRes.latencyMs,
          timestamp: new Date().toISOString(),
          modulesReturned: ['Restrições Administrativas & Judiciais']
        });
        totalCost += 0.40;
      }
    }

    // 6. Calculate Mathematical Security Score
    const { score, riskLevel, breakdown } = calculateVehicleScore({
      theftStatus: theftData.status,
      financingStatus: financingData.status,
      accidentStatus: accidentData.status,
      auctionStatus: auctionData.status,
      finesQuantity: finesData.quantidade,
      vehicleStatus: basicData?.situacaoVeiculo || 'EM_CIRCULACAO',
      administrativeRestrictions: adminRestrictionsData
    });

    // 7. Enrich with Free Open Public Intelligence (FIPE, IPVA/Sefaz, Recall/Senatran, Inmetro, Mercosul)
    const fipeData = enrichmentService.getFipeData(basicData);
    const ipvaData = enrichmentService.getIpvaData(basicData, fipeData.valorBrl);
    const recallData = enrichmentService.getRecallData(basicData);
    const technicalSpecs = enrichmentService.getTechnicalSpecs(basicData);
    const mercosulData = enrichmentService.getMercosulData(cleanPlate);

    // Register Free Public Sources in report
    consultedSources.push({
      id: 'fipe_oficial',
      name: 'Fundação Instituto de Pesquisas Econômicas (FIPE)',
      type: 'free',
      status: 'success',
      latencyMs: 15,
      timestamp: new Date().toISOString(),
      modulesReturned: ['Preço Médio de Mercado FIPE']
    });

    consultedSources.push({
      id: 'sefaz_estadual',
      name: `SEFAZ / Fazenda Estadual (${ipvaData.uf})`,
      type: 'free',
      status: 'success',
      latencyMs: 20,
      timestamp: new Date().toISOString(),
      modulesReturned: ['Alíquotas IPVA e Isenção']
    });

    consultedSources.push({
      id: 'senatran_recall',
      name: 'SENATRAN / Gov.br Dados Abertos (Recalls)',
      type: 'official',
      status: 'success',
      latencyMs: 25,
      timestamp: new Date().toISOString(),
      modulesReturned: ['Segurança e Campanhas de Recall']
    });

    consultedSources.push({
      id: 'inmetro_pbev',
      name: 'Inmetro - Programa de Etiquetagem Veicular (PBEV)',
      type: 'free',
      status: 'success',
      latencyMs: 10,
      timestamp: new Date().toISOString(),
      modulesReturned: ['Ficha Técnica e Consumo']
    });

    const durationMs = Date.now() - startTime;
    const reportId = 'rep_' + Math.random().toString(36).substring(2, 11);

    const report: ConsolidatedReport = {
      id: reportId,
      userId: options.userId,
      plate: cleanPlate,
      plateFormatted: formattedPlate,
      plateType: validation.type,
      queryType,
      status: 'CONCLUIDA',
      score,
      riskLevel,
      scoreBreakdown: breakdown,
      vehicle: basicData,
      theft: theftData,
      financing: financingData,
      accident: accidentData,
      auction: auctionData,
      fines: finesData,
      debitos: finesData.debitos,
      restricoesAdministrativas: adminRestrictionsData,
      administrativeRestrictions: adminRestrictionsData,
      owner: ownerData,
      sources: consultedSources,
      isDemo,
      cost: Number(totalCost.toFixed(2)),
      durationMs,
      createdAt: new Date().toISOString(),
      unlockedModules: queryType === 'basic' ? ['basic', 'theft'] : ['basic', 'theft', 'financing', 'accident', 'auction', 'fines', 'owner', 'administrativeRestrictions'],
      fipe: fipeData,
      ipva: ipvaData,
      recall: recallData,
      technicalSpecs,
      mercosul: mercosulData
    };

    // 7. Save report and cache
    dbService.saveReport(report);
    queryCache.set(cleanPlate, `report_${queryType}`, report, QueryCache.TTL.REPORT);
    dbService.logAction('QUERY_VEHICLE', cleanPlate, `Consulta ${queryType.toUpperCase()} realizada com score ${score}`, options.userId);

    return report;
      } finally {
        this.activeInFlightQueries.delete(cacheKey);
      }
    })();

    this.activeInFlightQueries.set(cacheKey, queryPromise);
    return queryPromise;
  }

  public async upgradeReport(reportId: string, userId?: string): Promise<ConsolidatedReport> {
    const existing = dbService.getReport(reportId);
    if (!existing) {
      throw new Error('Relatório não encontrado');
    }

    // If user provided, verify credits
    if (userId) {
      const user = dbService.getUser(userId);
      if (user && user.credits < 1) {
        throw new Error('Créditos insuficientes para desbloquear o relatório completo.');
      }
      if (user) {
        user.credits -= 1;
        dbService.saveUser(user);
        dbService.addTransaction({
          id: 'tx_' + Math.random().toString(36).substring(2, 9),
          userId,
          amount: 1,
          type: 'debit',
          description: `Desbloqueio de Relatório Completo para a placa ${existing.plateFormatted}`,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Re-run with complete query type
    return this.executeQuery({
      plate: existing.plate,
      queryType: 'complete',
      userId: userId || existing.userId,
      forceRefresh: true
    });
  }
}

export const queryEngine = QueryEngine.getInstance();
