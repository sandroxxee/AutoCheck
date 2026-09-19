import React from 'react';
import { VehicleFreePreview, UserAccount } from '../types/index.ts';
import { MercosulPlate } from './MercosulPlate.tsx';
import { 
  CheckCircle2, 
  Pencil, 
  Lock, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Car,
  FileText,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FreeAnalysisPreviewProps {
  preview: VehicleFreePreview;
  user: UserAccount | null;
  onUnlockFullReport: (plate: string) => void;
  onChangePlate: () => void;
}

export const FreeAnalysisPreview: React.FC<FreeAnalysisPreviewProps> = ({
  preview,
  user,
  onUnlockFullReport,
  onChangePlate,
}) => {
  // Brand Logo Helper (SVG/Stylized badge according to car maker)
  const renderBrandLogo = (brandName: string) => {
    const b = brandName.toUpperCase();
    if (b.includes('VOLKSWAGEN') || b.includes('VW')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-800 flex items-center justify-center p-1 bg-white shadow-md">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-800">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle cx="50" cy="50" r="41" fill="none" stroke="#1e293b" strokeWidth="2" />
            <path d="M28 26 L42 66 L49 46 L38 26 Z" />
            <path d="M72 26 L58 66 L51 46 L62 26 Z" />
            <path d="M43 68 L50 82 L57 68 L50 51 Z" />
          </svg>
        </div>
      );
    }
    if (b.includes('TOYOTA')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-slate-200 flex items-center justify-center p-2 bg-white shadow-md">
          <span className="font-black tracking-tighter text-red-600 text-sm sm:text-base border-2 border-red-600 rounded-full px-2 py-3">TOYOTA</span>
        </div>
      );
    }
    if (b.includes('CHEVROLET') || b.includes('GM')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-amber-200 flex items-center justify-center p-2 bg-gradient-to-br from-amber-50 to-amber-100 shadow-md">
          <span className="font-black text-amber-600 text-base">CHEVY</span>
        </div>
      );
    }
    if (b.includes('JEEP')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-slate-300 flex items-center justify-center p-2 bg-slate-900 text-white font-black text-lg tracking-widest shadow-md">
          JEEP
        </div>
      );
    }
    if (b.includes('FIAT')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-red-200 flex items-center justify-center p-2 bg-red-700 text-white font-black text-lg tracking-wider shadow-md">
          FIAT
        </div>
      );
    }
    if (b.includes('HYUNDAI')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-blue-200 flex items-center justify-center p-2 bg-blue-900 text-white font-bold text-xs italic shadow-md">
          HYUNDAI
        </div>
      );
    }
    if (b.includes('HONDA')) {
      return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-slate-700 flex items-center justify-center p-2 bg-white text-slate-900 font-serif font-black text-3xl shadow-md">
          H
        </div>
      );
    }

    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200 flex flex-col items-center justify-center text-indigo-600 shadow-md">
        <Car className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[70px]">{preview.marca.split(' ')[0]}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      {/* Top Notification Badge - Exactly as shown in the reference */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-[#7C3AED] tracking-tight mb-2">
          <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-[#7C3AED] fill-[#7C3AED]/10" />
          <span>Pronto!</span>
        </div>
        <p className="text-slate-600 text-sm sm:text-base">
          Na <strong className="text-slate-900 font-bold">análise gratuita</strong>, liberamos acesso às seguintes informações:
        </p>
      </div>

      {/* Main Free Identification Card */}
      <div 
        id="free-preview-card"
        className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-5 sm:p-8 mb-8 transition-all hover:shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Left: Realistic Mercosul Plate + Brand Logo */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-4">
            <MercosulPlate
              plate={preview.plateFormatted || preview.plate}
              size="sm"
              showRivets={true}
              showHologram={true}
              onEdit={onChangePlate}
            />
            <div className="hidden sm:flex items-center justify-center">
              {renderBrandLogo(preview.marca)}
            </div>
          </div>

          {/* 6 Core Identification Fields */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 text-left">
            {/* Placa with edit pencil */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placa</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-black text-slate-800 tracking-wide font-mono">
                  {preview.plateFormatted || preview.plate}
                </span>
                <button
                  type="button"
                  onClick={onChangePlate}
                  title="Consultar outra placa"
                  className="p-1 rounded-md text-[#7C3AED] hover:bg-purple-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Marca */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Marca</span>
              <span className="text-base sm:text-lg font-extrabold text-slate-800 uppercase truncate mt-0.5">
                {preview.marca}
              </span>
            </div>

            {/* Modelo */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modelo</span>
              <span className="text-base sm:text-lg font-extrabold text-slate-800 uppercase truncate mt-0.5">
                {preview.modelo}
              </span>
            </div>

            {/* Cor */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cor</span>
              <span className="text-base sm:text-lg font-bold text-slate-800 uppercase mt-0.5">
                {preview.cor}
              </span>
            </div>

            {/* Ano Fab/Mod */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ano Fab/Mod</span>
              <span className="text-base sm:text-lg font-bold text-slate-800 mt-0.5 font-mono">
                {preview.anoFabMod}
              </span>
            </div>

            {/* Chassi Mascarado */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chassi</span>
              <span className="text-base sm:text-lg font-bold text-slate-800 font-mono tracking-wider mt-0.5 truncate">
                {preview.chassiMascarado}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Teaser Headline Callout (Direct replica from screenshot) */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-base sm:text-xl font-bold text-slate-800 mb-1">
          <span className="text-xl">🔎</span>
          <span>
            Encontramos mais <strong className="text-[#7C3AED] font-extrabold">{preview.foundItemsCount || 27} informações</strong> sobre este veículo...
          </span>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm">
          Você pode liberar clicando no botão abaixo e conferindo nosso histórico completo oficial:
        </p>
      </div>

      {/* Blurred Preview Grid with Center Floating CTA Button */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-100 bg-gradient-to-b from-purple-50/40 via-white to-slate-50/60 p-6 sm:p-8 shadow-lg shadow-purple-500/5 mb-8">
        {/* The underlying blurred rows */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 filter blur-[6px] select-none pointer-events-none opacity-60">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500">Leilão:</div>
            <div className="text-sm font-black text-slate-700 mt-1">**********</div>
            <div className="text-[10px] text-slate-400 mt-1">Recuperado Financeira</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200">
            <div className="text-xs font-bold text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Sinistros:</span>
            </div>
            <div className="text-sm font-black text-red-700 mt-1">**********</div>
            <div className="text-[10px] text-red-400 mt-1">Colisão / Média Monta</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500">Gravame / Financiamento:</div>
            <div className="text-sm font-black text-slate-700 mt-1">**********</div>
            <div className="text-[10px] text-slate-400 mt-1">Banco Santander / SNG</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200">
            <div className="text-xs font-bold text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Restrições Renajud:</span>
            </div>
            <div className="text-sm font-black text-red-700 mt-1">**********</div>
            <div className="text-[10px] text-red-400 mt-1">Bloqueio Judicial Ativo</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500">Débitos & Multas:</div>
            <div className="text-sm font-black text-slate-700 mt-1">R$ *,***.**</div>
            <div className="text-[10px] text-slate-400 mt-1">IPVA + Licenciamento</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500">Histórico de Donos:</div>
            <div className="text-sm font-black text-slate-700 mt-1">* Proprietários</div>
            <div className="text-[10px] text-slate-400 mt-1">Uso Particular / Empresa</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500">Renavam Oficial:</div>
            <div className="text-sm font-black text-slate-700 mt-1">00*********-*</div>
            <div className="text-[10px] text-slate-400 mt-1">Base Nacional Senatran</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500">Tabela FIPE & Histórico:</div>
            <div className="text-sm font-black text-slate-700 mt-1">R$ **.***,00</div>
            <div className="text-[10px] text-slate-400 mt-1">Desvalorização 12 meses</div>
          </div>
        </div>

        {/* Central Floating Unlocking Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px]">
          <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-white max-w-lg w-full text-center transform transition-all hover:scale-[1.01]">
            <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
              Desbloqueie a Consulta Completa
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-600 mb-5">
              Tenha acesso a leilões, sinistros, gravame, débitos, restrições e histórico de donos da placa <strong className="text-slate-900 font-mono font-bold">{preview.plateFormatted || preview.plate}</strong>.
            </p>

            <button
              id="btn-unlock-full-report"
              type="button"
              onClick={() => onUnlockFullReport(preview.plate)}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-purple-500/25 flex items-center justify-center gap-3 transition-all hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Lock className="w-5 h-5 text-purple-200" />
              <span>Liberar todas as informações</span>
              <ArrowRight className="w-5 h-5 text-purple-200" />
            </button>

            <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                PIX com liberação imediata
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Fontes Oficiais Seguras
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Features & Trust */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-white/80 rounded-xl p-4 border border-slate-100 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-800">100% Homologado</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Integrado com bases estaduais e federais</p>
        </div>

        <div className="bg-white/80 rounded-xl p-4 border border-slate-100 shadow-sm">
          <Clock className="w-6 h-6 text-[#7C3AED] mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-800">Resultado em Segundos</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Sem espera: consulta em tempo real</p>
        </div>

        <div className="bg-white/80 rounded-xl p-4 border border-slate-100 shadow-sm">
          <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-800">PDF Certificado</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Download imediato com QR Code de autenticidade</p>
        </div>
      </div>
    </div>
  );
};
