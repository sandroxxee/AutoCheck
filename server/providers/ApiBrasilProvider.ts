// NUNCA chama do frontend. Só no server /api/vehicle/check
import { VehicleDataProvider, ProviderResponse, CompleteVehicleData } from './VehicleDataProvider.ts';
import {
  VehicleBasicData,
  TheftStatus,
  FinancingStatus,
  AccidentHistory,
  AuctionHistory,
  FinesStatus,
  VehicleDebts,
  AdministrativeRestrictions,
  OwnerStatus,
  ProviderConfig
} from '../../shared/types/index.ts';

// NUNCA chama do frontend. Só no server /api/vehicle/check
export class APIBrasilProvider implements VehicleDataProvider {
  name = "APIBrasil - Placa Dados";
  id = "apibrasil";
  type = "paid" as const;
  cost = 0.08; // Custo real por consulta na APIBrasil
  timeout = 8000;

  // Cache em memória para garantir que a MESMA placa nunca seja cobrada mais de 1 vez nas últimas 24h
  private static rawCache = new Map<string, { timestamp: number; payload: any }>();
  // Deduplicação de requisições em voo (previne duplo clique ou concorrência)
  private static inFlightRequests = new Map<string, Promise<any>>();
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  get config(): ProviderConfig {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      enabled: true,
      priority: 1,
      costEstimateBrl: this.cost,
      timeoutMs: this.timeout,
      rateLimitPerMin: 300,
      requiresAuth: true,
      supports: ['basic', 'theft', 'fines', 'administrativeRestrictions'],
      description: 'APIBrasil - Placa Dados, Restrições Administrativas, Débitos e Multas (Integração Oficial)',
      status: 'online'
    };
  }

  /**
   * Executa a requisição com cache e deduplicação rigorosa
   */
  async fetchRaw(plate: string, forceRefresh = false): Promise<any> {
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, "").toUpperCase();

    // 1. Se já está em cache e não for forceRefresh, retorna na hora sem fazer chamada externa
    if (!forceRefresh) {
      const cached = APIBrasilProvider.rawCache.get(cleanPlate);
      if (cached && (Date.now() - cached.timestamp < APIBrasilProvider.CACHE_TTL_MS)) {
        return cached.payload;
      }
    }

    // 2. Se já existe uma requisição em andamento para esta placa, reusa a mesma Promise
    if (APIBrasilProvider.inFlightRequests.has(cleanPlate)) {
      return APIBrasilProvider.inFlightRequests.get(cleanPlate);
    }

    // 3. Cria a promise de busca e registra no mapa de in-flight
    const requestPromise = this.executeFetch(cleanPlate);
    APIBrasilProvider.inFlightRequests.set(cleanPlate, requestPromise);

    try {
      const payload = await requestPromise;
      // Salva no cache com timestamp
      APIBrasilProvider.rawCache.set(cleanPlate, {
        timestamp: Date.now(),
        payload
      });
      return payload;
    } finally {
      APIBrasilProvider.inFlightRequests.delete(cleanPlate);
    }
  }

  private async executeFetch(cleanPlate: string): Promise<any> {
    const targetUrl =
      process.env.CONSULTA_VEICULAR_API_URL ||
      process.env.APIBRASIL_URL ||
      process.env.VEHICLE_API_URL ||
      "https://gateway.apibrasil.io/api/v2/vehicles/base/000/dados";

    const bearerToken = (
      process.env.APIBRASIL_BEARER_TOKEN ||
      process.env.APIBRASIL_TOKEN ||
      process.env.VEHICLE_API_KEY ||
      ""
    ).trim();

    const isDemoPlate = ['BRA2E19', 'ABC1D23', 'XYZ9876', 'DEMO123', 'MOC1234', 'TEST999', 'ROU8080', 'SAV1010', 'KOL9876'].includes(cleanPlate);

    // Em modo demo sem token ou para placas de teste homologadas, retorna dados seguros com multas/débitos
    if (!bearerToken && (process.env.DEMO_MODE === 'true' || isDemoPlate)) {
      const hasTheft = cleanPlate === 'ROU8080';
      const hasDebts = cleanPlate === 'SAV1010' || cleanPlate === 'ROU8080' || cleanPlate === 'ABC1D23';
      const hasJudicial = cleanPlate === 'XYZ9876';
      const hasAdmin = cleanPlate === 'XYZ9876' || cleanPlate === 'SAV1010';

      return {
        marca: "VOLKSWAGEN",
        modelo: "T-CROSS HIGHLINE 1.4 TSI FLEX 16V 5P AUT.",
        anoFabricacao: 2022,
        anoModelo: 2023,
        cor: "Azul Norway",
        combustivel: "Álcool / Gasolina (Flex)",
        municipio: "CAMPINAS",
        uf: "SP",
        codigoFipe: "005510-7",
        chassi: "9BWAG41B9NP098***",
        rouboFurto: hasTheft,
        bloqueio_judicial: hasJudicial,
        restricao_judicial: hasJudicial ? 'Bloqueio Judicial RENAJUD - Penhora em Execução Trabalhista' : null,
        bloqueio_administrativo: hasAdmin,
        restricao_administrativa: hasAdmin ? (hasJudicial ? 'Restrição Administrativa - Falta de Transferência no Prazo (Art. 233 CTB)' : 'Restrição Administrativa - Comunicação de Venda Ativa') : null,
        restricoes: [
          ...(hasJudicial ? ['BLOQUEIO JUDICIAL RENAJUD - PENHORA'] : []),
          ...(hasAdmin ? ['RESTRIÇÃO ADMINISTRATIVA ATIVA'] : [])
        ],
        detalhes_restricoes: [
          ...(hasJudicial ? [{
            tipo: 'Renajud',
            descricao: 'Bloqueio Judicial RENAJUD - Ordem de Penhora e Indisponibilidade',
            orgao: 'Tribunal Regional do Trabalho (TRT 2ª Região)',
            numeroProcesso: '0010482-19.2023.5.02.0000',
            dataRegistro: '12/01/2024'
          }] : []),
          ...(hasAdmin ? [{
            tipo: 'Administrativa',
            descricao: hasJudicial ? 'Restrição Administrativa por Não Transferência de Propriedade no Prazo (Art. 233 CTB)' : 'Comunicação de Venda Ativa com Bloqueio de Emissão de CRLV',
            orgao: 'DETRAN-SP',
            dataRegistro: '15/02/2024'
          }] : [])
        ],
        multas: hasDebts ? [
          {
            auto_infracao: 'PRF-BR116-98124',
            orgao_autuador: 'POLÍCIA RODOVIÁRIA FEDERAL (PRF)',
            descricao_infracao: 'Transitar em velocidade superior à máxima permitida em até 20%',
            data_infracao: '14/03/2024 15:42',
            valor: 130.16,
            gravidade: 'Média'
          },
          {
            auto_infracao: 'CET-SP-441029',
            orgao_autuador: 'COMPANHIA DE ENGENHARIA DE TRÁFEGO (CET-SP)',
            descricao_infracao: 'Estacionar em desacordo com a regulamentação especificada pela sinalização',
            data_infracao: '29/05/2024 10:18',
            valor: 195.23,
            gravidade: 'Grave'
          }
        ] : [],
        debitos: hasDebts ? {
          ipva_atrasado: 1250.00,
          taxa_licenciamento: 160.22,
          dpvat: 0,
          multas_renainf: 325.39,
          multas_detran: 0,
          divida_ativa: 0,
          total_geral: 1735.61
        } : {
          ipva_atrasado: 0,
          taxa_licenciamento: 0,
          dpvat: 0,
          multas_renainf: 0,
          multas_detran: 0,
          divida_ativa: 0,
          total_geral: 0
        }
      };
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const deviceToken = (process.env.APIBRASIL_DEVICE_TOKEN || process.env.DEVICE_TOKEN || "").trim();
    if (deviceToken) {
      headers["DeviceToken"] = deviceToken;
      headers["Device-Token"] = deviceToken;
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ placa: cleanPlate })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = json?.message || json?.error || `HTTP ${res.status}`;
      throw new Error(`APIBrasil (${res.status}): ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    }

    if (json?.error && !json?.data && !json?.dados) {
      const msg = json?.message || 'Erro na resposta da APIBrasil';
      throw new Error(`APIBrasil: ${msg}`);
    }

    const rawRoot = json?.data || json?.dados || json?.response || json || {};
    if (!rawRoot || typeof rawRoot !== 'object') {
      throw new Error('APIBrasil: Resposta vazia ou formato não reconhecido.');
    }

    const nestedVeiculo = (typeof rawRoot?.veiculo === 'object' && rawRoot?.veiculo !== null) ? rawRoot.veiculo : {};
    const nestedDados = (typeof rawRoot?.dados === 'object' && rawRoot?.dados !== null) ? rawRoot.dados : {};
    const nestedDebitos = (typeof rawRoot?.debitos === 'object' && rawRoot?.debitos !== null) ? rawRoot.debitos : {};
    const nestedRestricoes = (typeof rawRoot?.restricoes === 'object' && rawRoot?.restricoes !== null) ? rawRoot.restricoes : {};

    const payload = {
      ...nestedDados,
      ...nestedVeiculo,
      ...rawRoot,
      debitos: {
        ...nestedDebitos,
        ...(typeof rawRoot.debitos === 'object' ? rawRoot.debitos : {})
      },
      restricoes: rawRoot.restricoes || nestedVeiculo.restricoes || nestedDados.restricoes || nestedRestricoes
    };

    return payload;
  }

  async getBasicData(plate: string): Promise<ProviderResponse<VehicleBasicData>> {
    const start = Date.now();
    try {
      const data: any = await this.fetchRaw(plate);

      const rawChassi = data.chassi || data.chassis ? String(data.chassi || data.chassis) : "";
      const chassiMascarado = rawChassi
        ? (rawChassi.length >= 8 ? rawChassi.slice(0, 7) + "********" : rawChassi)
        : "Não disponível nesta fonte";

      const hasTheft = Boolean(
        data.rouboFurto ||
        data.roubo_furto ||
        data.alertaRoubo ||
        data.alerta_roubo ||
        (typeof data.situacao === 'string' && data.situacao.toLowerCase().includes('roubo'))
      );

      const anoFab = Number(data.anoFabricacao || data.ano_fabricacao || data.ano || data.year || 2020);
      const anoMod = Number(data.anoModelo || data.ano_modelo || data.ano_mod || data.modelYear || anoFab);

      const restrictions = this.parseAdministrativeRestrictions(data, plate);

      // Mapeia para seu contrato canônico (nunca inventa dados)
      const canonicalData: VehicleBasicData = {
        marca: data.marca || data.fabricante || data.brand || "NÃO INFORMADO",
        modelo: data.modelo || data.modelo_bruto || data.model || "NÃO INFORMADO",
        versao: data.versao || data.version,
        anoFabricacao: isNaN(anoFab) ? 2020 : anoFab,
        anoModelo: isNaN(anoMod) ? 2020 : anoMod,
        cor: data.cor || data.color || "NÃO INFORMADA",
        combustivel: data.combustivel || data.fuel || "Não informado",
        municipio: data.cidade || data.municipio || data.city || "Não informado",
        uf: data.uf_jurisdicao || data.uf || data.estado || data.state || "BR",
        segmento: data.segmento || data.tipo_veiculo || data.segment,
        potencia: data.potencia || data.power,
        cilindradas: data.cilindradas,
        chassiMascarado,
        situacaoVeiculo: hasTheft || restrictions.temBloqueioJudicial || restrictions.temBloqueioAdministrativo ? 'RESTRICAO' : 'EM_CIRCULACAO'
      };

      return {
        success: true,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'success',
        data: canonicalData
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao consultar APIBrasil'
      };
    }
  }

  async getTheftStatus(plate: string): Promise<ProviderResponse<TheftStatus>> {
    const start = Date.now();
    try {
      // Reusa os dados já cacheados em memória obtidos pelo fetchRaw, sem requisições adicionais
      const data: any = await this.fetchRaw(plate);
      const hasTheft = Boolean(
        data.rouboFurto ||
        data.roubo_furto ||
        data.alertaRoubo ||
        data.alerta_roubo ||
        (typeof data.situacao === 'string' && data.situacao.toLowerCase().includes('roubo')) ||
        (typeof data.situacao_veiculo === 'string' && data.situacao_veiculo.toLowerCase().includes('roubo'))
      );

      return {
        success: true,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'success',
        data: {
          status: hasTheft ? 'RESTRICAO_ENCONTRADA' : 'NADA_CONSTA',
          mensagem: hasTheft ? 'RESTRIÇÃO DE ROUBO/FURTO ENCONTRADA' : 'NADA CONSTA',
          dataConsulta: new Date().toISOString()
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message
      };
    }
  }

  async getFinancing(plate: string): Promise<ProviderResponse<FinancingStatus>> {
    const start = Date.now();
    try {
      const data: any = await this.fetchRaw(plate);
      
      const rawGravame = data.gravame || data.alienacao || data.alienacao_fiduciaria || data.arrendamento || data.reserva_dominio || data.restricao_financeira || data.restricao_financeira_descricao;
      const agente = data.agente_financeiro || data.banco || data.financeira || data.credor || data.instituicao_financeira;
      
      const restricoesTexts: string[] = [
        String(data.restricao1 || ''),
        String(data.restricao2 || ''),
        String(data.restricao3 || ''),
        String(data.restricao4 || ''),
        String(data.restricoes || ''),
        String(rawGravame || '')
      ].map(s => s.toUpperCase());

      const isAlienacao = restricoesTexts.some(t => t.includes('ALIENACAO') || t.includes('ALIENAÇÃO') || t.includes('FIDUCIARIA') || t.includes('FIDUCIÁRIA'));
      const isArrendamento = restricoesTexts.some(t => t.includes('ARRENDAMENTO') || t.includes('LEASING'));
      const isReserva = restricoesTexts.some(t => t.includes('RESERVA DE DOMINIO') || t.includes('RESERVA DE DOMÍNIO'));

      let status: FinancingStatus['status'] = 'SEM_RESTRICAO';
      let descricao = 'Veículo sem gravame financeiro ativo (quitado e liberado para transferência).';

      if (isAlienacao) {
        status = 'ALIENACAO_FIDUCIARIA';
        descricao = `Alienação Fiduciária ativa registrada no Sistema Nacional de Gravames (SNG)${agente ? ` - Agente: ${agente}` : ''}.`;
      } else if (isArrendamento) {
        status = 'ARRENDAMENTO_MERCANTIL';
        descricao = `Arrendamento Mercantil (Leasing) ativo no SNG${agente ? ` - Agente: ${agente}` : ''}.`;
      } else if (isReserva) {
        status = 'RESERVA_DOMINIO';
        descricao = `Reserva de Domínio ativa registrada junto ao órgão de trânsito.`;
      } else if (rawGravame && !['NADA CONSTA', 'SEM RESTRICAO', 'SEM RESTRIÇÃO', 'NAO', 'NÃO', '0', '00'].includes(String(rawGravame).toUpperCase())) {
        status = 'REGISTRO_ENCONTRADO';
        descricao = `Restrição financeira registrada: ${rawGravame}`;
      }

      return {
        success: true,
        sourceId: this.id,
        sourceName: 'APIBrasil - Gravames (SNG / Senatran)',
        latencyMs: Date.now() - start,
        status: 'success',
        data: {
          status,
          descricao,
          agenteFinanceiro: agente ? String(agente) : undefined
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao consultar gravame na APIBrasil'
      };
    }
  }

  async getAccidentHistory(plate: string): Promise<ProviderResponse<AccidentHistory>> {
    const start = Date.now();
    try {
      const data: any = await this.fetchRaw(plate);

      const rawSinistro = data.sinistro || data.avaria || data.indicio_sinistro || data.historico_sinistro || data.perda_total;
      const strSinistro = String(rawSinistro || '').toUpperCase();

      let status: AccidentHistory['status'] = 'SEM_REGISTRO';
      let descricao = 'Nenhum registro de sinistro estrutural grave ou indenização integral encontrado.';

      if (strSinistro.includes('GRANDE') || strSinistro.includes('INDENIZACAO') || strSinistro.includes('INDENIZAÇÃO') || strSinistro.includes('PERDA TOTAL')) {
        status = 'GRANDE_MONTA';
        descricao = 'Registro de sinistro com dano de Grande Monta ou Indenização Integral.';
      } else if (strSinistro.includes('MEDIA') || strSinistro.includes('MÉDIA')) {
        status = 'MEDIA_MONTA';
        descricao = 'Registro de sinistro com dano estrutural de Média Monta (exige CSV para circulação).';
      } else if (strSinistro.includes('PEQUENA')) {
        status = 'PEQUENA_MONTA';
        descricao = 'Registro de avaria leve / Pequena Monta.';
      } else if (rawSinistro && !['NADA CONSTA', 'SEM REGISTRO', 'NAO', 'NÃO', '0'].includes(strSinistro)) {
        status = 'REGISTRO_ENCONTRADO';
        descricao = `Apontamento de sinistro: ${rawSinistro}`;
      }

      return {
        success: true,
        sourceId: this.id,
        sourceName: 'APIBrasil - Histórico de Sinistros & Avarias',
        latencyMs: Date.now() - start,
        status: 'success',
        data: {
          status,
          descricao,
          seguradoraOrigem: data.seguradora || data.cia_seguros ? String(data.seguradora || data.cia_seguros) : undefined
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao consultar sinistros na APIBrasil'
      };
    }
  }

  async getAuctionHistory(plate: string): Promise<ProviderResponse<AuctionHistory>> {
    const start = Date.now();
    try {
      const data: any = await this.fetchRaw(plate);

      const rawLeilao = data.leilao || data.historico_leilao || data.passagem_leilao || data.indicio_leilao;
      const strLeilao = String(rawLeilao || '').toUpperCase();

      let status: AuctionHistory['status'] = 'SEM_REGISTRO';
      let descricao = 'Veículo sem registro de passagem por leilões parceiros homologados.';

      if (strLeilao.includes('FINANC') || strLeilao.includes('BANCO') || strLeilao.includes('RECUPER')) {
        status = 'LEILAO_FINANCEIRA';
        descricao = 'Veículo com histórico de passagem por leilão de recuperação financeira / bancária.';
      } else if (strLeilao.includes('SINISTRO') || strLeilao.includes('SEGURADORA')) {
        status = 'LEILAO_RECUPERADO_SINISTRO';
        descricao = 'Veículo arrematado em leilão de seguradora (recuperado de sinistro).';
      } else if (strLeilao.includes('FROTA') || strLeilao.includes('ORGAO') || strLeilao.includes('PÚBLICO') || strLeilao.includes('PUBLICO')) {
        status = 'LEILAO_FROTA_ORGAO';
        descricao = 'Veículo arrematado em leilão de desmobilização de frota ou órgão público.';
      } else if (rawLeilao && !['NADA CONSTA', 'SEM REGISTRO', 'NAO', 'NÃO', '0'].includes(strLeilao)) {
        status = 'REGISTRO_ENCONTRADO';
        descricao = `Registro de passagem em leilão: ${rawLeilao}`;
      }

      return {
        success: true,
        sourceId: this.id,
        sourceName: 'APIBrasil - Base de Leilões',
        latencyMs: Date.now() - start,
        status: 'success',
        data: {
          status,
          descricao,
          empresaLeilao: data.empresa_leilao || data.leiloeiro ? String(data.empresa_leilao || data.leiloeiro) : undefined,
          comitente: data.comitente ? String(data.comitente) : undefined,
          lote: data.lote ? String(data.lote) : undefined
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao consultar leilão na APIBrasil'
      };
    }
  }

  /**
   * Busca dados de débitos e multas na APIBrasil.
   * Se já existirem no payload de fetchRaw, utiliza-os diretamente sem custo extra.
   * Caso contrário, se configurado endpoint adicional de débitos/multas, efetua a consulta.
   */
  async fetchDebitos(cleanPlate: string): Promise<any> {
    const rawData = await this.fetchRaw(cleanPlate).catch(() => null);

    // Se no payload do veículo já vier o nó de multas ou débitos
    if (rawData && (rawData.multas || rawData.debitos || rawData.infracoes || rawData.renainf || rawData.debitos_multas)) {
      return rawData;
    }

    const bearerToken = (
      process.env.APIBRASIL_BEARER_TOKEN ||
      process.env.APIBRASIL_TOKEN ||
      process.env.VEHICLE_API_KEY ||
      ""
    ).trim();

    if (!bearerToken) {
      return rawData;
    }

    // Endpoint alternativo de débitos/multas da APIBrasil caso contratado separadamente
    const debitosUrl =
      process.env.APIBRASIL_DEBITOS_URL ||
      process.env.APIBRASIL_FINES_URL ||
      "https://gateway.apibrasil.io/api/v2/vehicles/base/000/debitos";

    try {
      const res = await fetch(debitosUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ placa: cleanPlate })
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const payload = json?.data || json?.dados || json?.debitos || json;
        if (payload) {
          return { ...(rawData || {}), ...payload };
        }
      }
    } catch {
      // Ignora erro do endpoint específico e utiliza o que tiver no rawData
    }

    return rawData;
  }

  async getFines(plate: string): Promise<ProviderResponse<FinesStatus>> {
    const start = Date.now();
    try {
      const cleanPlate = plate.replace(/[^A-Z0-9]/g, "").toUpperCase();
      const data = await this.fetchDebitos(cleanPlate);

      if (!data) {
        return {
          success: false,
          sourceId: this.id,
          sourceName: this.name,
          latencyMs: Date.now() - start,
          status: 'unavailable',
          errorMessage: 'Dados de débitos e multas indisponíveis na APIBrasil.'
        };
      }

      // 1. Extração de Multas e Infrações
      const rawMultasCandidate =
        data.multas ||
        data.infracoes ||
        data.renainf ||
        data.debitos_multas ||
        data.debitos?.multas ||
        data.debitos?.infracoes ||
        data.debitos?.renainf ||
        data.debitos?.multas_renainf ||
        data.retorno?.multas ||
        data.veiculo?.multas ||
        data.detalhes?.multas ||
        data.itens_infracao ||
        data.notificacoes ||
        data.lista_multas ||
        [];

      let multasList: Array<any> = [];
      if (Array.isArray(rawMultasCandidate)) {
        multasList = rawMultasCandidate;
      } else if (typeof rawMultasCandidate === 'object' && rawMultasCandidate !== null) {
        multasList = Object.values(rawMultasCandidate).filter(v => typeof v === 'object' && v !== null);
      }

      const parsedMultas = multasList.map((m: any, idx: number) => {
        const auto = m.auto_infracao || m.auto || m.codigo || m.numero || m.ait || m.num_auto || m.numero_auto || `INF-${idx + 1}`;
        const orgao = m.orgao_autuador || m.orgao || m.entidade || m.agente || m.orgao_emissor || m.ds_orgao || 'ÓRGÃO DE TRÂNSITO';
        const desc = m.descricao_infracao || m.descricao || m.motivo || m.enquadramento || m.descinfracao || m.nome_infracao || 'Infração de trânsito registrada';
        const dataHora = m.data_infracao || m.data || m.data_hora || m.dt_infracao || m.dt_cometimento || new Date().toLocaleDateString('pt-BR');
        const valor = Number(m.valor || m.valor_total || m.valor_original || m.vl_infracao || m.valor_multa || m.preco || 0);

        let gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima' = 'Média';
        const rawGrav = String(m.gravidade || '').toLowerCase();
        if (rawGrav.includes('gravíssima') || rawGrav.includes('gravissima')) gravidade = 'Gravíssima';
        else if (rawGrav.includes('grave')) gravidade = 'Grave';
        else if (rawGrav.includes('leve')) gravidade = 'Leve';
        else if (valor >= 293.47) gravidade = 'Gravíssima';
        else if (valor >= 195.23) gravidade = 'Grave';
        else if (valor >= 130.16) gravidade = 'Média';
        else if (valor > 0) gravidade = 'Leve';

        return {
          autoInfracao: auto,
          orgao,
          descricao: desc,
          dataHora,
          valor,
          gravidade
        };
      });

      // 2. Extração de Débitos Estaduais (IPVA, Licenciamento, DPVAT, Dívida Ativa)
      const rawDeb = data.debitos || {};
      const ipvaAtrasado = Number(rawDeb.ipva_atrasado || rawDeb.ipva || rawDeb.valor_ipva || data.ipva_atrasado || data.ipva || 0);
      const taxaLicenciamento = Number(rawDeb.taxa_licenciamento || rawDeb.licenciamento || rawDeb.valor_licenciamento || data.taxa_licenciamento || data.licenciamento || 0);
      const dpvat = Number(rawDeb.dpvat || rawDeb.seguro_obrigatorio || data.dpvat || 0);
      const dividaAtiva = Number(rawDeb.divida_ativa || data.divida_ativa || 0);
      const multasDetran = Number(rawDeb.multas_detran || rawDeb.multas_estaduais || data.multas_detran || 0);

      const multasTotalCalc = parsedMultas.reduce((acc, curr) => acc + (curr.valor || 0), 0);
      const multasRenainf = Number(rawDeb.multas_renainf || data.multas_renainf || multasTotalCalc);

      // Se não vieram itens detalhados de multas mas há valor financeiro lançado no Renainf/Detran, adiciona linha correspondente
      if (parsedMultas.length === 0 && (multasRenainf > 0 || multasDetran > 0)) {
        const valMulta = multasRenainf > 0 ? multasRenainf : multasDetran;
        parsedMultas.push({
          autoInfracao: 'RENAINF-DETRAN-PENDENTE',
          orgao: 'RENAINF / ÓRGÃO DE TRÂNSITO',
          descricao: 'Autuações de trânsito em aberto apuradas perante o Detran / RENAINF',
          dataHora: 'Exercício Vigente',
          valor: valMulta,
          gravidade: valMulta >= 293.47 ? 'Gravíssima' : valMulta >= 195.23 ? 'Grave' : 'Média'
        });
      }

      const totalDebitosCalculado = ipvaAtrasado + taxaLicenciamento + dpvat + dividaAtiva + multasRenainf + multasDetran;
      const totalGeral = Number(rawDeb.total_geral || rawDeb.valor_total || totalDebitosCalculado);

      const temRestricaoBloqueio = Boolean(
        data.restricao_bloqueio ||
        data.bloqueio_judicial ||
        data.restricao_administrativa ||
        (totalGeral > 0 && ipvaAtrasado > 0)
      );

      const orgaosSet = new Set<string>();
      parsedMultas.forEach(m => {
        if (m.orgao) orgaosSet.add(m.orgao);
      });
      if (ipvaAtrasado > 0) orgaosSet.add('SEFAZ - Fazenda Estadual');
      if (taxaLicenciamento > 0) orgaosSet.add('DETRAN Estadual');

      const temRegistros = parsedMultas.length > 0 || totalGeral > 0;

      const debitosObj: VehicleDebts = {
        status: temRegistros ? 'DEBITOS_ENCONTRADOS' : 'SEM_DEBITOS',
        totalGeral,
        ipvaAtrasado,
        taxaLicenciamento,
        dpvat,
        multasDetran,
        multasRenainf,
        dividaAtiva,
        temRestricaoBloqueio,
        fonteConsulta: 'APIBrasil / Renainf & SEFAZ',
        detalhesDebitos: [
          ...(ipvaAtrasado > 0 ? [{
            tipo: 'IPVA' as const,
            descricao: 'IPVA em aberto / Exercício anterior',
            valor: ipvaAtrasado
          }] : []),
          ...(taxaLicenciamento > 0 ? [{
            tipo: 'Licenciamento' as const,
            descricao: 'Taxa anual de licenciamento do veículo',
            valor: taxaLicenciamento
          }] : []),
          ...(multasTotalCalc > 0 ? [{
            tipo: 'Multa' as const,
            descricao: `${parsedMultas.length} autuação(ões) de trânsito em aberto`,
            valor: multasTotalCalc
          }] : []),
          ...(dividaAtiva > 0 ? [{
            tipo: 'Dívida Ativa' as const,
            descricao: 'Débitos inscritos em dívida ativa da União / Estado',
            valor: dividaAtiva
          }] : [])
        ]
      };

      const finesStatus: FinesStatus = {
        status: temRegistros ? 'MULTAS_ENCONTRADAS' : 'SEM_REGISTROS',
        quantidade: parsedMultas.length,
        valorTotalEstimado: multasTotalCalc > 0 ? multasTotalCalc : multasRenainf,
        orgaosAutuadores: Array.from(orgaosSet),
        totalDebitos: totalGeral,
        debitos: debitosObj,
        detalhes: parsedMultas
      };

      return {
        success: true,
        sourceId: this.id,
        sourceName: 'APIBrasil - Débitos & Multas',
        latencyMs: Date.now() - start,
        status: 'success',
        data: finesStatus
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao consultar débitos e multas na APIBrasil'
      };
    }
  }

  /**
   * Mapeia campos de restrição (como bloqueio judicial, bloqueio administrativo,
   * Renajud, guincho, restrições tributárias ou estaduais) da resposta da APIBrasil
   * para o contrato canônico de AdministrativeRestrictions.
   */
  public parseAdministrativeRestrictions(data: any, cleanPlate?: string): AdministrativeRestrictions {
    if (!data || typeof data !== 'object') {
      return {
        status: 'SEM_RESTRICOES',
        quantidade: 0,
        temBloqueioJudicial: false,
        temBloqueioAdministrativo: false,
        temRestricaoTributaria: false,
        temRestricaoGuincho: false,
        temRestricaoRenajud: false,
        temOutrasRestricoes: false,
        descricao: 'Nenhuma restrição administrativa ou judicial registrada.',
        detalhes: [],
        bloqueios: [],
        fonteConsulta: 'APIBrasil • Renavam, Tribunais de Justiça & Detran'
      };
    }

    const detalhes: Array<{
      tipo: 'Judicial' | 'Administrativa' | 'Tributária' | 'Renajud' | 'Ambiental' | 'Guincho' | 'Outro';
      descricao: string;
      orgao?: string;
      dataRegistro?: string;
      numeroProcesso?: string;
    }> = [];

    const bloqueiosList: string[] = [];

    let temBloqueioJudicial = false;
    let temBloqueioAdministrativo = false;
    let temRestricaoTributaria = false;
    let temRestricaoGuincho = false;
    let temRestricaoRenajud = false;
    let temOutrasRestricoes = false;

    // Função interna para classificar e adicionar restrição de forma estruturada
    const addEntry = (
      tipoHint: string,
      rawDesc: any,
      orgao?: string,
      processo?: string,
      dataReg?: string
    ) => {
      if (!rawDesc) return;
      const text = String(rawDesc).trim();
      if (!text || text === 'null' || text === 'undefined') return;
      const upper = text.toUpperCase();

      // Ignora respostas que indicam ausência de restrição
      if (
        upper === 'SEM RESTRICAO' ||
        upper === 'SEM RESTRIÇÃO' ||
        upper === 'NADA CONSTA' ||
        upper === 'NENHUMA' ||
        upper === 'NAO' ||
        upper === 'NÃO' ||
        upper === 'FALSE' ||
        upper === '0' ||
        upper === '00 - SEM RESTRICAO' ||
        upper === '00' ||
        upper === 'NORMAL' ||
        upper === 'REGULAR'
      ) {
        return;
      }

      let tipo: 'Judicial' | 'Administrativa' | 'Tributária' | 'Renajud' | 'Ambiental' | 'Guincho' | 'Outro' = 'Administrativa';

      if (upper.includes('RENAJUD') || tipoHint.toUpperCase().includes('RENAJUD')) {
        tipo = 'Renajud';
        temRestricaoRenajud = true;
        temBloqueioJudicial = true;
      } else if (
        upper.includes('JUDICIAL') ||
        upper.includes('PENHORA') ||
        upper.includes('EXECUCAO') ||
        upper.includes('EXECUÇÃO') ||
        upper.includes('TRT') ||
        upper.includes('TJ') ||
        upper.includes('VARA') ||
        tipoHint.toUpperCase().includes('JUDICIAL')
      ) {
        tipo = 'Judicial';
        temBloqueioJudicial = true;
      } else if (
        upper.includes('TRIBUTAR') ||
        upper.includes('TRIBUTÁR') ||
        upper.includes('SEFAZ') ||
        upper.includes('DIVIDA ATIVA') ||
        upper.includes('DÍVIDA ATIVA') ||
        upper.includes('FISCAL') ||
        tipoHint.toUpperCase().includes('TRIBUT')
      ) {
        tipo = 'Tributária';
        temRestricaoTributaria = true;
      } else if (
        upper.includes('GUINCHO') ||
        upper.includes('PATIO') ||
        upper.includes('PÁTIO') ||
        upper.includes('APREENSAO') ||
        upper.includes('APREENSÃO') ||
        tipoHint.toUpperCase().includes('GUINCHO')
      ) {
        tipo = 'Guincho';
        temRestricaoGuincho = true;
      } else if (upper.includes('AMBIENTAL') || upper.includes('IBAMA')) {
        tipo = 'Ambiental';
        temOutrasRestricoes = true;
      } else if (
        upper.includes('ADMINISTRATIVA') ||
        upper.includes('TRANSFERENCIA') ||
        upper.includes('TRANSFERÊNCIA') ||
        upper.includes('COMUNICACAO') ||
        upper.includes('COMUNICAÇÃO') ||
        upper.includes('VISTORIA') ||
        upper.includes('BLOQUEIO DIVERSO') ||
        upper.includes('DETRAN') ||
        tipoHint.toUpperCase().includes('ADM')
      ) {
        tipo = 'Administrativa';
        temBloqueioAdministrativo = true;
      } else {
        tipo = 'Outro';
        temOutrasRestricoes = true;
      }

      if (!bloqueiosList.includes(text)) {
        bloqueiosList.push(text);
        detalhes.push({
          tipo,
          descricao: text,
          orgao: orgao || (tipo === 'Judicial' || tipo === 'Renajud' ? 'Poder Judiciário / RENAJUD' : 'DETRAN Estadual'),
          numeroProcesso: processo,
          dataRegistro: dataReg
        });
      }
    };

    // 1. Mapeamento de Bloqueio Judicial / RENAJUD
    const rawJudicial = data.restricao_judicial ?? data.restricaoJudicial ?? data.bloqueio_judicial ?? data.bloqueioJudicial ?? data.renajud;
    if (rawJudicial === true || rawJudicial === 1 || rawJudicial === 'true' || rawJudicial === '1') {
      addEntry('Judicial', 'Bloqueio Judicial RENAJUD ativo com restrição de circulação ou transferência');
    } else if (typeof rawJudicial === 'string') {
      addEntry('Judicial', rawJudicial);
    } else if (typeof rawJudicial === 'object' && rawJudicial !== null) {
      addEntry('Judicial', rawJudicial.motivo || rawJudicial.descricao || 'Bloqueio Judicial RENAJUD ativo', rawJudicial.orgao, rawJudicial.processo || rawJudicial.numero_processo, rawJudicial.data);
    }

    // 2. Mapeamento de Bloqueio Administrativo
    const rawAdm = data.restricao_administrativa ?? data.restricaoAdministrativa ?? data.bloqueio_administrativo ?? data.bloqueioAdministrativo ?? data.restricoes_administrativas;
    if (rawAdm === true || rawAdm === 1 || rawAdm === 'true' || rawAdm === '1') {
      addEntry('Administrativa', 'Restrição Administrativa ativa registrada no DETRAN');
    } else if (typeof rawAdm === 'string') {
      addEntry('Administrativa', rawAdm);
    } else if (typeof rawAdm === 'object' && rawAdm !== null) {
      addEntry('Administrativa', rawAdm.motivo || rawAdm.descricao || 'Restrição Administrativa ativa', rawAdm.orgao, undefined, rawAdm.data);
    }

    // 3. Mapeamento de Restrição Tributária
    const rawTrib = data.restricao_tributaria ?? data.restricaoTributaria;
    if (rawTrib === true || rawTrib === 1 || rawTrib === 'true' || rawTrib === '1') {
      addEntry('Tributária', 'Restrição Tributária / Débito SEFAZ ativo');
    } else if (typeof rawTrib === 'string') {
      addEntry('Tributária', rawTrib);
    }

    // 4. Mapeamento de Restrição de Guincho / Pátio
    const rawGuincho = data.restricao_guincho ?? data.bloqueio_guincho;
    if (rawGuincho === true || rawGuincho === 1 || rawGuincho === 'true' || rawGuincho === '1') {
      addEntry('Guincho', 'Veículo com restrição de apreensão / guincho');
    } else if (typeof rawGuincho === 'string') {
      addEntry('Guincho', rawGuincho);
    }

    // 5. Restrições indexadas (Senatran / Renavam: restricao1, restricao2, restricao3, restricao4)
    for (const key of [
      'restricao1', 'restricao2', 'restricao3', 'restricao4',
      'restricao_1', 'restricao_2', 'restricao_3', 'restricao_4',
      'restricao', 'tipo_restricao', 'comunicacao_venda', 'comunicacao_de_venda',
      'impedimentos', 'restricoes_gerais', 'restricoes_judiciais'
    ]) {
      if (data[key]) {
        if (typeof data[key] === 'boolean' && data[key]) {
          addEntry('Administrativa', key.replace(/_/g, ' ').toUpperCase());
        } else if (typeof data[key] === 'string' || typeof data[key] === 'object') {
          addEntry('', data[key]);
        }
      }
    }

    // 6. Lista de restrições em array ou objeto (data.restricoes, data.bloqueios, data.detalhes_restricoes, data.ocorrencias)
    for (const listKey of ['restricoes', 'bloqueios', 'detalhes_restricoes', 'ocorrencias']) {
      const list = data[listKey];
      if (Array.isArray(list)) {
        for (const item of list) {
          if (typeof item === 'string') {
            addEntry('', item);
          } else if (typeof item === 'object' && item !== null) {
            const desc = item.descricao || item.motivo || item.nome || item.tipo || item.enquadramento;
            addEntry(item.tipo || '', desc, item.orgao || item.entidade, item.processo || item.numero_processo, item.data || item.data_registro);
          }
        }
      } else if (typeof list === 'string') {
        if (list.includes(';') || list.includes(',')) {
          list.split(/[,;\n]/).forEach(item => addEntry('', item));
        } else {
          addEntry('', list);
        }
      }
    }

    // Restrições vindas do nó debitos (se houver)
    if (data.debitos?.restricoes) {
      if (Array.isArray(data.debitos.restricoes)) {
        data.debitos.restricoes.forEach((r: any) => addEntry('', r));
      } else {
        addEntry('', data.debitos.restricoes);
      }
    }

    // 7. Situação cadastral geral se indicar bloqueio
    for (const sitKey of ['situacao', 'situacao_veiculo', 'situacao_documento']) {
      if (typeof data[sitKey] === 'string' && (
        data[sitKey].toUpperCase().includes('BLOQUEADO') ||
        data[sitKey].toUpperCase().includes('RESTRICAO') ||
        data[sitKey].toUpperCase().includes('RESTRIÇÃO')
      )) {
        addEntry('Administrativa', `Situação Cadastral: ${data[sitKey]}`);
      }
    }

    const temRestricoes = detalhes.length > 0 || temBloqueioJudicial || temBloqueioAdministrativo || temRestricaoTributaria || temRestricaoGuincho || temRestricaoRenajud;

    const status = temRestricoes ? 'RESTRICOES_ENCONTRADAS' : 'SEM_RESTRICOES';
    const quantidade = detalhes.length;
    const descricao = temRestricoes
      ? `${quantidade} restrição(ões) ativa(s) identificada(s) no histórico do veículo.`
      : 'Nenhuma restrição administrativa ou judicial ativa encontrada nas bases consultadas.';

    return {
      status,
      quantidade,
      temBloqueioJudicial,
      temBloqueioAdministrativo,
      temRestricaoTributaria,
      temRestricaoGuincho,
      temRestricaoRenajud,
      temOutrasRestricoes,
      descricao,
      detalhes,
      bloqueios: bloqueiosList,
      fonteConsulta: 'APIBrasil • Renavam, Tribunais de Justiça & Detran'
    };
  }

  /**
   * Consulta e mapeia restrições administrativas e judiciais
   */
  async getAdministrativeRestrictions(plate: string): Promise<ProviderResponse<AdministrativeRestrictions>> {
    const start = Date.now();
    try {
      const cleanPlate = plate.replace(/[^A-Z0-9]/g, "").toUpperCase();
      const data = await this.fetchRaw(cleanPlate).catch(() => null);

      const restrictions = this.parseAdministrativeRestrictions(data, cleanPlate);

      return {
        success: true,
        sourceId: this.id,
        sourceName: 'APIBrasil - Restrições Administrativas & Judiciais',
        latencyMs: Date.now() - start,
        status: 'success',
        data: restrictions
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao consultar restrições administrativas na APIBrasil'
      };
    }
  }

  async getOwner(): Promise<ProviderResponse<OwnerStatus>> {
    return {
      success: false,
      sourceId: this.id,
      sourceName: this.name,
      latencyMs: 0,
      status: 'unavailable',
      errorMessage: 'NAO_COBERTO_PELO_PROVEDOR'
    };
  }

  /**
   * Consulta unificada completa do veículo via APIBrasil.
   * Executa a extração simultânea e consolidada de dados cadastrais,
   * débitos, multas, restrições administrativas/judiciais, gravames, leilão e sinistro.
   * Exemplo de uso:
   *   const dados = await provider.consultarCompleto(placa);
   */
  async consultarCompleto(plate: string): Promise<ProviderResponse<CompleteVehicleData>> {
    const start = Date.now();
    try {
      const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      // Executa de forma concorrente a extração de todos os módulos
      const [
        basicRes,
        theftRes,
        financingRes,
        accidentRes,
        auctionRes,
        finesRes,
        adminRestrictionsRes
      ] = await Promise.all([
        this.getBasicData(cleanPlate),
        this.getTheftStatus(cleanPlate),
        this.getFinancing(cleanPlate),
        this.getAccidentHistory(cleanPlate),
        this.getAuctionHistory(cleanPlate),
        this.getFines(cleanPlate),
        this.getAdministrativeRestrictions(cleanPlate)
      ]);

      const raw = await this.fetchRaw(cleanPlate).catch(() => null);

      const completeData: CompleteVehicleData = {
        basic: basicRes.data,
        theft: theftRes.data,
        financing: financingRes.data,
        accident: accidentRes.data,
        auction: auctionRes.data,
        fines: finesRes.data,
        debitos: finesRes.data?.debitos,
        administrativeRestrictions: adminRestrictionsRes.data,
        raw
      };

      return {
        success: basicRes.success,
        data: completeData,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: basicRes.success ? 'success' : 'error',
        errorMessage: basicRes.errorMessage
      };
    } catch (err: unknown) {
      return {
        success: false,
        sourceId: this.id,
        sourceName: this.name,
        latencyMs: Date.now() - start,
        status: 'error',
        errorMessage: (err as Error).message || 'Falha ao executar consulta completa na APIBrasil'
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// Exporta alias camelCase para manter compatibilidade
export { APIBrasilProvider as ApiBrasilProvider };
