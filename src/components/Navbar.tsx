import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  User,
  LogOut,
  Car,
  Headphones,
  Settings,
  Search,
  CheckCircle2
} from 'lucide-react';
import { UserAccount } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';


interface NavbarProps {
  user: UserAccount | null;
  onNavigate: (view: 'home' | 'report' | 'dashboard' | 'admin' | 'profile' | 'legal') => void;
  onQuickSearch: (plate: string) => void;
  onOpenCreditModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onOpenSupportModal: () => void;
  onLogout: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNavigate,
  onQuickSearch,
  onOpenCreditModal,
  onOpenAuthModal,
  onOpenSupportModal,
  onLogout,
  currentView
}) => {
  const [quickPlate, setQuickPlate] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPlate.trim().length >= 7) {
      onQuickSearch(quickPlate.trim().toUpperCase());
      setQuickPlate('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-200/60 bg-white/75 backdrop-blur-xl shadow-xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <button
          id="nav-logo-btn"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl icon-3d-blue flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#020617]">AutoCheck</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                BR
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold tracking-wider">SISTEMA VEICULAR</p>
          </div>
        </button>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search in Navbar (Desktop) */}
          {currentView !== 'home' && (
            <form onSubmit={handleQuickSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder="Placa..."
                value={quickPlate}
                maxLength={8}
                onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                className="w-28 focus:w-36 transition-all duration-200 bg-white/80 border border-blue-200 rounded-full pl-7 pr-2.5 py-1.5 text-xs text-slate-900 uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="navbar" />

          {/* User Account Controls */}
          {user ? (
            <div className="relative">
              <button
                id="nav-user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/80 border border-blue-200 hover:border-blue-400 text-slate-900 transition-colors focus:outline-none cursor-pointer shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="text-xs font-semibold hidden sm:inline max-w-[100px] truncate text-slate-800">
                  {user.name?.split(' ')[0] || 'Minha Conta'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl py-2 text-xs text-slate-700 z-50 animate-in fade-in"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-blue-100">
                    <p className="font-bold text-slate-900 truncate">{user.name || 'Usuário'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        {user.role === 'admin' ? 'Administrador' : 'Conta Ativa'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="dropdown-profile-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('profile');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/70 flex items-center gap-2 text-slate-700 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Minha Conta & Perfil
                  </button>

                  <button
                    id="dropdown-dashboard-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/70 flex items-center gap-2 text-slate-700 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    Meus Laudos & Histórico
                  </button>

                  <button
                    id="dropdown-buy-credits-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenCreditModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/70 flex items-center gap-2 text-slate-700 hover:text-amber-700 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Comprar Mais Créditos
                  </button>

                  <button
                    id="dropdown-support-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSupportModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/70 flex items-center gap-2 text-slate-700 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5 text-blue-600" />
                    Suporte e Ajuda
                  </button>

                  {user.role === 'admin' && (
                    <button
                      id="dropdown-admin-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('admin');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-purple-50/70 flex items-center gap-2 text-purple-700 border-t border-blue-100 cursor-pointer transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-purple-600" />
                      Painel Administrativo
                    </button>
                  )}

                  <button
                    id="dropdown-logout-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50/70 flex items-center gap-2 text-red-600 border-t border-blue-100 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-login-btn"
              onClick={() => onOpenAuthModal('login')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] cursor-pointer active:scale-95"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
