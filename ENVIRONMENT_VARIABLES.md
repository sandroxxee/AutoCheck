# MAPEAMENTO DE VARIÁVEIS DE AMBIENTE — AUTOCHECK BRASIL

Este documento contém todas as variáveis de ambiente necessárias e opcionais utilizadas pelo backend do AutoCheck Brasil.
NENHUM valor real de produção está registrado neste repositório.

---

## 1. Variáveis de Configuração e Infraestrutura

### `APP_URL`
- **Obrigatória:** Sim (em produção) / Automática (na Cloud Run)
- **Onde é usada:** `server.ts`, CORS, callbacks de autenticação e links de compartilhamento
- **Provider:** Infraestrutura de Hospedagem / Google Cloud Run / Vercel
- **Ambiente:** Desenvolvimento e Produção
- **Como obter:** URL pública do seu domínio ou URL do serviço Cloud Run
- **Documentação oficial:** https://cloud.google.com/run/docs
- **Status:** 🟢 Injetada automaticamente pelo ambiente de hospedagem

### `DEMO_MODE`
- **Obrigatória:** Sim
- **Onde é usada:** `server/providers/SinespProvider.ts`, `server/providers/CommercialProvider.ts`, `server/api/routes.ts`
- **Valores possíveis:** `"true"` (ambiente de testes/sandbox) ou `"false"` (modo estrito de produção com APIs reais)
- **Status:** 🟢 Configurada como `"true"` para homologação

### `ADMIN_SECRET_KEY`
- **Obrigatória:** Sim
- **Onde é usada:** `server/api/routes.ts` (middleware de autenticação administrativa)
- **Provider:** Interno da aplicação
- **Como obter:** Gerar uma chave aleatória segura (ex: `openssl rand -hex 32`)
- **Status:** 🟡 Necessária configurar valor exclusivo em produção

---

## 2. Provedores de Dados Veiculares

### `APIBRASIL_BEARER_TOKEN` (ou `APIBRASIL_TOKEN`)
- **Obrigatória:** Sim (quando utilizando o provedor APIBrasil)
- **Onde é usada:** `server/providers/ApiBrasilProvider.ts` e `/api/vehicle/check`
- **Provider:** APIBrasil (Gateway de Dados Veiculares)
- **Ambiente:** Produção / Homologação
- **Como obter:** Painel da APIBrasil em https://apibrasil.io
- **Status:** 🟡 Chave Bearer de autenticação

### `CONSULTA_VEICULAR_API_URL`
- **Obrigatória:** Sim (ou fallback padrão `https://gateway.apibrasil.io/api/v2/vehicles/dados`)
- **Onde é usada:** `server/providers/ApiBrasilProvider.ts`
- **Provider:** APIBrasil
- **Status:** 🟢 URL do endpoint de consulta de veículos

### `APIBRASIL_DEVICE_TOKEN`
- **Obrigatória:** Sim (fornecido junto à credencial da APIBrasil)
- **Onde é usada:** `server/providers/ApiBrasilProvider.ts`
- **Provider:** APIBrasil
- **Status:** 🟡 Token de dispositivo / autorização do cliente

### `VEHICLE_API_KEY`
- **Obrigatória:** Sim (quando `DEMO_MODE=false`)
- **Onde é usada:** `server/providers/CommercialProvider.ts`
- **Provider:** Provedor Automotivo Homologado (ex: InfoCar, CheckAuto, CarCheck, Olho no Carro)
- **Ambiente:** Produção
- **Como obter:** Painel do parceiro comercial após contratação do plano de consultas em lote
- **Status:** 🟡 Necessária para consultas reais de histórico, leilão e gravame

### `VEHICLE_API_URL`
- **Obrigatória:** Sim (quando `DEMO_MODE=false`)
- **Onde é usada:** `server/providers/CommercialProvider.ts`
- **Provider:** Provedor Automotivo Homologado
- **Ambiente:** Produção
- **Como obter:** Fornecido no manual de integração da API do parceiro comercial contratado
- **Status:** 🟡 Necessária

### `SINESP_API_KEY`
- **Obrigatória:** Opcional / Convênio Governamental
- **Onde é usada:** `server/providers/SinespProvider.ts`
- **Provider:** Ministério da Justiça e Segurança Pública (MJSP) / SERPRO
- **Ambiente:** Produção
- **Como obter:** Convênio governamental direto ou chave de API de trânsito credenciada
- **Status:** ⚪ Opcional (o fallback cobre via hub comercial)

### `SENATRAN_API_KEY`
- **Obrigatória:** Opcional / Convênio SERPRO
- **Onde é usada:** `server/providers/SenatranProvider.ts`
- **Provider:** SERPRO / SENATRAN
- **Ambiente:** Produção
- **Como obter:** Credenciamento SERPRO RENAVAM / Gov.br
- **Documentação oficial:** https://servicos.serpro.gov.br
- **Status:** ⚪ Opcional

---

## 3. Banco de Dados e Persistência

### `DATABASE_URL`
- **Obrigatória:** Sim (para persistência em banco externo PostgreSQL / Cloud SQL)
- **Onde é usada:** `server/services/db.ts`
- **Provider:** PostgreSQL / Cloud SQL / Supabase / Neon
- **Ambiente:** Produção
- **Como obter:** URI de conexão do seu cluster PostgreSQL: `postgresql://user:password@host:5432/autocheck`
- **Status:** 🟡 Necessária para deploy em larga escala

---

## 4. Pagamentos & Gateways (Pix / Cartão)

### `MERCADOPAGO_ACCESS_TOKEN` ou `ASAAS_API_KEY`
- **Obrigatória:** Sim (para geração de QR Code Pix e cobrança automática real)
- **Onde é usada:** Rotas de checkout e emissão de Pix
- **Provider:** Mercado Pago, Asaas ou Efi Bank
- **Ambiente:** Produção
- **Como obter:** Painel de Desenvolvedores da instituição financeira
- **Documentação oficial:** https://www.mercadopago.com.br/developers / https://docs.asaas.com
- **Status:** 🟡 Necessária

### `PAYMENT_WEBHOOK_SECRET`
- **Obrigatória:** Sim (para confirmação automática instantânea do Pix recebido)
- **Onde é usada:** Endpoint `/api/webhook/payment`
- **Provider:** Gateway de Pagamento
- **Status:** 🟡 Necessária
