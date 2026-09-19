# CHECKLIST DE PRODUÇÃO E PRÉ-LANÇAMENTO — AUTOCHECK BRASIL

Este documento consolida os itens de controle de pré-lançamento para homologação e liberação do sistema em ambiente de produção.

---

## 🔐 Segurança

- [x] **Secrets fora do frontend** — Nenhuma chave secreta, token ou senha exposta no bundle React do cliente.
- [x] **Secrets fora do Git** — Credenciais reais gerenciadas exclusivamente via variáveis de ambiente seguras (`process.env`).
- [x] **.env no .gitignore** — Arquivo `.env` ignorado e configurado no `.gitignore`.
- [x] **CORS configurado** — Middleware de cabeçalhos e permissões de origem estritas no Express.
- [x] **Rate limiting** — Limitador de taxa por IP ativo para prevenção de força bruta, scraping e abuso de requisições.
- [x] **Validação de entrada** — Validação rigorosa de formato de placas (Mercosul e formato antigo), e-mails, senhas e sanitização de dados.
- [x] **Autenticação** — Hash criptográfico de senha com SHA-256 + salt de segurança e sessões autenticadas.
- [x] **Autorização** — Separação e proteção de rotas por perfis de acesso (`role: 'admin'` vs `role: 'user'`).
- [x] **Logs sem dados sensíveis** — Logs de auditoria gravam apenas hashes de placa e timestamps, anonimizando dados pessoais de proprietários (LGPD).

---

## 🔌 APIs

- [x] **Provider configurado** — Adaptadores para hubs comerciais e contingência SINESP/SENATRAN estruturados (`ProviderRegistry`).
- [ ] **Endpoint confirmado** — Confirmar URL final de produção fornecida pelo parceiro de dados veiculares (`VEHICLE_API_URL`).
- [ ] **API key configurada** — Inserir a chave de produção fornecida pelo provedor contratado (`VEHICLE_API_KEY`).
- [x] **Timeout** — Timeouts controlados por requisição (4s a 6s) para evitar travamento em quedas de bases governamentais.
- [x] **Retry** — Mecanismo de re-tentativa com backoff para falhas transitórias de conexão.
- [x] **Fallback** — Rota de contingência e gerador estatístico acionados automaticamente se o provedor primário falhar.
- [x] **Rate limit** — Controle de taxa de chamadas aos provedores para respeitar limites de contrato.
- [x] **Tratamento de erro** — Modal de erro amigável (`QueryErrorModal`) com diagnóstico e opções de contingência para o usuário.

---

## 💳 Pagamento

- [x] **Provider escolhido** — Suporte a Mercado Pago e Asaas com fluxo de QR Code Pix dinâmico.
- [ ] **API key** — Inserir o Access Token de produção do gateway de pagamentos (`MERCADOPAGO_ACCESS_TOKEN` / `ASAAS_API_KEY`).
- [ ] **Webhook** — Cadastrar o endpoint `/api/webhook/payment` no painel do gateway de pagamento.
- [ ] **Secret do webhook** — Configurar a chave secreta de validação do webhook (`PAYMENT_WEBHOOK_SECRET`).
- [x] **Teste de pagamento** — Simulação em Sandbox funcional; teste real pendente de inserção de chave.
- [x] **Teste de falha** — Tratamento de expiração de QR Code Pix e recusas do gateway.
- [x] **Reembolso** — Procedimento e canal de atendimento estabelecidos para estorno de créditos via suporte.

---

## 🗄️ Banco

- [ ] **Banco de produção** — Configurar a URI de conexão do cluster PostgreSQL externo (`DATABASE_URL`).
- [x] **Schema** — Entidades e interfaces TypeScript unificadas (`ConsolidatedReport`, `UserAccount`, `CreditTransaction`, `SupportTicket`).
- [x] **Migrations** — Estrutura de dados com seeders padrão para administradores e planos comerciais.
- [x] **Backup** — Rotina de exportação sob demanda em JSON estruturado (`/api/export/json/:id`).
- [x] **Índices** — Indexação e busca rápida em memória por ID, placa, e-mail e data.
- [x] **Regras de acesso** — Isolamento de consultas por usuário e acesso irrestrito protegido ao administrador.

---

## 🌐 Deploy

- [ ] **Domínio** — Apontamento de DNS CNAME / A para o domínio oficial do produto (ex: `autocheck.com.br`).
- [x] **HTTPS** — Certificado SSL ativado automaticamente pela infraestrutura de borda (Cloud Run / CDN).
- [x] **Variáveis de ambiente** — Documentadas em `ENVIRONMENT_VARIABLES.md` e `.env.example`.
- [x] **Build** — Build de produção testado e aprovado com sucesso (`npm run build`).
- [x] **Deploy** — Aplicação empacotada e pronta para execução em contêiner (`node dist/server.cjs`).
- [x] **Logs** — Registro centralizado de auditoria operacional (`AuditLog`).
- [x] **Monitoramento** — Health check ativo em `/api/health`, latência por provedor e taxa de uptime.

---

## 📄 Legal

- [x] **Termos** — Termos de Uso e Condições Gerais de Prestação de Serviço disponíveis no rodapé e modais.
- [x] **Privacidade** — Política de Privacidade e Tratamento de Dados em conformidade com a LGPD (Lei 13.709/2018).
- [x] **Política de cookies quando aplicável** — Avisos e armazenamento local estritamente funcional para sessão.
- [x] **Avisos sobre limitações dos dados** — Disclaimer explícito sobre prazos de atualização de bases públicas estaduais.
- [x] **Contato** — Canal do Encarregado de Dados (DPO) e formulário integrado de Suporte & Atendimento.

---

## 🧪 Testes

- [x] **Cadastro** — Criação de conta com validação de campos e concessão automática de +2 créditos bônus.
- [x] **Login** — Autenticação com e-mail/senha, persistência de sessão e recuperação por código de 6 dígitos.
- [x] **Consulta** — Consulta de placa veicular no padrão Mercosul e cinza tradicional.
- [x] **Resultado** — Exibição do laudo consolidado com Score de Segurança (0 a 100), débitos, histórico e valor FIPE.
- [x] **Créditos** — Débito correto de saldo por consulta e extrato financeiro detalhado no perfil.
- [x] **Checkout** — Seleção de pacotes de crédito com cálculo de desconto progressivo e exibição do QR Code Pix.
- [x] **PDF** — Formatação executiva de laudo para impressão e download de PDF (`@media print`).
- [x] **Logout** — Encerramento seguro de sessão e limpeza de tokens de navegação.
- [x] **Mobile** — Interface responsiva testada com touch targets adequados e menus adaptados.
- [x] **Desktop** — Interface fluida em alta resolução com navegação rápida entre módulos.
