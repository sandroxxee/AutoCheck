import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowDown, HelpCircle, Check, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics.ts';

interface HomeOnboardingTooltipProps {
  onSelectSamplePlate?: (plate: string) => void;
  onFocusInput?: () => void;
}

const ONBOARDING_STORAGE_KEY = 'autocheck_onboarding_seen_v1';

export const HomeOnboardingTooltip: React.FC<HomeOnboardingTooltipProps> = ({
  onSelectSamplePlate,
  onFocusInput
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the onboarding
    try {
      const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!seen) {
        // Slight delay for smooth entrance after page load
        const timer = setTimeout(() => {
          setVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleDismiss = (permanent = true) => {
    triggerHaptic('selection');
    setVisible(false);
    if (permanent) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
    }
  };

  const handleTestSample = () => {
    triggerHaptic('medium');
    handleDismiss(true);
    if (onSelectSamplePlate) {
      onSelectSamplePlate('BRA2E19');
    }
  };

  const handleStartTyping = () => {
    triggerHaptic('light');
    handleDismiss(true);
    if (onFocusInput) {
      onFocusInput();
    }
  };

  if (!visible) return null;

  return (
    <div className="relative z-20 mb-3 animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Floating Tooltip Bubble */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900 via-[#002277] to-indigo-900 text-white p-4 sm:p-4.5 shadow-[0_12px_35px_-8px_rgba(0,34,119,0.45)] border border-blue-400/30 overflow-hidden">
        {/* Glow ambient effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            {/* Animated Beacon Pin */}
            <div className="relative mt-0.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Sparkles className="w-4 h-4 text-slate-900 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Dica de Primeiro Acesso
                </span>
                <span className="px-2 py-0.2 rounded-full bg-white/10 text-[10px] text-blue-200 font-semibold">
                  1 de 1
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                Consulte qualquer veículo pela placa aqui!
              </h4>

              <p className="text-xs text-blue-100/90 leading-relaxed font-medium max-w-lg">
                Digite a placa no formato <strong>Mercosul (ex: BRA2E19)</strong> ou <strong>antiga (ABC1234)</strong> para obter histórico de leilão, multas, débitos, sinistros e consulta completa.
              </p>

              {/* Action Buttons inside Tooltip */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartTyping}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Digitar Placa</span>
                  <ArrowDown className="w-3.5 h-3.5 text-blue-700 animate-bounce" />
                </button>

                <button
                  type="button"
                  onClick={handleTestSample}
                  className="px-3 py-1.5 rounded-xl bg-blue-800/80 hover:bg-blue-700/80 text-blue-100 border border-blue-400/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Testar Placa Exemplo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Close / Dismiss */}
          <button
            type="button"
            onClick={() => handleDismiss(true)}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Fechar dica"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Downward Pointer Triangle */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-900 rotate-45 border-r border-b border-blue-400/30" />
      </div>
    </div>
  );
};
