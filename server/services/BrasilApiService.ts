import { fipe, cep, cnpj, ddd, banks, taxas, feriados, ibge } from 'brasilapi-sdk';

export interface BrasilApiFipePrice {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  tipoVeiculo: number;
  siglaCombustivel: string;
  dataConsulta: string;
}

export interface BrasilApiCep {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service?: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export interface BrasilApiCnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  descricao_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  telefone?: string;
  email?: string;
  capital_social?: number;
  qsa?: Array<{
    nome_socio: string;
    qualificacao_socio: string;
    faixa_etaria?: string;
  }>;
}

export class BrasilApiService {
  private static instance: BrasilApiService;
  private cache = new Map<string, { timestamp: number; data: any }>();
  private CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas de cache para dados públicos

  private constructor() {}

  public static getInstance(): BrasilApiService {
    if (!BrasilApiService.instance) {
      BrasilApiService.instance = new BrasilApiService();
    }
    return BrasilApiService.instance;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data as T;
    }
    return null;
  }

  private setInCache(key: string, data: any): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }

  /**
   * 1. Consulta Preço na Tabela FIPE por Código FIPE (100% Gratuito via BrasilAPI)
   */
  public async getFipePreco(codigoFipe: string): Promise<BrasilApiFipePrice[]> {
    const cleanCode = codigoFipe.replace(/[^0-9-]/g, '').trim();
    if (!cleanCode) throw new Error('Código FIPE inválido.');

    const cacheKey = `fipe_${cleanCode}`;
    const cached = this.getFromCache<BrasilApiFipePrice[]>(cacheKey);
    if (cached) return cached;

    try {
      // 1. Tenta via SDK oficial
      const fipeModule = fipe();
      const result: any = await fipeModule.getPrecoVeiculo(cleanCode);
      if (Array.isArray(result) && result.length > 0) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] Fipe error, fallbacking to direct HTTP endpoint:', (sdkError as Error).message);
    }

    // 2. Fallback resiliente via HTTP direto à BrasilAPI
    try {
      const res = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${encodeURIComponent(cleanCode)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`BrasilAPI FIPE retornou status ${res.status}`);
      }
      const json: any = await res.json();
      const list = Array.isArray(json) ? json : [json];
      this.setInCache(cacheKey, list);
      return list;
    } catch (err: unknown) {
      throw new Error((err as Error).message || 'Falha ao consultar preço FIPE na BrasilAPI.');
    }
  }

  /**
   * 2. Consulta Marcas FIPE (carros, motos ou caminhoes)
   */
  public async getFipeMarcas(tipoVeiculo: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<Array<{ nome: string; valor: string }>> {
    const cacheKey = `fipe_marcas_${tipoVeiculo}`;
    const cached = this.getFromCache<Array<{ nome: string; valor: string }>>(cacheKey);
    if (cached) return cached;

    try {
      const fipeModule = fipe();
      const result: any = await fipeModule.getMarcas(tipoVeiculo as any);
      if (Array.isArray(result) && result.length > 0) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] Fipe marcas error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch(`https://brasilapi.com.br/api/fipe/marcas/v1/${tipoVeiculo}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Falha ao obter marcas FIPE (${res.status})`);
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }

  /**
   * 3. Consulta de CEP (Geolocalização, Logradouro, Bairro e Cidade)
   */
  public async getCep(cepInput: string): Promise<BrasilApiCep> {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) throw new Error('CEP deve conter 8 dígitos numéricos.');

    const cacheKey = `cep_${cleanCep}`;
    const cached = this.getFromCache<BrasilApiCep>(cacheKey);
    if (cached) return cached;

    try {
      const cepModule = cep();
      const result: any = await cepModule.getCepV2(cleanCep).catch(() => cepModule.getCep(cleanCep));
      if (result && result.city) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] CEP error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
      headers: { 'Accept': 'application/json' }
    }).catch(() => fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`));

    if (!res.ok) throw new Error(`CEP ${cleanCep} não encontrado na base nacional.`);
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }

  /**
   * 4. Consulta de CNPJ (Receita Federal, Situação, Sócios QSA e CNAE)
   */
  public async getCnpj(cnpjInput: string): Promise<BrasilApiCnpj> {
    const cleanCnpj = cnpjInput.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) throw new Error('CNPJ deve conter 14 dígitos.');

    const cacheKey = `cnpj_${cleanCnpj}`;
    const cached = this.getFromCache<BrasilApiCnpj>(cacheKey);
    if (cached) return cached;

    try {
      const cnpjModule = cnpj();
      const result: any = await cnpjModule.getCnpj(cleanCnpj);
      if (result && result.razao_social) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] CNPJ error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`CNPJ ${cleanCnpj} não encontrado na Receita Federal.`);
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }

  /**
   * 5. Consulta de DDD (Estado e Cidades cobertas)
   */
  public async getDdd(dddInput: number | string): Promise<{ state: string; cities: string[] }> {
    const num = typeof dddInput === 'string' ? parseInt(dddInput.replace(/\D/g, ''), 10) : dddInput;
    if (!num || isNaN(num)) throw new Error('DDD inválido.');

    const cacheKey = `ddd_${num}`;
    const cached = this.getFromCache<{ state: string; cities: string[] }>(cacheKey);
    if (cached) return cached;

    try {
      const dddModule = ddd();
      const result: any = await dddModule.getDDD(num);
      if (result && result.state) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] DDD error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch(`https://brasilapi.com.br/api/ddd/v1/${num}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`DDD ${num} não encontrado.`);
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }

  /**
   * 6. Consulta de Taxas Financeiras (CDI, Selic, IPCA)
   */
  public async getTaxas(): Promise<Array<{ nome: string; valor: number }>> {
    const cacheKey = 'taxas_mercado';
    const cached = this.getFromCache<Array<{ nome: string; valor: number }>>(cacheKey);
    if (cached) return cached;

    try {
      const taxasModule = taxas();
      const result: any = await taxasModule.getAllTaxas();
      if (Array.isArray(result) && result.length > 0) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] Taxas error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch('https://brasilapi.com.br/api/taxas/v1', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Falha ao obter taxas de mercado.');
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }

  /**
   * 7. Consulta de Bancos Nacionais (Código COMPE e ISPB)
   */
  public async getBanks(): Promise<Array<{ ispb: string; name: string; code: number; fullName: string }>> {
    const cacheKey = 'bancos_brasil';
    const cached = this.getFromCache<Array<{ ispb: string; name: string; code: number; fullName: string }>>(cacheKey);
    if (cached) return cached;

    try {
      const banksModule = banks();
      const result: any = await banksModule.getBanks();
      if (Array.isArray(result) && result.length > 0) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] Banks error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch('https://brasilapi.com.br/api/banks/v1', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Falha ao obter lista de bancos.');
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }

  /**
   * 8. Consulta de Feriados Nacionais
   */
  public async getFeriados(ano?: number): Promise<Array<{ date: string; name: string; type: string }>> {
    const targetYear = ano || new Date().getFullYear();
    const cacheKey = `feriados_${targetYear}`;
    const cached = this.getFromCache<Array<{ date: string; name: string; type: string }>>(cacheKey);
    if (cached) return cached;

    try {
      const feriadosModule = feriados();
      const result: any = await feriadosModule.getFeriadosByAno(targetYear);
      if (Array.isArray(result) && result.length > 0) {
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (sdkError) {
      console.warn('[BrasilAPI SDK] Feriados error, falling back:', (sdkError as Error).message);
    }

    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${targetYear}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Falha ao obter feriados nacionais.');
    const json: any = await res.json();
    this.setInCache(cacheKey, json);
    return json;
  }
}

export const brasilApiService = BrasilApiService.getInstance();
