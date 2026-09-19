# ESTADO DO PROJETO: AUTOCHECK BRASIL / HUNTER DE OFERTAS

## Fase Atual
**FASE 5 / CONSULTA DE VEÍCULOS & DÉBITOS COM APIBRASIL**

## Funcionalidades Concluídas
1. **Tipos e Interfaces de Débitos (`VehicleDebts`):**
   - Criação da interface estruturada em `/shared/types/index.ts` contendo status, total geral, IPVA atrasado, taxa de licenciamento, DPVAT, multas Detran/Renainf, dívida ativa, restrições e lista detalhada de autuações.
   - Atualização da interface `FinesStatus` e `ConsolidatedReport` para suportar `debitos?: VehicleDebts`.

2. **Implementação do Provedor APIBrasil (`ApiBrasilProvider`):**
   - Suporte ao módulo `'fines'` e endpoint de débitos/multas (`fetchDebitos`).
   - Mapeamento das multas com auto de infração, órgão autuador, gravidade ponderada, data/hora e valor.
   - Consolidação de débitos estaduais e tributários (IPVA, Licenciamento, Dívida Ativa).
   - Suporte a testes homologados e integração ao fallback com token `APIBRASIL_BEARER_TOKEN`.

3. **Orquestração no `QueryEngine` e `ProviderRegistry`:**
   - Registro do módulo de débitos e multas na lista de capacidades de provedores.
   - Inclusão de `debitos` no relatório consolidado e rastreabilidade da fonte em `consultedSources`.

4. **Visualização no Frontend (`ReportView.tsx`):**
   - Novo Card 6 dedicado: **DÉBITOS & MULTAS (APIBRASIL)**.
   - Indicador dinâmico de regularidade ou débitos pendentes.
   - Box de valor consolidado total e grade discriminada (IPVA atrasado, Licenciamento, Multas Renainf e Dívida Ativa).
   - Listagem com badges de gravidade (Gravíssima, Grave, Média, Leve) e dados de cada autuação.

5. **Exportação de Laudos em PDF (`pdfGenerator.ts` & `PdfService.ts`):**
   - Seção 5 de débitos atualizada para exibir tanto o total de autuações quanto os valores discriminados de tributos e fonte oficial.

## Arquivos Alterados
- `/shared/types/index.ts`
- `/server/providers/ApiBrasilProvider.ts`
- `/server/providers/ProviderRegistry.ts`
- `/server/services/QueryEngine.ts`
- `/src/components/ReportView.tsx`
- `/src/services/pdfGenerator.ts`
- `/server/services/PdfService.ts`

## Banco Alterado
- Nenhuma alteração estrutural no DDL requerida (o relatório em formato JSONB/objeto persiste nativamente os novos campos `fines` e `debitos`).

## Testes Executados
- `compile_applet` executado com sucesso (build Vite concluído sem erros).
- `lint_applet` executado com sucesso (TypeScript sem erros ou incompatibilidades de tipo).

## Erros Conhecidos
- Nenhum erro de compilação ou execução identificado.

## Próximo Passo Exato
- Adicionar filtros ou alertas específicos para compradores caso um veículo pesquisado possua débitos que excedam 20% do valor da tabela FIPE.
