import { VehicleDataProvider, ProviderResponse, CompleteVehicleData } from './VehicleDataProvider.ts';
import { MockProvider } from './MockProvider.ts';
import { SinespProvider } from './SinespProvider.ts';
import { CommercialProvider } from './CommercialProvider.ts';
import { SenatranProvider } from './SenatranProvider.ts';
import { APIBrasilProvider } from './ApiBrasilProvider.ts';
import { BrasilApiProvider } from './BrasilApiProvider.ts';
import { ProviderConfig } from '../../shared/types/index.ts';

export interface ProviderItem {
  id: string;
  instance: VehicleDataProvider;
  enabled: boolean;
  priority: number;
  modules: string[];
  cost: number;
}

export const providers: ProviderItem[] = [
  {
    id: "apibrasil",
    instance: new APIBrasilProvider(),
    enabled: true,
    priority: 1, // tenta primeiro
    modules: ["basic", "theft", "financing", "accident", "auction", "fines", "administrativeRestrictions"], // APIBrasil cobre dados cadastrais, furto, gravame, sinistro, leilão, multas e restrições
    cost: 0.45
  },
  {
    id: "brasilapi",
    instance: new BrasilApiProvider(),
    enabled: true,
    priority: 2,
    modules: ["basic", "theft"],
    cost: 0.00
  },
  {
    id: "mock",
    instance: new MockProvider(),
    enabled: true,
    priority: 99,
    modules: ["basic", "theft", "financing", "accident", "auction", "fines", "administrativeRestrictions"],
    cost: 0
  }
];

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, VehicleDataProvider> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailureTime: number; isOpen: boolean }> = new Map();

  private constructor() {
    this.registerDefaultProviders();
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  private registerDefaultProviders() {
    // Registra os provedores prioritários definidos na lista principal
    for (const item of providers) {
      if (item.instance.config) {
        Object.assign(item.instance.config, {
          id: item.id,
          enabled: item.enabled,
          priority: item.priority,
          supports: item.modules,
          costEstimateBrl: item.cost
        });
      }
      this.register(item.instance);
    }

    // Provedores oficiais/comerciais complementares para fallback
    const commercial = new CommercialProvider();
    this.register(commercial);

    const sinesp = new SinespProvider();
    this.register(sinesp);

    const senatran = new SenatranProvider();
    this.register(senatran);
  }

  public register(provider: VehicleDataProvider): void {
    this.providers.set(provider.config.id, provider);
    if (!this.circuitBreakers.has(provider.config.id)) {
      this.circuitBreakers.set(provider.config.id, { failures: 0, lastFailureTime: 0, isOpen: false });
    }
  }

  public getProvider(id: string): VehicleDataProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).map(p => ({ ...p.config }));
  }

  public updateProviderConfig(id: string, updates: Partial<ProviderConfig>): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;
    Object.assign(provider.config, updates);
    return true;
  }

  /**
   * Returns list of active providers capable of providing the specified module,
   * sorted by priority (lowest number = highest priority).
   */
  public getProvidersForModule(moduleName: string, preferMock: boolean = false): VehicleDataProvider[] {
    const list: VehicleDataProvider[] = [];
    for (const provider of this.providers.values()) {
      if (provider.config.enabled && provider.config.supports.includes(moduleName)) {
        // Check circuit breaker status
        const cb = this.circuitBreakers.get(provider.config.id);
        if (cb && cb.isOpen) {
          // Reset after 30 seconds
          if (Date.now() - cb.lastFailureTime > 30000) {
            cb.isOpen = false;
            cb.failures = 0;
            list.push(provider);
          }
        } else {
          list.push(provider);
        }
      }
    }
    return list.sort((a, b) => {
      if (preferMock) {
        if (a.config.id === 'mock') return -1;
        if (b.config.id === 'mock') return 1;
      }
      return a.config.priority - b.config.priority;
    });
  }

  /**
   * Executes a module query across prioritized providers with automatic fallback,
   * timeout handling, and failure circuit breakers.
   */
  public async executeWithFallback<T>(
    moduleName: string,
    queryFn: (provider: VehicleDataProvider) => Promise<ProviderResponse<T>>,
    defaultUnavailableMessage = 'Informação não disponível nesta fonte.',
    preferMock = false
  ): Promise<ProviderResponse<T>> {
    const candidateProviders = this.getProvidersForModule(moduleName, preferMock);

    if (preferMock) {
      const mockProvider = candidateProviders.find(p => p.config.id === 'mock');
      if (mockProvider) {
        return queryFn(mockProvider);
      }
    }

    if (candidateProviders.length === 0) {
      return {
        success: false,
        sourceId: 'none',
        sourceName: 'Nenhum provedor ativo',
        latencyMs: 0,
        status: 'unavailable',
        errorMessage: defaultUnavailableMessage
      };
    }

    let lastError = '';
    let primaryConfiguredError = '';
    let lastSourceId = 'all_failed';
    let lastSourceName = 'Todas as fontes consultadas';

    for (const provider of candidateProviders) {
      const start = Date.now();
      try {
        // Timeout wrapper with timer cleanup
        const timeoutMs = provider.config.timeoutMs || (provider as any).timeout || 8000;
        let timer: any;
        const responsePromise = queryFn(provider);
        const timeoutPromise = new Promise<any>((_, reject) => {
          timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
        });

        const rawResult = await Promise.race([responsePromise, timeoutPromise]).finally(() => {
          if (timer) clearTimeout(timer);
        }) as any;
        if (!rawResult) continue;

        // Check if provider indicated not covered
        if (rawResult.status === 'NAO_COBERTO_PELO_PROVEDOR') {
          continue;
        }

        let response: ProviderResponse<T>;
        if (typeof rawResult === 'object' && 'success' in rawResult && 'status' in rawResult) {
          response = rawResult as ProviderResponse<T>;
        } else {
          let formattedData: any = rawResult;
          if (moduleName === 'theft') {
            const theftStr = typeof rawResult === 'string' ? rawResult : (rawResult.status || '');
            const hasTheft = theftStr.includes('RESTRIÇÃO') || theftStr.includes('RESTRICAO');
            formattedData = {
              status: hasTheft ? 'RESTRICAO_ENCONTRADA' : 'NADA_CONSTA',
              mensagem: hasTheft
                ? 'Alerta ativo de roubo/furto detectado em base policial.'
                : 'Nada consta nas bases policiais integradas.',
              dataConsulta: new Date().toISOString()
            };
          }

          response = {
            success: true,
            sourceId: provider.config.id,
            sourceName: provider.config.name,
            latencyMs: Date.now() - start,
            status: 'success',
            data: formattedData
          };
        }

        if (response.success && response.data) {
          // Reset failure count on success
          const cb = this.circuitBreakers.get(provider.config.id);
          if (cb) cb.failures = 0;
          return response;
        }

        if (response.errorMessage) {
          if (!primaryConfiguredError || provider.config.priority === 1) {
            primaryConfiguredError = response.errorMessage;
          }
          lastError = response.errorMessage;
          lastSourceId = provider.config.id;
          lastSourceName = provider.config.name;
        }
      } catch (err: unknown) {
        const errorMsg = (err as Error).message;
        if (!primaryConfiguredError || provider.config.priority === 1) {
          primaryConfiguredError = errorMsg;
        }
        lastError = errorMsg;
        lastSourceId = provider.config.id;
        lastSourceName = provider.config.name;
        const cb = this.circuitBreakers.get(provider.config.id);
        if (cb) {
          cb.failures += 1;
          cb.lastFailureTime = Date.now();
          if (cb.failures >= 5) {
            cb.isOpen = true;
          }
        }
        console.warn(`[AutoCheck] Provider fallback triggered for ${provider.config.name} (${moduleName}):`, (err as Error).message);
        // Continue to next provider in priority chain
      }
    }

    return {
      success: false,
      sourceId: lastSourceId,
      sourceName: lastSourceName,
      latencyMs: 0,
      status: 'unavailable',
      errorMessage: primaryConfiguredError || lastError || defaultUnavailableMessage
    };
  }

  public estimateQueryCost(modules: string[]): number {
    let total = 0;
    for (const mod of modules) {
      const providers = this.getProvidersForModule(mod);
      if (providers.length > 0) {
        total += providers[0].config.costEstimateBrl;
      }
    }
    return Number(total.toFixed(2));
  }

  /**
   * Executa a consulta completa de veículo com fallback automático entre provedores homologados.
   * Exemplo de uso:
   *   const dados = await providerRegistry.consultarCompleto(placa);
   */
  public async consultarCompleto(plate: string, isDemo = false): Promise<ProviderResponse<CompleteVehicleData>> {
    return this.executeWithFallback<CompleteVehicleData>(
      'basic',
      p => p.consultarCompleto ? p.consultarCompleto(plate) : Promise.resolve({
        success: false,
        sourceId: 'none',
        sourceName: 'None',
        latencyMs: 0,
        status: 'unavailable'
      }),
      'Consulta unificada completa indisponível no momento.',
      isDemo
    );
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
