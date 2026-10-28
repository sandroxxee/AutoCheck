import { VehicleDataProvider, ProviderResponse, CompleteVehicleData } from './VehicleDataProvider.ts';
import { APIBrasilProvider } from './ApiBrasilProvider.ts';
import { ProviderConfig } from '../../shared/types/index.ts';
import { captureApiException, trackApiPerformance } from '../services/sentry.ts';

export interface ProviderItem {
  id: string;
  instance: VehicleDataProvider;
  enabled: boolean;
  priority: number;
  modules: string[];
  cost: number;
}

const apiBrasil = new APIBrasilProvider();
export const providers: ProviderItem[] = [{
  id: 'apibrasil',
  instance: apiBrasil,
  enabled: true,
  priority: 1,
  modules: [...apiBrasil.config.supports],
  cost: apiBrasil.config.costEstimateBrl
}];

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers = new Map<string, VehicleDataProvider>();
  private overrides = new Map<string, Partial<ProviderConfig>>();
  private circuitBreakers = new Map<string, { failures: number; lastFailureTime: number; isOpen: boolean }>();

  private constructor() {
    for (const item of providers) this.register(item.instance);
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) ProviderRegistry.instance = new ProviderRegistry();
    return ProviderRegistry.instance;
  }

  private configFor(provider: VehicleDataProvider): ProviderConfig {
    return { ...provider.config, ...this.overrides.get(provider.config.id) };
  }

  public register(provider: VehicleDataProvider): void {
    if (provider.config.id !== 'apibrasil') {
      throw new Error('Somente APIBrasil pode ser registrada neste ambiente.');
    }
    this.providers.set(provider.config.id, provider);
    if (!this.circuitBreakers.has(provider.config.id)) {
      this.circuitBreakers.set(provider.config.id, { failures: 0, lastFailureTime: 0, isOpen: false });
    }
  }

  public getProvider(id: string): VehicleDataProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).map(p => this.configFor(p));
  }

  public updateProviderConfig(id: string, updates: Partial<ProviderConfig>): boolean {
    if (!this.providers.has(id)) return false;
    const { id: ignoredId, ...safeUpdates } = updates;
    this.overrides.set(id, { ...this.overrides.get(id), ...safeUpdates });
    return true;
  }

  // Segundo argumento mantido por compatibilidade; nunca habilita simuladores.
  public getProvidersForModule(moduleName: string, _legacyPreferMock = false): VehicleDataProvider[] {
    return Array.from(this.providers.values()).filter(provider => {
      const config = this.configFor(provider);
      if (config.id !== 'apibrasil' || !config.enabled || !config.supports.includes(moduleName)) return false;
      const cb = this.circuitBreakers.get(config.id);
      if (cb?.isOpen) {
        if (Date.now() - cb.lastFailureTime <= 30000) return false;
        cb.isOpen = false;
        cb.failures = 0;
      }
      return true;
    }).sort((a, b) => this.configFor(a).priority - this.configFor(b).priority);
  }

  public async executeWithFallback<T>(
    moduleName: string,
    queryFn: (provider: VehicleDataProvider) => Promise<ProviderResponse<T>>,
    defaultUnavailableMessage = 'Informação não disponibilizada pela APIBrasil.',
    _legacyPreferMock = false
  ): Promise<ProviderResponse<T>> {
    const candidates = this.getProvidersForModule(moduleName);
    let errorMessage = defaultUnavailableMessage;
    for (const provider of candidates) {
      const config = this.configFor(provider);
      const start = Date.now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          queryFn(provider),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('Tempo de resposta da APIBrasil excedido.')), config.timeoutMs || 9000);
          })
        ]);
        if (!result || typeof result !== 'object' || result.success !== true || result.status !== 'success' || result.data == null || result.sourceId !== 'apibrasil') {
          throw new Error(result?.errorMessage || defaultUnavailableMessage);
        }
        const cb = this.circuitBreakers.get(config.id);
        if (cb) { cb.failures = 0; cb.isOpen = false; }
        trackApiPerformance(config.name, moduleName, Date.now() - start, true);
        return result;
      } catch (err: unknown) {
        errorMessage = err instanceof Error ? err.message : defaultUnavailableMessage;
        const cb = this.circuitBreakers.get(config.id);
        if (cb) {
          cb.failures += 1;
          cb.lastFailureTime = Date.now();
          if (cb.failures >= 5) cb.isOpen = true;
        }
        captureApiException(new Error(errorMessage), {
          provider: config.name,
          endpoint: moduleName,
          extras: { latencyMs: Date.now() - start }
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    return {
      success: false,
      sourceId: 'apibrasil',
      sourceName: 'APIBrasil',
      latencyMs: 0,
      status: 'unavailable',
      errorMessage
    };
  }

  public estimateQueryCost(modules: string[]): number {
    let total = 0;
    for (const moduleName of modules) {
      const provider = this.getProvidersForModule(moduleName)[0];
      if (provider) total += this.configFor(provider).costEstimateBrl;
    }
    return Number(total.toFixed(2));
  }

  public async consultarCompleto(plate: string, _legacyIsDemo = false): Promise<ProviderResponse<CompleteVehicleData>> {
    return this.executeWithFallback<CompleteVehicleData>(
      'basic',
      p => p.consultarCompleto ? p.consultarCompleto(plate) : Promise.resolve({
        success: false,
        sourceId: 'apibrasil',
        sourceName: 'APIBrasil',
        latencyMs: 0,
        status: 'unavailable'
      }),
      'Consulta unificada completa indisponível na APIBrasil.'
    );
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
