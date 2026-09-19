import { VehicleDataProvider, ProviderResponse, CompleteVehicleData } from './VehicleDataProvider.ts';
import {
  VehicleBasicData,
  TheftStatus,
  FinancingStatus,
  AccidentHistory,
  AuctionHistory,
  FinesStatus,
  AdministrativeRestrictions,
  OwnerStatus,
  ProviderConfig
} from '../../shared/types/index.ts';
import { maskSensitive } from '../../shared/schemas/vehicle.ts';

export class MockProvider implements VehicleDataProvider {
  readonly config: ProviderConfig = {
    id: 'mock',
    name: 'AutoCheck Sandbox Engine',
    type: 'mock',
    enabled: true,
    priority: 99,
    costEstimateBrl: 0.0,
    timeoutMs: 1500,
    rateLimitPerMin: 120,
    requiresAuth: false,
    supports: ['basic', 'theft', 'financing', 'accident', 'auction', 'fines', 'administrativeRestrictions'],
    description: 'Motor de demonstração e homologação para validação e testes.',
    status: 'mock'
  };

  private isDemoAllowed(plate: string): boolean {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean.length === 7;
  }

  private async simulateLatency(min = 120, max = 350): Promise<number> {
    const delay = Math.floor(Math.random() * (max - min)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
  }

  async getBasicData(plate: string): Promise<ProviderResponse<VehicleBasicData>> {
    const latency = await this.simulateLatency();
    const clean = plate.toUpperCase();

    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'error',
        errorMessage: 'Mock Sandbox desabilitado. O sistema está operando em modo de produção real com provedores oficiais e parceiros.'
      };
    }

    // Specific presets
    if (clean === 'ABC1D23' || clean === 'DEMO123') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'TOYOTA',
          modelo: 'COROLLA XEI 2.0 FLEX 16V AUT.',
          versao: 'XEi 2.0 Dynamic Force Direct Shift',
          anoFabricacao: 2019,
          anoModelo: 2020,
          cor: 'Cinza Celestial',
          combustivel: 'Álcool / Gasolina (Flex)',
          chassiMascarado: maskSensitive('9BRBD3HE4L1098745', 'chassi'),
          motorMascarado: maskSensitive('M20AFKS123456', 'motor'),
          municipio: 'SÃO PAULO',
          uf: 'SP',
          segmento: 'Sedan Médio',
          potencia: '177 cv',
          cilindradas: '1987 cc',
          tipoVeiculo: 'Automóvel',
          especieVeiculo: 'Passageiro',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'EM_CIRCULACAO'
        }
      };
    }

    if (clean === 'BRA2E19') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'JEEP',
          modelo: 'RENEGADE LONGITUDE 1.3 TURBO FLEX T270',
          versao: 'Longitude T270 4x2 AT6',
          anoFabricacao: 2022,
          anoModelo: 2023,
          cor: 'Preto Carbon',
          combustivel: 'Álcool / Gasolina (Flex)',
          chassiMascarado: maskSensitive('988641AG5P7891234', 'chassi'),
          municipio: 'CURITIBA',
          uf: 'PR',
          segmento: 'SUV Compacto',
          potencia: '185 cv',
          tipoVeiculo: 'Utilitário Esportivo',
          especieVeiculo: 'Passageiro',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'EM_CIRCULACAO'
        }
      };
    }

    if (clean === 'KOL9876') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'CHEVROLET',
          modelo: 'ONIX PLUS SEDAN PREMIER 1.0 TURBO FLEX AUT.',
          versao: 'Premier Turbo',
          anoFabricacao: 2021,
          anoModelo: 2021,
          cor: 'Prata Switchblade',
          combustivel: 'Álcool / Gasolina (Flex)',
          chassiMascarado: maskSensitive('9BGKS69S0MG142589', 'chassi'),
          municipio: 'BELO HORIZONTE',
          uf: 'MG',
          segmento: 'Sedan Compacto',
          potencia: '116 cv',
          tipoVeiculo: 'Automóvel',
          especieVeiculo: 'Passageiro',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'EM_CIRCULACAO'
        }
      };
    }

    if (clean === 'SAV1010') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'VOLKSWAGEN',
          modelo: 'GOLF GTI 2.0 TSI 16V 5P AUT.',
          versao: 'GTI 2.0 TSI DSG',
          anoFabricacao: 2018,
          anoModelo: 2018,
          cor: 'Branco Puro',
          combustivel: 'Gasolina',
          chassiMascarado: maskSensitive('WVWZZZAUZJP041289', 'chassi'),
          municipio: 'PORTO ALEGRE',
          uf: 'RS',
          segmento: 'Hatchback Médio',
          potencia: '230 cv',
          tipoVeiculo: 'Automóvel',
          especieVeiculo: 'Passageiro',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'EM_CIRCULACAO'
        }
      };
    }

    if (clean === 'JIX7B91' || clean === 'JIX-7B91') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'VOLKSWAGEN',
          modelo: 'NIVUS HIGHLINE 200 TSI',
          submodelo: 'Nivus',
          versao: 'Highline 1.0 Turbo 200 TSI Flex Aut. 6M',
          anoFabricacao: 2022,
          anoModelo: 2023,
          cor: 'CINZA PLATINUM',
          combustivel: 'Álcool / Gasolina (Flex)',
          chassiMascarado: '9BWZZZ6KZNP***7B91',
          motorMascarado: 'DHS******1029',
          renavamMascarado: '0129******3',
          municipio: 'SÃO PAULO',
          uf: 'SP',
          segmento: 'SUV Cupê Compacto',
          potencia: '128 cv (E) / 116 cv (G)',
          cilindradas: '999 cc',
          tipoVeiculo: 'Automóvel',
          especieVeiculo: 'Passageiro',
          categoria: 'Particular',
          carroceria: 'Utilitário Esportivo (SUV)',
          eixos: 2,
          lotacao: '5 Ocupantes',
          pesoBrutoTotal: '1.620 kg',
          capacidadeTracao: '450 kg',
          dataEmplacamento: '15/02/2023',
          cambio: 'Automático Tiptronic 6 Marchas',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'EM_CIRCULACAO'
        }
      };
    }

    if (clean === 'JIX7B96' || clean === 'JIX-7B96') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'VOLKSWAGEN',
          modelo: 'GOLF',
          versao: 'Golf 1.6 Total Flex',
          anoFabricacao: 2010,
          anoModelo: 2011,
          cor: 'CINZA',
          combustivel: 'Álcool / Gasolina (Flex)',
          chassiMascarado: '***********002816',
          municipio: 'BRASÍLIA',
          uf: 'DF',
          segmento: 'Hatchback Médio',
          potencia: '104 cv',
          tipoVeiculo: 'Automóvel',
          especieVeiculo: 'Passageiro',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'EM_CIRCULACAO'
        }
      };
    }

    if (clean === 'ROU8080') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          marca: 'HYUNDAI',
          modelo: 'HB20 PLATINUM PLUS 1.0 TURBO GDI AUT.',
          anoFabricacao: 2023,
          anoModelo: 2024,
          cor: 'Vermelho Magic',
          combustivel: 'Álcool / Gasolina (Flex)',
          chassiMascarado: maskSensitive('9BHBG51EBPP239102', 'chassi'),
          municipio: 'RIO DE JANEIRO',
          uf: 'RJ',
          segmento: 'Hatchback Compacto',
          potencia: '120 cv',
          tipoVeiculo: 'Automóvel',
          especieVeiculo: 'Passageiro',
          nacionalidade: 'Nacional',
          situacaoVeiculo: 'RESTRICAO'
        }
      };
    }

    // Dynamic fallback for any valid plate
    const catalog = [
      { marca: 'HONDA', modelo: 'CIVIC TOURING 1.5 TURBO 16V AUT.', cor: 'Branco Pérola', anoFab: 2021, anoMod: 2021, segmento: 'Sedan Médio', pot: '173 cv' },
      { marca: 'VOLKSWAGEN', modelo: 'NIVUS HIGHLINE 1.0 200 TSI FLEX AUT.', cor: 'Cinza Platinum', anoFab: 2022, anoMod: 2022, segmento: 'SUV Cupê', pot: '128 cv' },
      { marca: 'TOYOTA', modelo: 'HILUX CD SRX 4X4 2.8 DIESEL AUT.', cor: 'Prata Névoa', anoFab: 2020, anoMod: 2020, segmento: 'Picape Média', pot: '204 cv' },
      { marca: 'HYUNDAI', modelo: 'CRETA ULTIMATE 2.0 16V FLEX AUT.', cor: 'Azul Sapphire', anoFab: 2022, anoMod: 2023, segmento: 'SUV Compacto', pot: '167 cv' },
      { marca: 'FIAT', modelo: 'FASTBACK LIMITED EDITION 1.3 TURBO AUT.', cor: 'Cinza Strato', anoFab: 2023, anoMod: 2023, segmento: 'SUV Cupê', pot: '185 cv' },
      { marca: 'NISSAN', modelo: 'KICKS EXCLUSIVE 1.6 16V FLEXSTAR AUT.', cor: 'Cinza Grafite', anoFab: 2021, anoMod: 2022, segmento: 'SUV Compacto', pot: '114 cv' }
    ];

    const hash = clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const item = catalog[hash % catalog.length];
    const states = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'GO', 'BA', 'DF'];
    const cities: Record<string, string> = {
      SP: 'SÃO PAULO',
      RJ: 'RIO DE JANEIRO',
      MG: 'BELO HORIZONTE',
      PR: 'CURITIBA',
      RS: 'PORTO ALEGRE',
      SC: 'FLORIANÓPOLIS',
      GO: 'GOIÂNIA',
      BA: 'SALVADOR',
      DF: 'BRASÍLIA'
    };
    const uf = states[hash % states.length];

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        marca: item.marca,
        modelo: item.modelo,
        anoFabricacao: item.anoFab,
        anoModelo: item.anoMod,
        cor: item.cor,
        combustivel: item.modelo.includes('DIESEL') ? 'Diesel S10' : 'Álcool / Gasolina (Flex)',
        chassiMascarado: maskSensitive(`9BR${clean}89215093`, 'chassi'),
        motorMascarado: maskSensitive(`MTR${clean}9923`, 'motor'),
        renavamMascarado: `00${clean.slice(-3)}****${clean.slice(0, 2)}`,
        municipio: cities[uf],
        uf,
        segmento: item.segmento,
        submodelo: item.modelo.split(' ')[0],
        potencia: item.pot,
        categoria: 'Particular',
        carroceria: item.segmento.includes('Picape') ? 'Caminhonete / Picape' : 'Utilitário / Automóvel',
        eixos: 2,
        lotacao: '5 Ocupantes',
        pesoBrutoTotal: '1.750 kg',
        capacidadeTracao: '500 kg',
        dataEmplacamento: '20/04/2022',
        cambio: 'Automático',
        tipoVeiculo: 'Automóvel',
        especieVeiculo: 'Passageiro',
        nacionalidade: 'Nacional',
        situacaoVeiculo: 'EM_CIRCULACAO'
      }
    };
  }

  async getTheftStatus(plate: string): Promise<ProviderResponse<TheftStatus>> {
    const latency = await this.simulateLatency(150, 400);
    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'unavailable',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }
    const clean = plate.toUpperCase();

    if (clean === 'ROU8080') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'RESTRICAO_ENCONTRADA',
          mensagem: 'ALERTA ATIVO DE ROUBO/FURTO REGISTRADO',
          dataConsulta: new Date().toISOString(),
          boletimOcorrencia: 'BO-2024/98412-RJ',
          orgaoRegistro: '19ª DP - Polícia Civil do Estado do Rio de Janeiro',
          dataOcorrencia: '14/01/2024',
          observacao: 'Veículo com restrição policial ativa inserida no Sistema Nacional de Informações de Segurança Pública.'
        }
      };
    }

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'NADA_CONSTA',
        mensagem: 'Sem ocorrência ativa de roubo ou furto nas bases consultadas.',
        dataConsulta: new Date().toISOString()
      }
    };
  }

  async getFinancing(plate: string): Promise<ProviderResponse<FinancingStatus>> {
    const latency = await this.simulateLatency();
    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'unavailable',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }
    const clean = plate.toUpperCase();

    if (clean === 'BRA2E19') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'ALIENACAO_FIDUCIARIA',
          descricao: 'Gravame ativo inserido no Sistema Nacional de Gravames (SNG)',
          agenteFinanceiro: 'BANCO ITAÚ CONSIGNADO / ITAÚCARD S.A.',
          dataInclusao: '18/08/2022',
          contratoMascarado: '***9812401',
          restricaoDescricao: 'Alienação Fiduciária vigente. Necessária quitação para transferência de propriedade.'
        }
      };
    }

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'SEM_RESTRICAO',
        descricao: 'Veículo sem registro ativo de gravame financeiro ou alienação fiduciária.'
      }
    };
  }

  async getAccidentHistory(plate: string): Promise<ProviderResponse<AccidentHistory>> {
    const latency = await this.simulateLatency();
    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'unavailable',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }
    const clean = plate.toUpperCase();

    if (clean === 'SAV1010') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'MEDIA_MONTA',
          descricao: 'Registro de sinistro com classificação de média monta.',
          tipoSinistro: 'Colisão Dianteira / Estrutural',
          percentualDanoEstimado: '32% do valor de referência',
          dataRegistro: '11/04/2021',
          seguradoraOrigem: 'Companhia Seguradora Nacional'
        }
      };
    }

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'SEM_REGISTRO',
        descricao: 'Nenhum histórico de sinistro ou perda total encontrado em bases securitárias.'
      }
    };
  }

  async getAuctionHistory(plate: string): Promise<ProviderResponse<AuctionHistory>> {
    const latency = await this.simulateLatency();
    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'unavailable',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }
    const clean = plate.toUpperCase();

    if (clean === 'KOL9876') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'LEILAO_FINANCEIRA',
          descricao: 'Veículo leiloado por instituição financeira (Recuperação de Crédito).',
          empresaLeilao: 'Sodré Santoro Leilões',
          comitente: 'Banco Santander Brasil S.A.',
          lote: 'Lote 0184/SP',
          dataLeilao: '05/06/2023',
          condicaoGeral: 'Funcionando / Documentação regular'
        }
      };
    }

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'SEM_REGISTRO',
        descricao: 'Nenhum registro de leilão localizado nas bases de casas leiloeiras consultadas.'
      }
    };
  }

  async getFines(plate: string): Promise<ProviderResponse<FinesStatus>> {
    const latency = await this.simulateLatency();
    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'unavailable',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }
    const clean = plate.toUpperCase();

    if (clean === 'SAV1010' || clean === 'BRA2E19') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'MULTAS_ENCONTRADAS',
          quantidade: 2,
          valorTotalEstimado: 390.46,
          orgaosAutuadores: ['DER-SP', 'PREFEITURA DE SÃO PAULO'],
          detalhes: [
            {
              autoInfracao: 'DER-992140',
              orgao: 'DER-SP',
              descricao: 'Transitar em velocidade superior à máxima permitida em até 20%',
              dataHora: '12/10/2023 14:22',
              valor: 130.16,
              gravidade: 'Média'
            },
            {
              autoInfracao: 'CET-330192',
              orgao: 'PREFEITURA DE SÃO PAULO',
              descricao: 'Estacionar em desacordo com as posições estabelecidas na sinalização',
              dataHora: '28/11/2023 09:15',
              valor: 260.30,
              gravidade: 'Grave'
            }
          ]
        }
      };
    }

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'SEM_REGISTROS',
        quantidade: 0,
        valorTotalEstimado: 0,
        orgaosAutuadores: []
      }
    };
  }

  async getAdministrativeRestrictions(plate: string): Promise<ProviderResponse<AdministrativeRestrictions>> {
    const latency = await this.simulateLatency();
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'error',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }

    if (clean === 'XYZ9876') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'RESTRICOES_ENCONTRADAS',
          quantidade: 2,
          temBloqueioJudicial: true,
          temBloqueioAdministrativo: true,
          temRestricaoTributaria: false,
          temRestricaoGuincho: false,
          temRestricaoRenajud: true,
          temOutrasRestricoes: false,
          descricao: 'Constam 2 restrições ativas: Bloqueio Judicial RENAJUD e Restrição Administrativa por Não Transferência.',
          bloqueios: [
            'BLOQUEIO JUDICIAL RENAJUD - PENHORA',
            'RESTRIÇÃO ADMINISTRATIVA - FALTA DE TRANSFERÊNCIA'
          ],
          detalhes: [
            {
              tipo: 'Renajud',
              descricao: 'Bloqueio Judicial RENAJUD - Ordem de Penhora e Indisponibilidade',
              orgao: 'Tribunal Regional do Trabalho (TRT 2ª Região)',
              numeroProcesso: '0010482-19.2023.5.02.0000',
              dataRegistro: '12/01/2024'
            },
            {
              tipo: 'Administrativa',
              descricao: 'Restrição Administrativa por Não Transferência de Propriedade no Prazo (Art. 233 CTB)',
              orgao: 'DETRAN-SP',
              dataRegistro: '15/02/2024'
            }
          ],
          fonteConsulta: 'AutoCheck Sandbox • Simulação Homologada RENAJUD/DETRAN'
        }
      };
    }

    if (clean === 'SAV1010') {
      return {
        success: true,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'success',
        data: {
          status: 'RESTRICOES_ENCONTRADAS',
          quantidade: 1,
          temBloqueioJudicial: false,
          temBloqueioAdministrativo: true,
          temRestricaoTributaria: false,
          temRestricaoGuincho: false,
          temRestricaoRenajud: false,
          temOutrasRestricoes: false,
          descricao: 'Consta 1 restrição administrativa ativa: Comunicação de venda com bloqueio de CRLV.',
          bloqueios: [
            'RESTRIÇÃO ADMINISTRATIVA - COMUNICAÇÃO DE VENDA'
          ],
          detalhes: [
            {
              tipo: 'Administrativa',
              descricao: 'Comunicação de Venda Ativa com Bloqueio de Emissão de CRLV',
              orgao: 'DETRAN-SP',
              dataRegistro: '20/03/2024'
            }
          ],
          fonteConsulta: 'AutoCheck Sandbox • Simulação Homologada RENAJUD/DETRAN'
        }
      };
    }

    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'SEM_RESTRICOES',
        quantidade: 0,
        temBloqueioJudicial: false,
        temBloqueioAdministrativo: false,
        temRestricaoTributaria: false,
        temRestricaoGuincho: false,
        temRestricaoRenajud: false,
        temOutrasRestricoes: false,
        descricao: 'Nenhuma restrição administrativa ou judicial ativa encontrada nas bases consultadas.',
        bloqueios: [],
        detalhes: [],
        fonteConsulta: 'AutoCheck Sandbox • Simulação Homologada RENAJUD/DETRAN'
      }
    };
  }

  async getOwner(plate: string): Promise<ProviderResponse<OwnerStatus>> {
    const latency = await this.simulateLatency();
    if (!this.isDemoAllowed(plate)) {
      return {
        success: false,
        sourceId: this.config.id,
        sourceName: this.config.name,
        latencyMs: latency,
        status: 'unavailable',
        errorMessage: 'Mock Sandbox desabilitado em modo de produção.'
      };
    }
    return {
      success: true,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: latency,
      status: 'success',
      data: {
        status: 'RESTRITO_LGPD',
        tipoPessoa: 'Física',
        documentoMascarado: maskSensitive('12345678909', 'cpf'),
        avisoLGPD: 'Dados pessoais de proprietário são protegidos pela Lei Geral de Proteção de Dados (Lei 13.709/2018) e não são disponibilizados publicamente.'
      }
    };
  }

  async consultarCompleto(plate: string): Promise<ProviderResponse<CompleteVehicleData>> {
    const start = Date.now();
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const [
      basicRes,
      theftRes,
      financingRes,
      accidentRes,
      auctionRes,
      finesRes,
      adminRestrictionsRes,
      ownerRes
    ] = await Promise.all([
      this.getBasicData(cleanPlate),
      this.getTheftStatus(cleanPlate),
      this.getFinancing(cleanPlate),
      this.getAccidentHistory(cleanPlate),
      this.getAuctionHistory(cleanPlate),
      this.getFines(cleanPlate),
      this.getAdministrativeRestrictions(cleanPlate),
      this.getOwner(cleanPlate)
    ]);

    const completeData: CompleteVehicleData = {
      basic: basicRes.data,
      theft: theftRes.data,
      financing: financingRes.data,
      accident: accidentRes.data,
      auction: auctionRes.data,
      fines: finesRes.data,
      debitos: finesRes.data?.debitos,
      administrativeRestrictions: adminRestrictionsRes.data,
      owner: ownerRes.data
    };

    return {
      success: basicRes.success,
      data: completeData,
      sourceId: this.config.id,
      sourceName: this.config.name,
      latencyMs: Date.now() - start,
      status: basicRes.success ? 'success' : 'error',
      errorMessage: basicRes.errorMessage
    };
  }

  async healthCheck(): Promise<{ online: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();
    await this.simulateLatency(30, 80);
    return {
      online: true,
      latencyMs: Date.now() - start,
      message: 'Sandbox Provider operando com 100% de disponibilidade.'
    };
  }
}
