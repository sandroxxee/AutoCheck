# AutoCheck Brasil / Hunter de Ofertas & Inteligência Veicular

> **AVISO DE PROPRIEDADE INTELECTUAL E DIREITOS AUTORAIS RESERVADOS**  
> **Autor, Criador e Arquiteto de Software:** **Sandro Luiz Mayer**  
> **Copyright © 2024-2026 Sandro Luiz Mayer.** Todos os direitos reservados.

---

## 🔒 Declaração de Propriedade Intelectual & Proteção Anti-Plágio

Este software, incluindo seu código-fonte, arquitetura de microsserviços, pipeline de inteligência veicular, esquemas de banco de dados, matrizes de cálculo de score de risco/oportunidade, algoritmos de normalização, rotas de API e interfaces de usuário, é de **titularidade intelectual e criação exclusiva de SANDRO LUIZ MAYER**.

### Proibições Expressas (Anti-Copy / Anti-Plágio):
1. **Reprodução e Cópia Não Autorizadas:** É expressamente proibida qualquer cópia, clonagem, espelhamento, transcrição ou reprodução parcial ou total deste repositório, seus arquivos, algoritmos ou documentação sem prévia e expressa autorização por escrito de **Sandro Luiz Mayer**.
2. **Engenharia Reversa e Decompilação:** Fica vedada a descompilação, engenharia reversa, desmontagem ou tentativa de derivar o código-fonte original ou segredos de negócio dos módulos compilados ou rotas restritas.
3. **Extração Não Autorizada de Dados e Rotas (Scraping/Harvesting):** É proibido o uso de robôs, crawlers, scrapers ou rotinas automatizadas para captura de endpoints de API (`/api/*`), estruturas de dados internas, tabelas de referência ou parâmetros de precificação do sistema.
4. **Uso Indevido de Marca e Identidade Visual:** As marcas, logotipos, layouts, fluxos de vistoria e identidades visuais contidas neste projeto constituem patrimônio do criador e são protegidas pelas leis de propriedade industrial e autoral.

### Base Legal Aplicável:
* **Lei Federal nº 9.609/1998** (Proteção da Propriedade Intelectual de Programa de Computador).
* **Lei Federal nº 9.610/1998** (Lei de Direitos Autorais do Brasil).
* **Artigo 184 do Código Penal Brasileiro** (Violação de Direito Autoral e Pirataria).
* **Lei Federal nº 13.709/2018** (Lei Geral de Proteção de Dados Pessoais - LGPD).

---

## 🏛️ Visão Geral da Arquitetura do Sistema

O **AutoCheck Brasil** é uma solução completa de inteligência veicular que consolida informações analíticas, histórico de procedência, leilão, sinistros, gravame, restrições judiciais/administrativas, débitos tributários estaduais e multas Renainf através de provedores homologados em tempo real.

### Componentes Principais:
* **Orquestrador de Consultas (`QueryEngine`):** Gerencia a fila de provedores cadastrados (Placafipe, APIBrasil, Sinesp, etc.), aplicando balanceamento, cache em memória/persistente e failover transparente em caso de indisponibilidade.
* **Motor de Score de Risco (0 a 100):** Algoritmo proprietário desenvolvido por **Sandro Luiz Mayer** que pondera de forma multidimensional fatores como sinistro com perda total, passagem por leilão (pequena, média ou grande monta), restrições financeiras (Renajud/Gravame), débitos tributários acumulados e histórico de recall pendente.
* **Módulo de Fidelidade e Recompensas:** Mecanismo transacional de fidelidade onde cada 10 consultas pagas concedem automaticamente 1 crédito de vistoria 100% gratuita.
* **Gerador de Laudos Oficiais (PDF & Web Share):** Exportação de relatórios periciais autenticados com chave de auditoria, QR Code de validação e compartilhamento integrado via Web Share API para WhatsApp e e-mail.

---

## 🛡️ Proteção de Rotas e Endpoints da API

Todas as rotas de API utilizam blindagem com autenticação por cabeçalhos, limitação de taxa (Rate Limiting), validação estrita de esquemas e proteção server-side para chaves de API secretas (`GEMINI_API_KEY`, `APIBRASIL_BEARER_TOKEN`, `PLACA_FIPE_TOKEN`, etc.).

### Endpoints Protegidos do Sistema:
| Rota | Método | Descrição | Nível de Acesso |
| :--- | :---: | :--- | :---: |
| `/api/vehicle/check` | `POST` | Execução de consulta pericial consolidada por placa | Autenticado / Créditos |
| `/api/vehicle/report/:id` | `GET` | Recuperação de laudo já emitido para auditoria | Livre com ID válido |
| `/api/user/loyalty` | `GET` | Verificação do saldo e progresso do programa de fidelidade | Autenticado |
| `/api/user/profile` | `GET` | Dados cadastrais e consumo de vistorias | Autenticado |
| `/api/user/transactions` | `GET` | Extrato transacional detalhado | Autenticado |
| `/api/admin/metrics` | `GET` | Métricas operacionais, consumo de provedores e logs de auditoria | Admin Restrito |
| `/api/health` | `GET` | Verificação de integridade e prontidão da infraestrutura | Sistema |

---

## 💻 Tecnologias Empregadas

* **Backend & Orquestração:** Node.js, TypeScript, Express, Zod.
* **Frontend & Experiência de Usuário:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
* **Geração de Documentos:** jsPDF com renderização vetorial e diagramação pericial.
* **Segurança e Conformidade:** Criptografia de ponta a ponta, isolamento de chaves no servidor e conformidade com LGPD.

---

## 👨‍💻 Autoria e Contato

* **Criador e Desenvolvedor Principal:** Sandro Luiz Mayer
* **E-mail de Contato:** sandrooxxee@gmail.com
* **Projeto:** AutoCheck Brasil / Hunter de Ofertas

Para solicitações de licenciamento, parcerias comerciais ou permissões especiais de uso, entre em contato diretamente com o autor.
