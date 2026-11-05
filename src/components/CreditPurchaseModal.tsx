import React, { useState, useEffect } from 'react';
import { X, Zap, QrCode, CheckCircle2, Copy, Check, ArrowRight, Clock, Gift, ShieldCheck } from 'lucide-react';
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
    packages.find(p => p.id === 'pack_complete') || packages[0] || {
      id: 'pack_complete',
      name: '1 Consulta Completa',
      credits: 1,
      priceBrl: 49.90,
      pricePerCredit: 49.90,
      badge: 'Unidade'
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
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (isOpen && packages && packages.length > 0) {
      const defaultPkg = packages.find(p => p.id === 'pack_complete') || packages[0];
      setSelectedPkg(defaultPkg);
    }
  }, [isOpen, packages]);

  useEffect(() => {
    if (isOpen && pixData) {
      setCountdown(60);
    }
  }, [isOpen, pixData]);

  useEffect(() => {
    if (!isOpen || !pixData || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, pixData, countdown]);

  if (!isOpen) return null;

  const handleStartPixPayment = async () => {
    triggerHaptic('medium');
    try {
      setLoading(true);
      const res = await api.generatePix({
        amount: selectedPkg.priceBrl,
        description: `AutoCheck ${selectedPkg.name} (${selectedPkg.credits} créditos)`,
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
      const result = await api.confirmPix({
        txId: pixData?.txId || 'tx_' + Date.now(),
        packageId: selectedPkg.id,
        reportId: targetReportId,
        amount: selectedPkg.priceBrl
      });

      if (!result.success) {
        throw new Error(result.message || 'Pagamento ainda não identificado. Aguarde alguns segundos e tente verificar novamente.');
      }

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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Adquirir Consultas & Créditos
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
                {selectedPkg.credits} crédito(s) adicionados à sua conta com sucesso.
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.copyPaste}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 select-all"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Confirmation Simulation Box */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Aguardando Confirmação Bancária...</span>
                  <span className="font-mono text-amber-700">{countdown}s</span>
                </div>
                <button
                  onClick={handleConfirmPixPayment}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verificar pagamento PIX</span>
                </button>
              </div>

              <button
                onClick={() => setPixData(null)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-2"
              >
                ← Escolher outro pacote
              </button>
            </div>
          ) : (
            /* Package Selection List */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedPkg(pkg);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{pkg.name}</h4>
                            {pkg.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {pkg.credits} {pkg.credits === 1 ? 'consulta completa' : 'consultas completas'} • R$ {pkg.pricePerCredit.toFixed(2).replace('.', ',')} por consulta
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                          R$ {pkg.priceBrl.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loyalty Bonus Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 text-xs text-indigo-900 font-medium">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-bold text-indigo-950">Programa de Fidelidade:</strong> A cada 10 consultas pagas completadas, você ganha <strong>1 consulta completa totalmente grátis</strong>!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {!completed && !pixData && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
            <div>
              <span className="text-[11px] text-slate-500 block">Total a pagar</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                R$ {selectedPkg.priceBrl.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button
              onClick={handleStartPixPayment}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>Gerar QR Code Pix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
