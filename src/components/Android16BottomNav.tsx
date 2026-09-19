import React from 'react';
import { Search, Car, Zap, User, Settings } from 'lucide-react';
import { UserAccount } from '../types/index.ts';

interface Android16BottomNavProps {
  currentView: string;
  onNavigate: (view: 'home' | 'report' | 'dashboard' | 'admin' | 'profile' | 'legal') => void;
  onOpenCreditModal: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  user: UserAccount | null;
}

export const Android16BottomNav: React.FC<Android16BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCreditModal,
  onOpenAuthModal,
  user
}) => {
  return (
    <nav
      id="android-16-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-blue-200/70 px-3 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        {/* Item 1: Consultar */}
        <button
          onClick={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            currentView === 'home'
              ? 'text-blue-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
              currentView === 'home'
                ? 'icon-3d-blue text-white shadow-sm'
                : 'bg-transparent text-slate-500'
            }`}
          >
            <Search className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">Consultar</span>
        </button>

        {/* Item 2: Meus Laudos */}
        <button
          onClick={() => {
            if (user) {
              onNavigate('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onOpenAuthModal('login');
            }
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            currentView === 'dashboard'
              ? 'text-blue-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
              currentView === 'dashboard'
                ? 'icon-3d-blue text-white shadow-sm'
                : 'bg-transparent text-slate-500'
            }`}
          >
            <Car className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">Laudos</span>
        </button>

        {/* Item 3: Créditos */}
        <button
          onClick={onOpenCreditModal}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer text-slate-600 hover:text-emerald-700 font-bold"
        >
          <div className="w-12 h-7 rounded-full flex items-center justify-center icon-3d-green text-white shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] tracking-tight text-emerald-800 font-bold">
            {user ? `${user.credits} Créditos` : 'Créditos'}
          </span>
        </button>

        {/* Item 4: Admin (if admin) or Perfil / Conta */}
        {user?.role === 'admin' ? (
          <button
            onClick={() => {
              onNavigate('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentView === 'admin'
                ? 'text-purple-700 font-extrabold'
                : 'text-slate-500 hover:text-purple-900 font-medium'
            }`}
          >
            <div
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
                currentView === 'admin'
                  ? 'icon-3d-purple text-white shadow-sm'
                  : 'bg-transparent text-slate-500'
              }`}
            >
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (user) {
                onNavigate('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                onOpenAuthModal('login');
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentView === 'profile'
                ? 'text-blue-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
                currentView === 'profile'
                  ? 'icon-3d-blue text-white shadow-sm'
                  : 'bg-transparent text-slate-500'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">
              {user ? 'Conta' : 'Entrar'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
