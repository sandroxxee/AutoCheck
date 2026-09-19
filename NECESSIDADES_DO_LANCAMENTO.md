# GUIA COMPLETO: NECESSIDADES DO LANÇAMENTO & CREDENCIAIS REAIS

Este manual fornece o passo a passo prático, detalhado e técnico para você criar, obter e configurar cada uma das credenciais de produção necessárias para operar o **AutoCheck Brasil** com dados veiculares reais, cobrança via Pix e banco de dados persistente.

---

## 1. ORDEM RECOMENDADA DE CONFIGURAÇÃO

Siga rigorosamente esta sequência para garantir que cada camada seja testada antes de avançar para a próxima:

```
┌────────────────────────────────────────────────────────┐
│ 1. BANCO DE DADOS PERSISTENTE (PostgreSQL / Cloud SQL) │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. AUTENTICAÇÃO E CHAVES DE SEGURANÇA (Admin & JWT)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. PROVEDOR DE CONSULTAS VEICULARES (Hub Comercial)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. GATEWAY DE PAGAMENTOS (Mercado Pago ou Asaas Pix)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. WEBHOOKS, DOMÍNIO & HOMOLOGAÇÃO FINAL               │
└────────────────────────────────────────────────────────┘
```

---

## 2. DETALHAMENTO DAS CREDENCIAIS & COMO CRIÁ-LAS

---

### ETAPA 1 — Banco de Dados de Produção

#### `DATABASE_URL`
* **Finalidade:** Armazenar de forma definitiva contas de usuários, extrato de créditos, histórico de laudos gerados e chamados de suporte.
* **Origem dos Dados:** Servidor PostgreSQL dedicado ou nuvem gerenciada.
* **É Segredo?** 🔒 **SIM** (Fica apenas nas variáveis de ambiente do backend).
* **Documentação Oficial:**
  * Supabase: https://supabase.com/docs/guides/database
  * Neon Serverless: https://neon.tech/docs/introduction
  * Google Cloud SQL: https://cloud.google.com/sql/docs/postgres

#### 🛠️ Como criar e obter passo a passo:
1. **Opção Recomendada (Gratuita / Rápida) — Supabase ou Neon:**
   - Crie uma conta em https://supabase.com ou https://neon.tech.
   - Clique em **New Project** (escolha a região `São Paulo - South America` ou `US East`).
   - Defina uma senha forte para o banco de dados e salve-a.
   - Acesse **Project Settings** > **Database** > **Connection String** (URI).
   - Copie a string no formato:
     `postgresql://postgres:[SUA-SENHA]@db.[REF].supabase.co:5432/postgres`
2. **Onde configurar:** No arquivo `.env` de produção como `DATABASE_URL=...`.
3. **Como testar:** Ao iniciar o servidor, o log indicará a conexão estabelecida com o banco relacional.

---

### ETAPA 2 — Chaves de Segurança e Autenticação

#### `ADMIN_SECRET_KEY`
* **Finalidade:** Chave mestra utilizada para proteger o painel administrativo (`/admin`), alternância a quente de provedores e visualização de métricas financeiras.
* **É Segredo?** 🔒 **SIM**.

#### 🛠️ Como criar:
1. Gere um hash aleatório de alta entropia.
2. No terminal, execute:
   ```bash
   openssl rand -hex 32
   ```
   *(Ou utilize um gerador de senhas seguras com 32 a 64 caracteres alfanuméricos).*
3. **Onde configurar:** Adicione no `.env` como:
   `ADMIN_SECRET_KEY=sua_chave_secreta_aleatoria_aqui`

---

### ETAPA 3 — Provedor de Consultas Veiculares (Hub Comercial)

#### `VEHICLE_API_KEY` & `VEHICLE_API_URL`
* **Finalidade:** Consultar bases reais de leilão, histórico de roubo/furto, sinistros, gravames/restrições financeiras, histórico de proprietários e tabela FIPE.
* **Origem dos Dados:** Bases do Denatran/Senatran, Detrans estaduais, Sistema Nacional de Gravames (B3/SNG) e leiloeiros homologados no Brasil.
* **Provedores de Mercado Homologados:**
  * **InfoCar:** https://www.infocar.com.br/ (Líder em integração B2B com APIs RESTful)
  * **CheckAuto / Dekra:** https://www.checkauto.com.br/
  * **CarCheck:** https://www.carcheck.com.br/
  * **Olho no Carro (API Parceiros):** https://olhonocarro.com.br/
* **É Segredo?** 🔒 **SIM** (Backend somente).

#### 🛠️ Como criar e obter passo a passo:
1. Acesse o site de um dos provedores comerciais homologados (ex: InfoCar ou CarCheck).
2. Solicite uma conta **Pessoa Jurídica / Desenvolvedor B2B**.
3. Contrate um pacote pré-pago ou pós-pago de consultas veiculares (custo médio: R$ 1,20 a R$ 2,50 por consulta completa).
4. No painel do desenvolvedor do parceiro:
   - Copie o **Token de Autenticação / API Key**.
   - Copie a **URL Base da API de Produção** (ex: `https://api.infocar.com.br/v2`).
5. **Onde configurar:**
   ```env
   DEMO_MODE=false
   VEHICLE_API_KEY=seu_token_fornecido_pelo_provedor
   VEHICLE_API_URL=https://api.provedorparceiro.com.br
   ```
6. **Como testar:** Realize uma consulta no buscador com uma placa real de teste e confirme o retorno do laudo completo.

---

### ETAPA 4 — Gateway de Pagamento Pix (Mercado Pago ou Asaas)

#### `MERCADOPAGO_ACCESS_TOKEN` ou `ASAAS_API_KEY`
* **Finalidade:** Gerar QR Codes Pix dinâmicos na compra de pacotes de créditos e processar a liquidação bancária automática em menos de 5 segundos.
* **Origem dos Dados:** Banco Central do Brasil / Instituição de Pagamento autorizada.
* **É Segredo?** 🔒 **SIM**.
* **Documentação Oficial:**
  * Mercado Pago Developers: https://www.mercadopago.com.br/developers/pt/reference
  * Asaas API: https://docs.asaas.com/

#### 🛠️ Como criar no Mercado Pago passo a passo:
1. Acesse https://www.mercadopago.com.br/developers e faça login com sua conta Mercado Pago (recomendado conta Vendedor / PJ).
2. Vá em **Suas integrações** > **Criar aplicação**.
3. Nomeie como: `AutoCheck Brasil`.
4. Selecione a opção **Pagamentos online** > **Checkout Transparente / Pix**.
5. No menu lateral esquerdo, clique em **Credenciais de Produção**.
6. Preencha os dados do seu negócio (CNPJ ou CPF, categoria automotiva/serviços) para desbloquear as credenciais de produção.
7. Copie o **Access Token** de Produção (inicia com `APP_USR-...`).
8. Copie a **Chave Secreta de Webhook** (Webhook Secret).

#### 🛠️ Como criar no Asaas passo a passo:
1. Crie ou acesse sua conta em https://www.asaas.com.
2. Acesse **Configurações** > **Integrações** > **Chaves de API**.
3. Clique em **Gerar nova chave de API de Produção** e copie o token gerado.

#### ⚙️ Configuração no projeto:
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx-xxxxxx-xxxxxx
PAYMENT_WEBHOOK_SECRET=sua_chave_secreta_webhook
```

---

### ETAPA 5 — Configuração de Webhooks e Domínio Oficial

#### Cadastro da URL de Webhook no Gateway:
1. No painel do Mercado Pago / Asaas, acesse a aba **Webhooks / Notificações**.
2. Cadastre a URL de recebimento de notificações:
   `https://seu-dominio.com.br/api/webhook/payment` (ou a URL do Cloud Run).
3. Selecione os eventos: `payment.created`, `payment.updated`.
4. Cole o Secret gerado na variável `PAYMENT_WEBHOOK_SECRET`.

#### Configuração de Domínio & DNS:
1. Registre seu domínio (ex: `autocheck.com.br` no Registro.br).
2. Na zona de DNS da sua hospedagem / Cloudflare:
   - Adicione uma entrada tipo **A** ou **CNAME** apontando para o servidor de produção.
   - O certificado HTTPS (SSL) é emitido e renovado de forma 100% automática.

---

## 3. RESUMO CONSOLIDADO PARA O ARQUIVO `.env.production`

Ao preencher suas credenciais reais no servidor, seu arquivo de ambiente final ficará estruturado desta forma:

```env
# ==============================================================================
# AMBIENTE & OPERAÇÃO
# ==============================================================================
NODE_ENV=production
DEMO_MODE=false
APP_URL=https://autocheck.com.br
ADMIN_SECRET_KEY=sua_chave_secreta_gerada_com_openssl

# ==============================================================================
# BANCO DE DADOS
# ==============================================================================
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_banco

# ==============================================================================
# CONSULTAS VEICULARES
# ==============================================================================
VEHICLE_API_KEY=token_fornecido_pelo_provedor
VEHICLE_API_URL=https://api.provedor.com.br

# ==============================================================================
# GATEWAY DE PAGAMENTO (PIX)
# ==============================================================================
MERCADOPAGO_ACCESS_TOKEN=APP_USR-token_de_producao
PAYMENT_WEBHOOK_SECRET=secret_configurado_no_painel
```

---

## 4. ROTEIRO DE HOMOLOGAÇÃO E TESTE CONTROLADO

Após inserir as credenciais, execute o seguinte teste prático:

1. **Teste de Consulta Real:**
   - Faça login na sua conta.
   - Digite uma placa de teste real com autorização prévia.
   - Confirme se os dados de chassi, renavam mascarado, FIPE e débitos são retornados com fidelidade.
2. **Teste de Pagamento Real (R$ 1,00):**
   - Acesse a compra de créditos.
   - Selecione a recarga mínima via Pix.
   - Efetue o pagamento pelo aplicativo do seu banco via QR Code ou Copia e Cola.
   - Verifique se os créditos são adicionados no topo da tela em até 5 segundos de forma automática.
3. **Lançamento Oficial:**
   - Abra o sistema para tráfego público e divulgação aos clientes!
