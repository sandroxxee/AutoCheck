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
                A AutoCheck Brasil preza pela privacidade de todos os usuários e cidadãos, atuando em estrita observância à Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Não Exposição de Dados Pessoais Sensíveis</h4>
              <p>
                Nossos relatórios não divulgam CPF completo, endereço residencial, telefone ou dados privados de pessoas físicas. Quaisquer identificadores são obrigatoriamente mascarados (ex: ***.456.789-**).
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Coleta e Finalidade de Dados</h4>
              <p>
                Armazenamos exclusivamente registros de consultas (logs técnicos) para fins de segurança, auditoria antifraude e controle de créditos adquiridos. Não comercializamos listas de dados com terceiros não autorizados.
              </p>
            </div>
          )}

          {tab === 'termos' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">1. Natureza do Serviço</h4>
              <p>
                A plataforma disponibiliza serviço de agregação e enriquecimento de dados cadastrais e veiculares oriundos de bases públicas e parceiros integradores homologados.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Disponibilidade das Fontes Governamentais</h4>
              <p>
                Em casos de indisponibilidade temporária de bases estaduais (DETRAN/SEFAZ), os registros já homologados serão apresentados com indicação de data e hora do último cruzamento seguro.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Aquisição de Créditos</h4>
              <p>
                Os créditos adquiridos não possuem prazo de expiração e podem ser utilizados para emissão de laudos completos ou compartilhamento a qualquer momento.
              </p>
            </div>
          )}

          {tab === 'uso-responsavel' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">1. Recomendações de Compra Segura</h4>
              <p>
                O laudo pericial é uma ferramenta de inteligência documental prévia e essencial. Recomendamos veementemente que o comprador também realize uma vistoria física presencial e checagem mecânica de chassi antes do pagamento do veículo.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Verificação de Chassi e Motor</h4>
              <p>
                Certifique-se sempre de que os caracteres gravados no vidro, chassi e motor conferem literalmente com os dados auditados no laudo oficial.
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
