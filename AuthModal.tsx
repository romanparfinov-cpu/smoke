import React, { useState } from 'react';
import { X, LogIn, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle } from '../firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile?: UserProfile) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setDomainError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast('Успешный вход через Google!', 'success');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      if (err?.message === 'UNAUTHORIZED_DOMAIN' || err?.code === 'auth/unauthorized-domain') {
        setDomainError(currentDomain);
        showToast(`Домен ${currentDomain} не добавлен в Authorized Domains в Firebase Console`, 'error');
      } else if (err?.message === 'TELEGRAM_WEBVIEW_BLOCKED') {
        showToast('Google блокирует вход во встроенном браузере Telegram. Откройте в обычном браузере!', 'warning');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        console.warn('Google Auth popup closed by user');
      } else {
        console.error('Google Auth Error:', err);
        showToast('Ошибка входа через Google. Попробуйте еще раз', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Вход через Google</h2>
            <p className="text-xs text-zinc-400">Авторизация в один клик для истории заказов</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-5">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Безопасная авторизация</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Вход через аккаунт Google позволяет сохранять ваши заказы и быстро оформлять покупки без ввода паролей.
            </p>
          </div>

          {domainError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Домен не авторизован в Firebase</span>
              </div>
              <p className="leading-relaxed text-rose-300/90">
                Текущий домен <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">{domainError}</code> не внесен в список разрешенных доменов вашeго Firebase проекта.
              </p>
              <div className="pt-1 text-[11px] text-zinc-300 space-y-1 bg-black/30 p-2.5 rounded-xl border border-rose-500/20 font-mono">
                <p className="font-semibold text-amber-400">Как исправить:</p>
                <p>1. Перейдите в Firebase Console ➞ Authentication ➞ Settings ➞ Authorized Domains</p>
                <p>2. Нажмите «Add Domain» и добавьте: <span className="text-emerald-400 font-bold">{domainError}</span></p>
              </div>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all border border-zinc-700 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Подключение к Google...' : 'Войти через Google'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
