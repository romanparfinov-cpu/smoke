import React from 'react';
import { UserProfile } from '../types';
import { 
  Flame, 
  ShieldAlert, 
  LogOut, 
  UserCheck,
  ShoppingBag,
  Send
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  showAdminPanel: boolean;
  onToggleAdminPanel: () => void;
  onOpenUserOrders?: () => void;
  isTelegramWebApp?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAdmin,
  onLogin,
  onLogout,
  showAdminPanel,
  onToggleAdminPanel,
  onOpenUserOrders,
  isTelegramWebApp,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#09090d]/95 backdrop-blur-md border-b border-zinc-800/80 shadow-md shadow-black/80 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 p-[1px] shadow-sm">
              <div className="w-full h-full bg-[#0d0d12] rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-zinc-100 font-mono">
                  ISTERIKA
                </span>
                {isTelegramWebApp && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" />
                    TWA
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 tracking-widest uppercase font-semibold -mt-1 hidden sm:block">
                Vape Store
              </p>
            </div>
          </div>

          {/* User Controls & Admin Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* My Orders Button (Visible when logged in) */}
            {user && onOpenUserOrders && (
              <button
                onClick={onOpenUserOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold transition-all shadow-sm"
                title="Мои заказы"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden xs:inline">Мои заказы</span>
              </button>
            )}

            {/* Admin Panel Button (Visible ONLY to Admins) */}
            {isAdmin && (
              <button
                onClick={onToggleAdminPanel}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm ${
                  showAdminPanel
                    ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-400 border border-amber-500/30'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {showAdminPanel ? 'В каталог' : 'Админка'}
                </span>
              </button>
            )}

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-5 h-5 rounded-full ring-1 ring-zinc-700"
                    />
                  ) : (
                    <UserCheck className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="text-zinc-300 max-w-[120px] truncate font-medium">
                    {user.displayName}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 text-zinc-300 text-xs sm:text-sm transition-all"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs sm:text-sm border border-zinc-700/80 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Войти</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
