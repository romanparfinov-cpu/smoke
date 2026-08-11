import React, { useState } from 'react';
import { X, LogIn, User, Send, ShieldCheck, Zap } from 'lucide-react';
import { loginWithGoogle, loginAsGuest } from '../firebase';
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
  const [activeTab, setActiveTab] = useState<'quick' | 'google'>('quick');
  const [guestName, setGuestName] = useState('');
  const [guestTelegram, setGuestTelegram] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast('Успешный вход через Google!', 'success');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err?.message === 'UNAUTHORIZED_DOMAIN') {
        showToast('Google логин недоступен на незарегистрированных доменах Vercel. Используйте "Быстрый вход" ниже!', 'warning');
        setActiveTab('quick');
      } else if (err?.message === 'TELEGRAM_WEBVIEW_BLOCKED') {
        showToast('Google блокирует вход внутри Telegram. Используйте "Быстрый вход"!', 'warning');
        setActiveTab('quick');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        showToast('Ошибка входа через Google. Попробуйте "Быстрый вход"!', 'error');
        setActiveTab('quick');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      showToast('Введите ваше имя или ник', 'warning');
      return;
    }
    setLoading(true);
    try {
      const profile = await loginAsGuest(guestName, guestTelegram);
      showToast(`Добро пожаловать, ${profile.displayName}!`, 'success');
      onSuccess(profile);
      onClose();
    } catch (err) {
      console.error('Guest Auth Error:', err);
      showToast('Ошибка при входе. Попробуйте еще раз', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Вход в личный кабинет</h2>
            <p className="text-xs text-zinc-400">Для истории заказов и сохранения данных</p>
          </div>
        </div>

        {/* Auth Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl mb-5 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'quick'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Быстрый вход</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'google'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google</span>
          </button>
        </div>

        {activeTab === 'quick' ? (
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-amber-300">
              ⚡ <strong>Работает на 100% везде</strong> (на Vercel, в Telegram и в любых браузерах). Регистрация не требуется!
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Ваше Имя или Ник <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Например: Роман"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-400" />
                Telegram Username (необязательно)
              </label>
              <input
                type="text"
                value={guestTelegram}
                onChange={(e) => setGuestTelegram(e.target.value)}
                placeholder="@username"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Входим...' : 'Войти в профиль'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-zinc-400">
              Авторизация через ваш аккаунт Google.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm transition-all border border-zinc-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{loading ? 'Подключение...' : 'Войти через Google'}</span>
            </button>

            <p className="text-[11px] text-zinc-500">
              * Если появляется ошибка домена на Vercel, используйте вкладку «Быстрый вход».
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
