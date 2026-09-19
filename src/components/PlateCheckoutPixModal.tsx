import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  AlertTriangle,
  Gavel,
  BadgePercent,
  Car
} from 'lucide-react';
import { api } from '../services/api.ts';
import { UserAccount } from '../types/index.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { MercosulPlate } from './MercosulPlate.tsx';

interface PlateCheckoutPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  plate: string;
  user: UserAccount | null;
  onConfirmAndSearch: (plate: string) => void;
  onOpenAuth?: () => void;
}

export const PlateCheckoutPixModal: React.FC<PlateCheckoutPixModalProps> = ({
  isOpen,
  onClose,
  plate,
  user,
  onConfirmAndSearch,
  onOpenAuth
}) => {
  const [step, setStep] = useState<'pix' | 'success'>('pix');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 min countdown

  const [pixData, setPixData] = useState<{
    copyPaste: string;
    qrCodeUrl: string;
    txId: string;
    amount: number;
    beneficiaryName: string;
    beneficiaryCity: string;
    pixKey?: string;
  } | null>(null);

  const cleanPlate = (plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // Auto generate PIX immediately when opened with plate
  useEffect(() => {
    if (isOpen && cleanPlate) {
      setStep('pix');
      setErrorMessage(null);
      setCopied(false);
      setTimeLeft(900);
      generatePixForPlate();
    }
  }, [isOpen, cleanPlate]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || step !== 'pix') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step]);

  const generatePixForPlate = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await api.generatePix({
        amount: 49.90,
        description: `AutoCheck Laudo Placa ${cleanPlate}`,
        packageId: 'pack_complete'
      });

      if (res.success && res.pix) {
        setPixData(res.pix);
      } else {
        throw new Error('Falha ao gerar o QR Code PIX.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao gerar cobrança PIX.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Confirm PIX and trigger automatic search
  const handleConfirmPix = async () => {
    triggerHaptic('medium');
    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await api.confirmPix({
        txId: pixData?.txId || 'tx_' + Date.now(),
        plate: cleanPlate,
        packageId: 'pack_complete',
        amount: 49.90
      });

      if (!res.success) {
        triggerHaptic('warning');
        throw new Error(res.message || 'Pagamento ainda não detectado.');
      }

      triggerHaptic('success');
      setStep('success');

      // Execute search and redirect to report view after short celebratory delay
      setTimeout(() => {
        onConfirmAndSearch(cleanPlate);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      triggerHaptic('warning');
      setErrorMessage((err as Error).message || 'Falha ao confirmar pagamento.');
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

  const handleCopyPixKey = () => {
    const keyToCopy = pixData?.pixKey || '09512592967';
    navigator.clipboard.writeText(keyToCopy);
    triggerHaptic('success');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 border border-blue-200/90 p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,34,119,0.35)] text-slate-900 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Top Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600" />

        {/* Close button */}
        <button
          id="checkout-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: PIX Screen with QR Code and Copia e Cola */}
        {step === 'pix' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Header with Plate Badge */}
            <div className="text-center pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Pagamento Seguro via PIX</span>
              </div>

              {/* Realistic Mercosul Plate Graphic */}
              <div className="flex justify-center my-2">
                <MercosulPlate
                  plate={cleanPlate || 'BRA2E19'}
                  size="sm"
                  showRivets={true}
                  showHologram={true}
                />
              </div>

              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-[#002277] font-mono">
                  R$ 49,90
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Liberação Imediata
                </span>
              </div>
            </div>

            {/* QR Code Container */}
            {pixData ? (
              <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-lg border-2 border-emerald-400">
                <img
                  src={pixData.qrCodeUrl}
                  alt="QR Code Pix"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : loading ? (
              <div className="w-44 h-44 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-bold">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Gerando QR Code Pix...</span>
              </div>
            ) : null}

            {/* Copia e Cola Box & Chave PIX */}
            {pixData && (
              <div className="space-y-3">
                {/* Copia e Cola Payload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Código PIX Copia e Cola:</span>
                    <span className="text-amber-700 font-mono text-[11px] flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Expira em {formatTime(timeLeft)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.copyPaste}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-[11px] text-slate-800 font-mono focus:outline-none select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all cursor-pointer active:scale-95 ${
                        copied
                          ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-white" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Chave PIX Direta Box & Button */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chave PIX Oficial:</p>
                    <p className="text-xs font-mono font-bold text-slate-800 truncate select-all">
                      {pixData.pixKey || '09512592967'}
                    </p>
                  </div>

                  <button
                    type="button"
                    id="copy-pix-key-direct-btn"
                    onClick={handleCopyPixKey}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer border shadow-xs active:scale-95 ${
                      copiedKey
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Chave Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>Copiar Chave PIX</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-2.5 text-xs text-blue-900 font-medium flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                1
              </div>
              <p className="text-[11px] leading-tight">
                Pague no app do seu banco via <strong>QR Code</strong> ou <strong>Copia e Cola</strong> e clique abaixo para confirmar.
              </p>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Confirm Payment Button */}
            <div className="pt-1 space-y-2">
              <button
                id="checkout-confirm-payment-done-btn"
                onClick={handleConfirmPix}
                disabled={loading}
                className="w-full min-h-[54px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base shadow-[0_10px_25px_-5px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando pagamento...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Confirmar Pix e Gerar Laudo</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                Ambiente 100% Criptografado e Seguro
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Confirmed & Automatic Search Trigger */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4 animate-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-[#020617] tracking-tight">
                Pagamento Confirmado!
              </h4>
              <p className="text-xs text-emerald-800 font-bold mt-1">
                Placa <span className="font-mono text-emerald-950 font-black">{cleanPlate}</span> confirmada com sucesso
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 max-w-sm mx-auto text-xs text-blue-900 font-semibold space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Car className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Gerando laudo veicular oficial...</span>
              </div>
              <p className="text-[11px] text-slate-500">Abrindo relatório na tela em instantes...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
