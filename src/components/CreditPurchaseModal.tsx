import React, { useState } from 'react';
import { X, Zap, QrCode, CheckCircle2, Copy, Check, ArrowRight, Clock, Gift } from 'lucide-react';
import { CreditPackage } from '../types/index.ts';
import { api } from '../services/api.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: CreditPackage[];
  onSuccess: (creditsAdded: number) => void;
  targetReportId?: string;
  onReportUnlocked?: () => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  packages,
  onSuccess,
  targetReportId,
  onReportUnlocked
}) => {
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(
    packages[0] || {
      id: 'pack_3',
      name: 'Pacote Essencial',
      credits: 3,
      priceBrl: 119.90,
      pricePerCredit: 39.96,
      badge: 'Popular'
    }
  );
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pixData, setPixData] = useState<{
    copyPaste: string;
    qrCodeUrl: string;
    txId: string;
    amount: number;
    beneficiaryName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleStartPixPayment = async () => {
    triggerHaptic('medium');
    try {
      setLoading(true);
      const res = await api.generatePix({
        amount: selectedPkg.priceBrl,
        description: `AutoCheck ${selectedPkg.name}`,
        packageId: selectedPkg.id,
        reportId: targetReportId
      });

      if (res.success && res.pix) {
        triggerHaptic('success');
        setPixData(res.pix);
      } else {
        triggerHaptic('error');
        throw new Error('Falha ao gerar cobrança PIX.');
      }
    } catch (err: unknown) {
      triggerHaptic('error');
      alert((err as Error).message || 'Falha ao iniciar pagamento PIX.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPixPayment = async () => {
    triggerHaptic('medium');
    try {
      setLoading(true);
      await api.confirmPix({
        txId: pixData?.txId || 'tx_' + Date.now(),
        packageId: selectedPkg.id,
        reportId: targetReportId,
        amount: selectedPkg.priceBrl
      });

      triggerHaptic('success');
      setCompleted(true);
      onSuccess(selectedPkg.credits);
      if (onReportUnlocked) onReportUnlocked();

      setTimeout(() => {
        setCompleted(false);
        setPixData(null);
        onClose();
      }, 2500);
    } catch (err: unknown) {
      triggerHaptic('warning');
      alert((err as Error).message || 'Falha ao confirmar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.copyPaste);
    triggerHaptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white border border-blue-200/90 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] text-slate-900 animate-in zoom-in-95 overflow-hidden">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Desbloquear Consultas & Laudo
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Liberação instantânea com emissão de PDF oficial via PIX
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setPixData(null);
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 overscroll-contain">
          {completed ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-black text-slate-900">Pagamento Confirmado!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
                Seus créditos e laudo completo foram liberados com sucesso.
              </p>
            </div>
          ) : pixData ? (
            /* PIX Screen with QR Code and Copia e Cola */
            <div className="space-y-4 sm:space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pague via PIX para liberação imediata
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
                  R$ {pixData.amount.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Beneficiário: <strong className="text-slate-900">{pixData.beneficiaryName}</strong>
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-2xl w-40 h-40 sm:w-44 sm:h-44 mx-auto flex items-center justify-center shadow-sm border-2 border-emerald-500">
                <img
                  src={pixData.qrCodeUrl}
                  alt="QR Code Pix"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Copia e Cola input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Código Pix Copia e Cola:</span>
                  <span className="text-amber-700 text-[11px] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 15 min
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.copyPaste}
                    className="w-full min-w-0 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none select-all truncate"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmation button */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleConfirmPixPayment}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Verificando pagamento...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Já fiz o Pix / Liberar Laudo Agora</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setPixData(null)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-900 py-1 transition-colors cursor-pointer font-medium"
                >
                  Escolher outro pacote
                </button>
              </div>
            </div>
          ) : (
            /* Package Selector (PIX Only) */
            <>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Escolha o pacote de consultas (PIX Instantâneo):
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Créditos não expiram</span>
                </div>

                {/* Responsive Package List / Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {packages.map((pkg) => {
                    const isSelected = selectedPkg.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedPkg(pkg);
                        }}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Radio Circle */}
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {pkg.name || `${pkg.credits} ${pkg.credits === 1 ? 'Consulta' : 'Consultas'}`}
                              </span>
                              {pkg.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                                  pkg.badge.toLowerCase().includes('mais') || pkg.badge.toLowerCase().includes('popular')
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : pkg.badge.toLowerCase().includes('maior') || pkg.badge.toLowerCase().includes('economia')
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {pkg.credits === 1 ? '1 Consulta Completa' : `${pkg.credits} consultas completas`}
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-mono font-black text-sm sm:text-base text-slate-900">
                            R$ {pkg.priceBrl.toFixed(2).replace('.', ',')}
                          </p>
                          {pkg.pricePerCredit && pkg.credits > 1 && (
                            <p className="text-[9px] text-slate-500">
                              R$ {pkg.pricePerCredit.toFixed(2).replace('.', ',')}/un
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Loyalty reminder note */}
                <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-2.5 flex items-center gap-2 text-xs text-blue-950">
                  <Gift className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-[11px] leading-snug">
                    <strong className="text-blue-950">Programa de Fidelidade:</strong> A cada 10 consultas pagas, você ganha <strong>1 consulta completa gratuita</strong>.
                  </p>
                </div>
              </div>

              {/* PIX Badge info */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">Pagamento via PIX</p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Gera QR Code instantâneo com liberação imediata do laudo.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer for Total & Checkout Action */}
        {!completed && !pixData && (
          <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total a pagar</p>
              <p className="text-lg sm:text-xl font-black text-slate-900 font-mono leading-none mt-0.5">
                R$ {selectedPkg.priceBrl.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <button
              id="modal-confirm-buy-credits-btn"
              onClick={handleStartPixPayment}
              disabled={loading}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Gerando PIX...</span>
                </div>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Gerar QR Code Pix</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
