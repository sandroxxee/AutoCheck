import React from 'react';
import {
  X,
  Zap,
  ShieldAlert,
  Coins,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  QrCode
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics.ts';

interface NoCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plate: string;
  currentCredits: number;
  onOpenPixCheckout: (plate: string) => void;
  onOpenPackagesModal: () => void;
  onClaimSandboxCredits?: () => Promise<void>;
  onSelectSamplePlate?: (samplePlate: string) => void;
}

export const NoCreditsModal: React.FC<NoCreditsModalProps> = ({
  isOpen,
  onClose,
  plate,
  currentCredits,
  onOpenPixCheckout,
  onOpenPackagesModal,
  onClaimSandboxCredits,
  onSelectSamplePlate
}) => {
  if (!isOpen) return null;

  const cleanPlate = (plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  const handleCheckoutPlate = () => {
    triggerHaptic('medium');
    onClose();
    onOpenPixCheckout(cleanPlate);
  };

  const handleOpenPackages = () => {
    triggerHaptic('medium');
    onClose();
    onOpenPackagesModal();
  };

  return (
    <div
      id="no-credits-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="no-credits-modal-card"
        className="relative w-full max-w-lg bg-white border border-amber-200/90 rounded-3xl shadow-2xl overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200 flex flex-col"
      >
        {/* Top Warning Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600" />

        {/* Close Button */}
        <button
          id="no-credits-modal-close-btn"
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer z-20"
          aria-label="Fechar notificação"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header with Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-xs">
              <Coins className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              Saldo Insuficiente
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Você Não Possui Créditos de Consulta
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto">
              Para consultar o histórico consolidado completo da placa informada, é necessário pelo menos 1 crédito.
            </p>
          </div>

          {/* Requested Plate & Credit Status Pill Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Placa Solicitada
              </span>
              <div className="px-3 py-1 rounded-lg bg-white border border-slate-300 font-mono font-black text-sm text-blue-700 shadow-2xs tracking-wider">
                {cleanPlate || 'NÃO INFORMADA'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white border border-rose-200 text-center shadow-2xs">
                <span className="block text-[11px] font-bold text-rose-700 uppercase">Seu Saldo Atual</span>
                <span className="block text-xl font-black text-rose-600 font-mono">
                  {currentCredits} {currentCredits === 1 ? 'crédito' : 'créditos'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-200 text-center shadow-2xs">
                <span className="block text-[11px] font-bold text-blue-700 uppercase">Necessário</span>
                <span className="block text-xl font-black text-blue-700 font-mono">
                  1 crédito
                </span>
              </div>
            </div>
          </div>

          {/* Benefits Bullet Points */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-2">
            <p className="font-extrabold text-blue-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              O que a consulta completa vai revelar:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                Histórico de Leilão & Sinistro
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                Gravame & Alienação Financeira
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                Bloqueios Renajud & Restrições
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                Débitos, IPVA & Multas Estaduais
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              id="no-credits-btn-pix"
              type="button"
              onClick={handleCheckoutPlate}
              className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-white" />
              <span>Liberar Consulta Desta Placa via Pix (R$ 49,90)</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <button
              id="no-credits-btn-packages"
              type="button"
              onClick={handleOpenPackages}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Ver Pacotes com Desconto (a partir de R$ 39,90/unidade)</span>
            </button>
          </div>

          {/* Sandbox Development Testing Section */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Ambiente de Testes / Sandbox:
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                100% Grátis
              </span>
            </div>
            <p className="text-[11px] text-amber-900/90 font-medium">
              Em desenvolvimento, você pode testar gratuitamente com <strong>placas demonstrativas</strong> ou adicionar créditos de teste:
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { plate: 'BRA2E19', label: 'BRA2E19 (Regular)' },
                { plate: 'ABC1D23', label: 'ABC1D23 (Leilão)' },
                { plate: 'SAV1010', label: 'SAV1010 (Sinistro)' },
                { plate: 'ROU8080', label: 'ROU8080 (Roubo)' }
              ].map((item) => (
                <button
                  key={item.plate}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onClose();
                    onSelectSamplePlate?.(item.plate);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[11px] font-mono font-bold text-slate-800 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
            {onClaimSandboxCredits && (
              <button
                type="button"
                id="no-credits-claim-sandbox-btn"
                onClick={async () => {
                  triggerHaptic('medium');
                  await onClaimSandboxCredits();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span>🧪 Resgatar +5 Créditos Gratuitos para Testes</span>
              </button>
            )}
          </div>

          {/* Footer Security Note */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
              <Lock className="w-3 h-3 text-slate-400" />
              Liberação automática via Pix imediato • Sem taxa de mensalidade
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
