import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const borderStyles = {
    success: 'border-emerald-500/30 bg-zinc-900/95 text-zinc-100',
    error: 'border-rose-500/30 bg-zinc-900/95 text-zinc-100',
    warning: 'border-amber-500/30 bg-zinc-900/95 text-zinc-100',
    info: 'border-sky-500/30 bg-zinc-900/95 text-zinc-100',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${borderStyles[toast.type]} shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 max-w-sm w-full`}
    >
      {icons[toast.type]}
      <p className="text-xs sm:text-sm font-medium flex-1 break-words">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

interface SingleToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<SingleToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const toastItem: ToastMessage = {
    id: 'single_toast',
    message,
    type: type as ToastType,
  };

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm w-full px-4">
      <ToastItem toast={toastItem} onDismiss={onClose} />
    </div>
  );
};
