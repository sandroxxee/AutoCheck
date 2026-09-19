import { enrichmentService } from '../services/EnrichmentService.ts';
import { queryEngine } from '../services/QueryEngine.ts';

async function testEnrichment() {
  console.log('=== TESTE DE INTELIGÊNCIA: DADOS REAIS E APIS PÚBLICAS/GRATUITAS ===\n');

  // 1. Validar Módulo FIPE
  console.log('1. Testando Módulo Tabela FIPE:');
  const corollaFipe = enrichmentService.getFipeData({
    marca: 'TOYOTA',
    modelo: 'COROLLA XEI 2.0 FLEX AUT',
    anoFabricacao: 2021,
    anoModelo: 2021,
    combustivel: 'Flex',
    cor: 'Prata',
    uf: 'SP',
    municipio: 'São Paulo',
    situacaoVeiculo: 'EM_CIRCULACAO'
  });
  console.log(`- Modelo: Corolla 2021`);
  console.log(`- Código FIPE: ${corollaFipe.codigoFipe}`);
  console.log(`- Valor Médio: ${corollaFipe.valorFormatado} (R$ ${corollaFipe.valorBrl})`);
  console.log(`- Mês Ref: ${corollaFipe.mesReferencia}`);
  if (!corollaFipe.valorBrl || corollaFipe.valorBrl <= 0 || !corollaFipe.codigoFipe) {
    throw new Error('Falha no teste: Dados da FIPE inválidos!');
  }
  console.log('✔ Tabela FIPE calculada e formatada com sucesso!\n');

  // 2. Validar IPVA e Alíquotas por Estado (SEFAZ)
  console.log('2. Testando IPVA, Taxa de Licenciamento e Isenção SEFAZ:');
  const spIpva = enrichmentService.getIpvaData({
    marca: 'TOYOTA',
    modelo: 'COROLLA',
    anoFabricacao: 2021,
    anoModelo: 2021,
    uf: 'SP',
    municipio: 'Campinas'
  }, corollaFipe.valorBrl);

  console.log(`- Estado: ${spIpva.uf} | Alíquota: ${spIpva.aliquotaPerc}%`);
  console.log(`- IPVA Estimado: R$ ${spIpva.valorIpvaEstimado}`);
  console.log(`- Taxa Licenciamento: R$ ${spIpva.taxaLicenciamentoEstimada}`);
  console.log(`- Isento: ${spIpva.isento ? 'SIM' : 'NÃO'} (${spIpva.regraIsencao})`);

  if (spIpva.aliquotaPerc !== 4.0 || spIpva.valorIpvaEstimado <= 0) {
    throw new Error('Falha no teste: Cálculo de IPVA em SP incorreto!');
  }

  // Testar carro antigo com isenção
  const vintageIpva = enrichmentService.getIpvaData({
    marca: 'VOLKSWAGEN',
    modelo: 'GOL',
    anoFabricacao: 2002,
    anoModelo: 2002,
    uf: 'SP',
    municipio: 'Santos'
  }, 15000);
  console.log(`- Veículo 2002 em SP: Isento = ${vintageIpva.isento} (Esperado: true)`);
  if (!vintageIpva.isento || vintageIpva.valorIpvaEstimado !== 0) {
    throw new Error('Falha no teste: Regra de isenção por idade falhou!');
  }
  console.log('✔ Cálculo de IPVA e isenção tributária validado!\n');

  // 3. Validar Recalls de Fábrica (SENATRAN)
  console.log('3. Testando Módulo de Recalls de Fábrica (SENATRAN):');
  const recallCheck = enrichmentService.getRecallData({
    marca: 'TOYOTA',
    modelo: 'COROLLA XEI',
    anoFabricacao: 2018,
    anoModelo: 2018
  });
  console.log(`- Possui recall histórico: ${recallCheck.possuiRecall}`);
  console.log(`- Total recalls encontrados: ${recallCheck.totalRecalls}`);
  console.log(`- Orientação: ${recallCheck.orientacaoDetran}`);
  if (!recallCheck.possuiRecall || recallCheck.totalRecalls === 0) {
    throw new Error('Falha no teste: Recall do Corolla Takata não foi identificado!');
  }
  console.log('✔ Módulo de segurança e recalls validado com sucesso!\n');

  // 4. Validar Ficha Técnica e Consumo Inmetro (PBEV)
  console.log('4. Testando Ficha Técnica e Eficiência Inmetro:');
  const inmetro = enrichmentService.getTechnicalSpecs({
    marca: 'CHEVROLET',
    modelo: 'ONIX PLUS 1.0 TURBO'
  });
  console.log(`- Potência: ${inmetro.potenciaCv} cv`);
  console.log(`- Consumo Urbano Gasolina: ${inmetro.consumoUrbanoGasolinaKml} km/l`);
  console.log(`- Consumo Rodoviário Gasolina: ${inmetro.consumoRodoviarioGasolinaKml} km/l`);
  console.log(`- Autonomia Estimada: ${inmetro.autonomiaRodoviariaKm} km`);
  console.log(`- Classificação Inmetro: Selo Nota ${inmetro.classificacaoPbev}`);
  if (inmetro.consumoUrbanoGasolinaKml <= 0 || inmetro.autonomiaRodoviariaKm <= 0) {
    throw new Error('Falha no teste: Dados de consumo Inmetro inválidos!');
  }
  console.log('✔ Ficha técnica e consumo Inmetro validado com sucesso!\n');

  // 5. Validar Conversão Padrão Mercosul (DENATRAN)
  console.log('5. Testando Conversão de Padrão Mercosul (DENATRAN):');
  const mercosulTest1 = enrichmentService.getMercosulData('BRA2E19');
  console.log(`- Placa Mercosul: ${mercosulTest1.placaOriginal} -> Antiga: ${mercosulTest1.placaEquivalente} (Obrigatório trocar: ${mercosulTest1.obrigatorioTroca})`);
  if (mercosulTest1.padraoAtual !== 'mercosul' || mercosulTest1.obrigatorioTroca !== false) {
    throw new Error('Falha no teste: Conversão de placa Mercosul incorreta!');
  }

  const mercosulTest2 = enrichmentService.getMercosulData('ABC1234');
  console.log(`- Placa Antiga: ${mercosulTest2.placaOriginal} -> Mercosul: ${mercosulTest2.placaEquivalente} (Obrigatório trocar: ${mercosulTest2.obrigatorioTroca})`);
  if (mercosulTest2.padraoAtual !== 'antiga' || mercosulTest2.obrigatorioTroca !== true) {
    throw new Error('Falha no teste: Conversão de placa antiga incorreta!');
  }
  console.log('✔ Conversão e regras de emplacamento validadas com sucesso!\n');

  // 6. Testar Execução Completa via QueryEngine
  console.log('6. Testando QueryEngine integrada com enriquecimento:');
  const fullReport = await queryEngine.executeQuery({
    plate: 'BRA2E19',
    queryType: 'complete',
    forceRefresh: true
  });

  console.log(`- Relatório gerado: ID ${fullReport.id} para placa ${fullReport.plateFormatted}`);
  console.log(`- FIPE presente: ${!!fullReport.fipe} (${fullReport.fipe?.valorFormatado})`);
  console.log(`- IPVA presente: ${!!fullReport.ipva} (R$ ${fullReport.ipva?.valorIpvaEstimado})`);
  console.log(`- Recall presente: ${!!fullReport.recall}`);
  console.log(`- Inmetro presente: ${!!fullReport.technicalSpecs} (Nota ${fullReport.technicalSpecs?.classificacaoPbev})`);
  console.log(`- Mercosul presente: ${!!fullReport.mercosul}`);

  if (!fullReport.fipe || !fullReport.ipva || !fullReport.recall || !fullReport.technicalSpecs || !fullReport.mercosul) {
    throw new Error('Falha no teste: Relatório não contém todos os módulos enriquecidos!');
  }

  console.log('\n=============================================================');
  console.log('TODOS OS TESTES DE DADOS REAIS E APIS ABERTAS PASSARAM 100%!');
  console.log('=============================================================');
  process.exit(0);
}

testEnrichment().catch(err => {
  console.error('Erro nos testes de inteligência:', err);
  process.exit(1);
});
