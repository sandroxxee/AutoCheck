import React from 'react';
import { X, ShieldCheck, FileText, AlertTriangle, Lock } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacidade' | 'termos' | 'uso-responsavel';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacidade'
}) => {
  const [tab, setTab] = React.useState<'privacidade' | 'termos' | 'uso-responsavel'>(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-white border border-blue-200/90 shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Central de Conformidade & Legal</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 text-xs font-bold">
          <button
            onClick={() => setTab('privacidade')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              tab === 'privacidade'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Política de Privacidade (LGPD)
          </button>

          <button
            onClick={() => setTab('termos')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              tab === 'termos'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Termos de Uso
          </button>

          <button
            onClick={() => setTab('uso-responsavel')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              tab === 'uso-responsavel'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Uso Responsável & Vistoria
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed max-h-[60vh]">
          {tab === 'privacidade' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">1. Compromisso com a Privacidade e LGPD</h4>
              <p>
                A AutoCheck Brasil preza pela privacidade de todos os cidadãos e clientes, atuando em estrita conformidade com a Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD).
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Não Armazenamento de Dados de Proprietários (PII)</h4>
              <p>
                <strong>Regra Estrita de Privacidade:</strong> Não salvamos nome, CPF ou endereço residencial do proprietário do veículo em nosso banco de dados. Caso retornado temporariamente pela API no ato da busca, os dados pessoais são exibidos no instante e descartados imediatamente, sem qualquer retenção no servidor.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Política de Expurgo em 90 Dias</h4>
              <p>
                Todos os logs técnicos de requisição, auditoria de segurança e dados transacionais temporários são automaticamente purgados e deletados do sistema após o período improrrogável de 90 (noventa) dias.
              </p>

              <h4 className="text-sm font-bold text-slate-900">4. Dados Fiscais e Transacionais</h4>
              <p>
                Registros fiscais e comprovantes de pagamento via PIX são mantidos estritamente pelo prazo exigido pela legislação tributária e bancária brasileira, assegurando conformidade com Mercado Pago, Efí e Receita Federal.
              </p>
            </div>
          )}

          {tab === 'termos' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">1. Natureza do Serviço: Consulta de Histórico Veicular</h4>
              <p>
                A AutoCheck Brasil é um serviço de agregação informativa e cruzamento de dados públicos e privados consolidados. <strong>Nosso serviço NÃO é e NÃO substitui laudo pericial, vistoria cautelar ou inspeção de transferência</strong> (atribuições exclusivas de Empresas Credenciadas de Vistoria - ECV e despachantes devidamente credenciados).
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Disclaimer Obrigatório</h4>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium text-[11px]">
                "Dados informativos conforme bases oficiais no momento da consulta. Não substitui vistoria cautelar e não garante ausência de débitos. Consulte DETRAN para validação."
              </div>

              <h4 className="text-sm font-bold text-slate-900">3. Dados Fiscais da Empresa</h4>
              <p>
                Operação registrada sob CNPJ: 52.194.882/0001-94 • AutoCheck Brasil Tecnologia Veicular LTDA. Comprovantes e recibos de pagamento podem ser solicitados ou emitidos diretamente pela plataforma.
              </p>

              <h4 className="text-sm font-bold text-slate-900">4. Aquisição de Créditos</h4>
              <p>
                Os créditos adquiridos não possuem prazo de expiração e podem ser utilizados para consultar o histórico completo de veículos e baixar relatórios em PDF a qualquer momento.
              </p>
            </div>
          )}

          {tab === 'uso-responsavel' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">1. Recomendações de Compra Segura</h4>
              <p>
                A consulta de histórico veicular é uma ferramenta de inteligência documental prévia fundamental. Recomendamos veementemente que o comprador realize também vistoria cautelar presencial em ECV credenciada e inspeção mecânica especializada antes de efetivar qualquer pagamento ou transferência.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Verificação de Chassi e Motor</h4>
              <p>
                Certifique-se sempre de que os caracteres gravados no vidro, chassi e motor conferem literalmente com os dados auditados no histórico oficial do veículo.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">AutoCheck Brasil • Segurança na Compra de Veículos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
