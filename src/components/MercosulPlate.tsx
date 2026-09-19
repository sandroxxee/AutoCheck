import React from 'react';
import { Pencil, QrCode } from 'lucide-react';

export interface MercosulPlateProps {
  plate: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showRivets?: boolean;
  showHologram?: boolean;
  showQrCode?: boolean;
  onEdit?: () => void;
  className?: string;
  variant?: 'car' | 'compact';
}

/**
 * High-Fidelity Official Brazil Flag SVG
 * Proportions: 10:7, exact official hex colors (Verde #009B3A, Amarelo #FEDF00, Azul #002776)
 */
export const BrazilFlagSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-4' }) => (
  <svg
    viewBox="0 0 720 504"
    className={`${className} rounded-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.4)] select-none shrink-0 border border-black/20`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Green Field (Fundo Verde Oficial) */}
    <rect width="720" height="504" fill="#009B3A" />
    
    {/* Yellow Rhombus (Losango Amarelo Oficial) */}
    <polygon points="360,37.8 667.8,252 360,466.2 52.2,252" fill="#FEDF00" />
    
    {/* Blue Celestial Sphere (Globo Azul Celeste) */}
    <circle cx="360" cy="252" r="126" fill="#002776" />
    
    {/* White Celestial Arc (Faixa Branca) */}
    <path
      d="M 234 252 A 280 280 0 0 1 486 252"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="15"
      strokeLinecap="round"
    />
    
    {/* Constellation Stars (Cruzeiro do Sul, Spica, etc.) */}
    <g fill="#FFFFFF">
      {/* Crux (Cruzeiro do Sul) */}
      <circle cx="360" cy="275" r="4.5" />
      <circle cx="360" cy="305" r="4.5" />
      <circle cx="344" cy="290" r="4.5" />
      <circle cx="376" cy="288" r="4" />
      <circle cx="367" cy="298" r="3" />
      {/* Spica acima da faixa */}
      <circle cx="340" cy="210" r="4" />
      {/* Canis Major / Procyon */}
      <circle cx="320" cy="280" r="4" />
      <circle cx="395" cy="320" r="3.5" />
      <circle cx="300" cy="295" r="3" />
    </g>
  </svg>
);

/**
 * High-Fidelity Mercosul Official Logo (Emblema Mercosul com Cruzeiro do Sul e arcos azul/verde)
 */
export const MercosulLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} select-none shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Dynamic undulating Mercosul waves */}
    <path
      d="M 10,48 C 26,24 62,20 90,40 C 66,28 36,36 10,48 Z"
      fill="#009B3A"
    />
    <path
      d="M 10,54 C 30,34 68,28 92,50 C 68,39 36,44 10,54 Z"
      fill="#002776"
    />
    {/* 4 Southern Cross Gold Stars */}
    <g fill="#FEDF00">
      {/* Top */}
      <polygon points="50,12 52,19 59,19 53,23 55,30 50,25 45,30 47,23 41,19 48,19" />
      {/* Bottom */}
      <polygon points="50,40 51.5,45 56,45 52.5,48 54,53 50,49.5 46,53 47.5,48 44,45 48.5,45" />
      {/* Left */}
      <polygon points="36,28 37.5,33 42,33 38.5,36 40,41 36,37.5 32,41 33.5,36 30,33 34.5,33" />
      {/* Right */}
      <polygon points="64,26 65.5,31 70,31 66.5,34 68,39 64,35.5 60,39 61.5,34 58,31 62.5,31" />
    </g>
  </svg>
);

/**
 * Laser Etched Security QR Code (Padrão SENATRAN)
 */
const SecurityQrCode: React.FC<{ size?: string }> = ({ size = 'w-4 h-4' }) => (
  <div 
    className={`${size} bg-slate-900/80 rounded-[1px] p-[1.5px] flex items-center justify-center opacity-65 shrink-0 border border-slate-700/40`}
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
);

/**
 * 3D Chrome Fixation Bolt / Rivet with Washer & Screw Slot
 */
const ChromeRivet: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dim = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-[#E2E8F0] via-[#94A3B8] to-[#475569] border border-slate-500/80 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95),0_1.5px_3px_rgba(0,0,0,0.5)] relative flex items-center justify-center shrink-0`}
      title="Parafuso de fixação com arruela"
    >
      {/* Outer washer bevel */}
      <div className="absolute inset-[0.5px] rounded-full border border-white/60 pointer-events-none" />
      {/* Slotted screw center */}
      <div className="w-[60%] h-[1.5px] bg-[#1E293B] rounded-full rotate-45 shadow-[0_0.5px_0_rgba(255,255,255,0.4)]" />
    </div>
  );
};

export const MercosulPlate: React.FC<MercosulPlateProps> = ({
  plate,
  size = 'md',
  showRivets = true,
  showHologram = true,
  showQrCode = true,
  onEdit,
  className = ''
}) => {
  const cleanPlate = (plate || 'BRA2E19').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Format with space if standard 7 chars (e.g., BRA 2E19) for authentic Mercosul spacing
  const formattedPlate = cleanPlate.length === 7 
    ? `${cleanPlate.slice(0, 3)} ${cleanPlate.slice(3)}`
    : cleanPlate;

  // Size scale mappings matching real 3:1 automotive aspect ratio
  const sizeStyles = {
    xs: {
      wrapper: 'w-32 h-13 rounded-md border-[1.5px]',
      banner: 'h-3.5 px-1.5',
      emblem: 'w-2.5 h-2.5',
      brasilText: 'text-[7px] tracking-[0.25em]',
      flag: 'w-3.5 h-2.5',
      body: 'px-2 py-0.5',
      plateText: 'text-sm tracking-[0.18em]',
      rivetSize: 'sm' as const,
      hologramSize: 'text-[5px]',
      qrSize: 'w-2.5 h-2.5'
    },
    sm: {
      wrapper: 'w-40 h-16 rounded-lg border-2',
      banner: 'h-4.5 px-2',
      emblem: 'w-3 h-3',
      brasilText: 'text-[9px] tracking-[0.26em]',
      flag: 'w-4.5 h-3',
      body: 'px-2.5 py-1',
      plateText: 'text-lg tracking-[0.20em]',
      rivetSize: 'sm' as const,
      hologramSize: 'text-[6px]',
      qrSize: 'w-3 h-3'
    },
    md: {
      wrapper: 'w-52 h-20 rounded-xl border-2',
      banner: 'h-5.5 px-2.5',
      emblem: 'w-4 h-4',
      brasilText: 'text-[11px] tracking-[0.28em]',
      flag: 'w-5.5 h-3.5',
      body: 'px-3 py-1',
      plateText: 'text-2xl sm:text-[26px] tracking-[0.22em]',
      rivetSize: 'md' as const,
      hologramSize: 'text-[7px]',
      qrSize: 'w-3.5 h-3.5'
    },
    lg: {
      wrapper: 'w-72 h-28 rounded-2xl border-[2.5px]',
      banner: 'h-7.5 px-3.5',
      emblem: 'w-5 h-5',
      brasilText: 'text-sm tracking-[0.32em]',
      flag: 'w-7 h-4.5',
      body: 'px-4 py-1.5',
      plateText: 'text-3xl sm:text-4xl tracking-[0.24em]',
      rivetSize: 'lg' as const,
      hologramSize: 'text-[8px]',
      qrSize: 'w-4.5 h-4.5'
    },
    xl: {
      wrapper: 'w-96 h-36 rounded-2xl border-[3px]',
      banner: 'h-9 px-4.5',
      emblem: 'w-6 h-6',
      brasilText: 'text-base tracking-[0.34em]',
      flag: 'w-9 h-6',
      body: 'px-6 py-2',
      plateText: 'text-4xl sm:text-5xl tracking-[0.26em]',
      rivetSize: 'lg' as const,
      hologramSize: 'text-[9px]',
      qrSize: 'w-5 h-5'
    },
    hero: {
      wrapper: 'w-full max-w-xl h-36 sm:h-44 rounded-3xl border-[3.5px]',
      banner: 'h-10 sm:h-12 px-4 sm:px-6',
      emblem: 'w-5 h-5 sm:w-6 sm:h-6',
      brasilText: 'text-xs sm:text-sm tracking-[0.34em]',
      flag: 'w-7 h-4.5 sm:w-8 sm:h-5.5',
      body: 'px-4 sm:px-6 py-2 sm:py-3',
      plateText: 'text-4xl sm:text-6xl md:text-7xl tracking-[0.22em] sm:tracking-[0.28em]',
      rivetSize: 'lg' as const,
      hologramSize: 'text-[9px] sm:text-[11px]',
      qrSize: 'w-5 h-5 sm:w-6 sm:h-6'
    }
  }[size];

  return (
    <div
      className={`relative select-none overflow-hidden bg-slate-900 border-[#0F172A] shadow-[0_16px_40px_-6px_rgba(15,23,42,0.4),0_6px_16px_rgba(0,0,0,0.25),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_3px_rgba(0,0,0,0.6)] ${sizeStyles.wrapper} ${className}`}
      style={{
        boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 2px 3px rgba(255, 255, 255, 0.95), inset 0 -2px 3px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Outer Stamped Metallic Perimeter Border (Filete em relevo de prensa) */}
      <div className="absolute inset-[1px] rounded-[inherit] border border-white/80 pointer-events-none z-30" />
      <div className="absolute inset-[2.5px] rounded-[inherit] border border-slate-700/60 pointer-events-none z-30" />

      {/* Top Mercosul Official Blue Header */}
      <div
        className={`w-full ${sizeStyles.banner} bg-gradient-to-b from-[#003EA8] via-[#002B7F] to-[#001D5C] flex items-center justify-between text-white relative z-20 shadow-[0_2px_4px_rgba(0,0,0,0.45)] border-b border-[#001844]`}
      >
        {/* Subtle Horizontal Light Glare Reflection */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Left: Mercosul Official Emblem */}
        <div className="flex items-center gap-1.5 z-10">
          <MercosulLogoSvg className={sizeStyles.emblem} />
          <span className="font-mono text-[8px] sm:text-[9px] font-black tracking-widest text-blue-100/90 hidden sm:inline drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            MERCOSUL
          </span>
        </div>

        {/* Center: BRASIL Title in Official Technical Typography */}
        <div className="z-10 flex items-center justify-center">
          <span
            className={`font-black uppercase text-white ${sizeStyles.brasilText} drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]`}
            style={{
              fontFamily: "'FE-Schrift', 'DIN 1451', 'Plus Jakarta Sans', sans-serif"
            }}
          >
            BRASIL
          </span>
        </div>

        {/* Right: High-Fidelity Official Brazilian Flag & Optional Laser QR Code */}
        <div className="flex items-center gap-2 z-10">
          {showQrCode && <SecurityQrCode size={sizeStyles.qrSize} />}
          <BrazilFlagSvg className={sizeStyles.flag} />
        </div>
      </div>

      {/* Main Stamped Aluminum Body with Realistic Metallic Gray Gradients */}
      <div
        className={`w-full h-full ${sizeStyles.body} flex items-center justify-center relative overflow-hidden`}
        style={{
          background: 'linear-gradient(175deg, #FFFFFF 0%, #F8FAFC 18%, #E2E8F0 47%, #CBD5E1 53%, #E2E8F0 78%, #FFFFFF 100%)'
        }}
      >
        {/* Brushed Aluminum Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-45 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0px, rgba(203,213,225,0.35) 2px, rgba(255,255,255,0.25) 4px)'
          }}
        />

        {/* Security Sine Waves & Hologram Watermarks */}
        {showHologram && (
          <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-25 select-none z-0">
            <div className={`font-black font-mono tracking-tighter text-slate-500 rotate-[-22deg] ${sizeStyles.hologramSize}`}>
              BR ★ MERCOSUL
            </div>
            <div className={`font-black font-mono tracking-tighter text-slate-500 rotate-[-22deg] ${sizeStyles.hologramSize}`}>
              BR ★ OFICIAL
            </div>
            <div className={`font-black font-mono tracking-tighter text-slate-500 rotate-[-22deg] ${sizeStyles.hologramSize}`}>
              SENATRAN
            </div>
          </div>
        )}

        {/* 3D Chrome Rivets / Fixation Bolts on Top Corners */}
        {showRivets && (
          <>
            <div className="absolute top-1.5 left-2 sm:top-2 sm:left-2.5 z-20">
              <ChromeRivet size={sizeStyles.rivetSize} />
            </div>
            <div className="absolute top-1.5 right-2 sm:top-2 sm:right-2.5 z-20">
              <ChromeRivet size={sizeStyles.rivetSize} />
            </div>
          </>
        )}

        {/* Stamped Characters (FE-Schrift with 3D Embossed Metallic Edge) */}
        <div className="relative z-10 flex items-center justify-center w-full my-auto">
          <span
            className={`font-black text-[#070D1A] ${sizeStyles.plateText} leading-none select-all`}
            style={{
              fontFamily: "'FE-Schrift', 'FE Mittelschrift', 'DIN 1451 Mittelschrift', 'DIN 1451', 'JetBrains Mono', monospace",
              textShadow: `
                1.5px 1.5px 0px rgba(255, 255, 255, 1),
                -1.5px -1.5px 0px rgba(0, 0, 0, 0.85),
                0 3px 6px rgba(0, 0, 0, 0.45)
              `
            }}
          >
            {formattedPlate}
          </span>

          {/* Edit pencil icon if clickable */}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Trocar placa"
              className="absolute right-1 sm:right-2 p-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-300 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-30"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}
        </div>

        {/* Bottom Specular Highlight Line (Borda de prensa) */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-t from-slate-400/40 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
