import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Car } from 'lucide-react';

interface QueryLoadingModalProps {
  plate: string;
  isOpen: boolean;
}

export const QueryLoadingModal: React.FC<QueryLoadingModalProps> = ({ plate, isOpen }) => {
  const [stepIdx, setStepIdx] = useState(0);

  const steps = [
    { title: 'Validando formato da placa...', sub: 'Padrão Mercosul / Padrão Nacional' },
    { title: 'Consultando bases veiculares homologadas...', sub: 'Bases cadastrais e histórico de restrições' },
    { title: 'Analisando registros de roubo, furto e alerta...', sub: 'Verificação com sistema policial e órgãos de trânsito' },
    { title: 'Consolidando dados do veículo...', sub: 'Marca, modelo, cor, combustível e situação' },
    { title: 'Calculando score e organizando laudo...', sub: 'Finalizando laudo com parecer pericial' }
  ];

  useEffect(() => {
    if (!isOpen) {
      setStepIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIdx((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-blue-200/90 p-8 shadow-2xl text-center space-y-6 text-slate-900 animate-in zoom-in-95">
        {/* Plate visual badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 shadow-xs">
          <Car className="w-4 h-4 text-blue-600" />
          <span className="font-mono font-black text-sm tracking-wider uppercase">{plate}</span>
        </div>

        {/* Animated Radar/Loader */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
          <div className="absolute inset-1 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Current State Text */}
        <div className="space-y-1 min-h-[46px]">
          <h3 className="text-base font-black text-slate-900 tracking-tight animate-in fade-in">
            {steps[stepIdx].title}
          </h3>
          <p className="text-xs text-slate-600 font-medium animate-in fade-in">
            {steps[stepIdx].sub}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIdx
                  ? 'w-6 bg-blue-600'
                  : i < stepIdx
                  ? 'w-2 bg-emerald-600'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Conexão criptografada e segura com as bases homologadas</span>
        </div>
      </div>
    </div>
  );
};
