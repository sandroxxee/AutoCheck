import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Sparkles,
  X
} from 'lucide-react';
import { validateAndNormalizePlate } from '../../shared/schemas/vehicle.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { BrazilFlagSvg, MercosulLogoSvg } from './MercosulPlate.tsx';

interface PlateInputProps {
  onSearch: (plate: string, queryType?: 'basic' | 'complete') => void;
  isLoading?: boolean;
  initialValue?: string;
  defaultQueryType?: 'basic' | 'complete';
}

const PlateInputComponent: React.FC<PlateInputProps> = ({
  onSearch,
  isLoading = false,
  initialValue = '',
  defaultQueryType = 'complete'
}) => {
  const [inputVal, setInputVal] = useState(initialValue);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedType] = useState<'basic' | 'complete'>(defaultQueryType);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setInputVal(initialValue);
    }
  }, [initialValue]);

  const cleanChars = inputVal.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const validation = validateAndNormalizePlate(inputVal);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!cleanChars) {
      triggerHaptic('warning');
      setErrorMsg('Por favor, digite a placa do veículo.');
      return;
    }

    if (!validation.valid) {
      triggerHaptic('error');
      setErrorMsg(validation.error || 'Formato de placa inválido. Digite 7 caracteres (ex: BRA2E19 ou ABC1234).');
      return;
    }

    triggerHaptic('medium');
    setErrorMsg(null);
    onSearch(validation.cleanPlate, selectedType);
  }, [isLoading, cleanChars, validation, onSearch, selectedType]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    setInputVal('');
    setErrorMsg(null);
    inputRef.current?.focus();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value.toUpperCase());
    setErrorMsg((prev) => (prev ? null : prev));
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        {/* Real Brazilian Plate Frame on sleek card backing with realistic 3D elevation */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="relative rounded-3xl bg-slate-200 border-2 border-slate-700/80 plate-3d-shadow overflow-hidden transition-all duration-300 hover:border-blue-600 cursor-text group"
          style={{
            boxShadow: '0 18px 45px -8px rgba(15, 23, 42, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(0, 0, 0, 0.35)'
          }}
        >
          {/* Inner stamped metal bevel */}
          <div className="absolute inset-[1.5px] rounded-[inherit] border border-white/70 pointer-events-none z-20" />

          {/* Top Blue Mercosul Strip */}
          <div className="h-11 sm:h-12 bg-gradient-to-b from-[#0038A8] via-[#002776] to-[#001D5C] px-3.5 sm:px-6 flex items-center justify-between text-white select-none relative z-10 shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            {/* Subtle Light Glare across top banner */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            {/* Left: Mercosul Official Emblem */}
            <div className="flex items-center gap-2 z-10">
              <MercosulLogoSvg className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] font-mono font-black tracking-widest text-blue-200/90 hidden xs:inline sm:inline">
                MERCOSUL
              </span>
            </div>

            {/* Center: BRASIL */}
            <div className="z-10 flex items-center justify-center">
              <span
                className="text-xs sm:text-sm font-black tracking-[0.32em] uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "'FE-Schrift', 'DIN 1451', 'Plus Jakarta Sans', sans-serif" }}
              >
                BRASIL
              </span>
            </div>

            {/* Right: High-Fidelity Brazilian Flag & Security QR Code */}
            <div className="flex items-center gap-2 z-10">
              <div 
                className="w-4 h-4 sm:w-4.5 sm:h-4.5 bg-slate-900/80 rounded-[1px] p-[1.5px] flex items-center justify-center opacity-75 shrink-0 border border-slate-700/40"
                title="QR Code de Segurança SENATRAN"
              >
                <div className="w-full h-full bg-white grid grid-cols-3 grid-rows-3 gap-[0.5px] p-[0.5px]">
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-transparent" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                </div>
              </div>
              <BrazilFlagSvg className="w-6 h-4 sm:w-7 sm:h-5" />
            </div>
          </div>

          {/* Stamped Plate Number Surface with Metallic Gray Gradients & FE-Schrift */}
          <div 
            className="px-3 py-6 sm:py-8 flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(175deg, #FFFFFF 0%, #F1F5F9 22%, #E2E8F0 48%, #CBD5E1 52%, #E2E8F0 75%, #FFFFFF 100%)'
            }}
          >
            {/* Metallic Brushed Texture Overlay */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, rgba(203,213,225,0.3) 2px, rgba(255,255,255,0.2) 4px)'
              }}
            />

            {/* Security Hologram Watermarks */}
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-20 select-none z-0">
              <div className="font-black font-mono text-[9px] sm:text-[11px] tracking-tighter text-slate-500 rotate-[-25deg]">
                BR ★ MERCOSUL
              </div>
              <div className="font-black font-mono text-[9px] sm:text-[11px] tracking-tighter text-slate-500 rotate-[-25deg]">
                BR ★ OFICIAL
              </div>
              <div className="font-black font-mono text-[9px] sm:text-[11px] tracking-tighter text-slate-500 rotate-[-25deg]">
                SENATRAN
              </div>
            </div>

            {/* 3D Chrome Fastening Rivets */}
            <div className="absolute top-3 left-3 sm:left-5 w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-400/90 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.45)] flex items-center justify-center z-10">
              <div className="w-[60%] h-[1.5px] bg-slate-700/80 rounded-full rotate-45" />
            </div>
            <div className="absolute top-3 right-3 sm:right-5 w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-400/90 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.45)] flex items-center justify-center z-10">
              <div className="w-[60%] h-[1.5px] bg-slate-700/80 rounded-full rotate-45" />
            </div>

            <div className="w-full relative flex items-center justify-center z-10">
              <input
                ref={inputRef}
                id="hero-plate-input"
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                placeholder="BRA2E19"
                maxLength={8}
                disabled={isLoading}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                className="w-full text-center font-black text-5xl sm:text-6xl md:text-7xl tracking-[0.20em] sm:tracking-[0.28em] text-[#0A0F1D] bg-transparent uppercase placeholder:text-slate-400/70 focus:outline-none focus:ring-0 disabled:opacity-60 select-all leading-none"
                style={{
                  fontFamily: "'FE-Schrift', 'FE Mittelschrift', 'DIN 1451 Mittelschrift', 'JetBrains Mono', monospace",
                  textShadow: `
                    1px 1px 0px rgba(255, 255, 255, 0.95),
                    -1px -1px 0px rgba(0, 0, 0, 0.75),
                    0 3px 5px rgba(0, 0, 0, 0.35)
                  `
                }}
              />

              {/* Finger-friendly Quick Clear Button */}
              {inputVal.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Limpar placa"
                  className="absolute right-2 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white active:bg-slate-100 flex items-center justify-center text-slate-700 shadow-md border border-slate-300 transition-colors cursor-pointer z-30"
                >
                  <X className="w-5 h-5 text-slate-800" />
                </button>
              )}
            </div>

            {/* Plate Format Badge */}
            <div className="mt-2.5 sm:mt-3 flex items-center gap-2 z-10">
              {validation.valid ? (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50/90 px-3.5 py-1 rounded-full border border-emerald-300 shadow-xs">
                  <div className="w-4 h-4 rounded-full icon-3d-green flex items-center justify-center text-white">
                    <ShieldCheck className="w-2.5 h-2.5" />
                  </div>
                  {validation.type === 'mercosul' ? 'Padrão Mercosul Identificado' : 'Padrão Tradicional Identificado'}
                </span>
              ) : cleanChars.length > 0 ? (
                <span className="text-xs font-semibold text-slate-700 font-mono bg-white/90 px-3 py-1 rounded-full border border-slate-300 shadow-xs">
                  {cleanChars.length} de 7 caracteres
                </span>
              ) : (
                <span className="text-xs text-slate-600 font-bold tracking-tight">
                  Padrão Mercosul ou Tradicional
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modalidade de Consulta - Relatório Consolidado R$ 49,90 */}
        <div className="p-2.5 glass-subtle rounded-2xl border border-blue-200/90 text-xs sm:text-sm font-bold max-w-lg mx-auto shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl icon-3d-blue flex items-center justify-center text-white flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="block font-black text-slate-900 text-xs sm:text-sm">Relatório Integrado</span>
              <span className="block text-[11px] text-slate-500 font-semibold">Leilão, sinistro, restrições financeiras e emissão de PDF</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100/90 text-blue-900 font-mono font-black text-xs sm:text-sm border border-blue-300">
              R$ 49,90
            </span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50/95 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-3 shadow-md">
            <div className="w-6 h-6 rounded-full icon-3d-red flex items-center justify-center text-white flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* Primary Action Button - 3D Realistic High Touch Hitbox */}
        <button
          id="hero-search-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[58px] sm:min-h-[62px] py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed btn-3d-primary text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-white" />
              <span>Cruzando bases governamentais em tempo real...</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-lg icon-3d-blue flex items-center justify-center text-white border border-white/40">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">Emitir Laudo do Veículo</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </>
          )}
        </button>

        {/* Security / Trust Guarantees */}
        <div className="pt-1.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs text-slate-600 font-semibold">
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full icon-3d-blue flex items-center justify-center text-white">
              <Lock className="w-2.5 h-2.5" />
            </div>
            Sem necessidade de RENAVAM ou CPF
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full icon-3d-green flex items-center justify-center text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            </div>
            Dados 100% em tempo real
          </span>
          <span className="text-slate-500 hidden xs:inline sm:inline">
            • Em conformidade com a LGPD
          </span>
        </div>
      </form>
    </div>
  );
};

export const PlateInput = React.memo(PlateInputComponent);

