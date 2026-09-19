import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Cpu,
  Car,
  Database,
  ArrowLeft
} from 'lucide-react';
import { MercosulPlate } from './MercosulPlate.tsx';

interface ReportSkeletonProps {
  plate?: string;
  onCancel?: () => void;
}

const INQUIRY_STEPS = [
  {
    stage: 'Gateway Oficial',
    title: 'Conectando ao gateway e bases governamentais...',
    detail: 'Autenticação segura via SENATRAN, Renavam e bases estaduais'
  },
  {
    stage: 'Segurança Pública',
    title: 'Auditando ocorrências de furto, roubo e apropriação...',
    detail: 'Cruzamento com Sistema Nacional de Informações de Segurança'
  },
  {
    stage: 'Financeiro & Fazenda',
    title: 'Verificando débitos, IPVA, licenciamento e multas...',
    detail: 'Consulta concorrente SEFAZ, Detran e Registro Renainf'
  },
  {
    stage: 'Judicial & Jurídico',
    title: 'Rastreando restrições administrativas e judiciais...',
    detail: 'Investigando ordens de penhora RENAJUD e bloqueios de transferência'
  },
  {
    stage: 'Mercado & Inteligência',
    title: 'Calculando histórico FIPE, recalls e score de risco...',
    detail: 'Compilação de evidências e consolidação do laudo oficial'
  }
];

const ReportSkeletonComponent: React.FC<ReportSkeletonProps> = ({ plate, onCancel }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        const next = prev < INQUIRY_STEPS.length - 1 ? prev + 1 : prev;
        return next;
      });
    }, 900);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 350);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentStep = INQUIRY_STEPS[currentStepIdx];
  const formattedPlate = plate ? plate.toUpperCase() : 'CONSULTANDO';

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-slate-900 animate-in fade-in">
      {/* 1. Top Breadcrumb & Live Query Telemetry Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            {onCancel ? (
              <button
                onClick={onCancel}
                className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            ) : (
              <span>Início</span>
            )}
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>Processando Laudo</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 animate-pulse">
              {formattedPlate}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Gerando Laudo do Veículo
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              Processando
            </span>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 rounded-xl bg-slate-200/70 animate-pulse hidden sm:block" />
          <div className="h-9 w-32 rounded-xl bg-blue-200/60 animate-pulse" />
        </div>
      </div>

      {/* 2. Interactive Live Telemetry Ticker */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md relative">
              <Cpu className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Etapa {currentStepIdx + 1} de {INQUIRY_STEPS.length} • {currentStep.stage}
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">
                  {Math.min(progress, 99)}% concluído
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 transition-all duration-300">
                {currentStep.title}
              </p>
              <p className="text-xs text-slate-600">
                {currentStep.detail}
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 shrink-0 space-y-2">
            <div className="flex justify-between items-center text-[11px] text-slate-600">
              <span className="font-medium">Tempo de resposta</span>
              <span className="text-blue-700 font-mono font-bold">~1.2s</span>
            </div>
            {/* Dynamic Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${Math.min(progress, 98)}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Database className="w-3 h-3 text-blue-600" />
              <span>Cruzando bases oficiais com contingência ativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Header Card Skeleton (Vehicle Info & Score) */}
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-blue-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Plate Graphic & Title Skeleton */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Mercosul Plate Skeleton */}
            <MercosulPlate
              plate={formattedPlate}
              size="sm"
              showRivets={true}
              showHologram={true}
            />

            {/* Vehicle Title & Badges Placeholder */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-20 rounded-md bg-blue-50 border border-blue-200 animate-pulse" />
                <div className="h-5 w-24 rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
                <div className="h-5 w-16 rounded-md bg-emerald-50 border border-emerald-200 animate-pulse" />
              </div>

              {/* Title Bar Skeleton */}
              <div className="space-y-1.5">
                <div className="h-7 sm:h-8 w-64 sm:w-80 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-4 w-44 rounded bg-slate-100 animate-pulse" />
              </div>

              {/* Specs Pills Skeleton */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="h-6 w-24 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
                <div className="h-6 w-28 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right: Score Gauge Skeleton */}
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <div className="space-y-1 text-left lg:text-right">
              <div className="h-4 w-28 rounded bg-slate-200 animate-pulse ml-auto" />
              <div className="h-3 w-36 rounded bg-slate-100 animate-pulse ml-auto" />
            </div>

            {/* Score Ring Placeholder */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              <div className="absolute inset-2 rounded-xl border-2 border-dashed border-blue-400/40 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="text-center space-y-0.5">
                <span className="text-xs font-mono font-bold text-blue-600 animate-pulse">SCORE</span>
                <div className="h-4 w-8 mx-auto rounded bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Safety Summary Cards Skeleton (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Roubo & Furto', icon: 'shield' },
          { label: 'Débitos & Multas', icon: 'dollar' },
          { label: 'Restrições Judiciais', icon: 'scale' },
          { label: 'Gravame / SNG', icon: 'lock' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white border border-blue-200/70 p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-300 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
              </div>
              <div className="h-5 w-16 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* 5. Detailed 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white border border-blue-200/70 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">Dados Cadastrais do Veículo</span>
              </div>
              <div className="h-5 w-24 rounded-full bg-slate-100 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-32 rounded bg-slate-300 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white border border-blue-200/70 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
              <div className="h-5 w-20 rounded bg-slate-100 animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-44 rounded bg-slate-300 animate-pulse" />
            </div>

            <div className="h-28 rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-end justify-between gap-2">
              {[45, 60, 55, 70, 65, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t bg-blue-400/40 animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                  />
                  <div className="h-2 w-full rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportSkeleton = React.memo(ReportSkeletonComponent);
