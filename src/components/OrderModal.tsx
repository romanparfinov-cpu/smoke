import React, { useState } from 'react';
import { Product, Flavor, CATEGORY_LABELS, getVariantLabel } from '../types';
import { Copy, Check, Send, AlertTriangle, X, ShoppingBag } from 'lucide-react';

interface OrderModalProps {
  orderNumber: string;
  product: Product;
  flavor: Flavor;
  telegramUsername: string;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  orderNumber,
  product,
  flavor,
  telegramUsername,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const variantLabel = getVariantLabel(product.category, 'singular');

  const cleanTelegramUsername = telegramUsername.replace(/^@/, '');
  const telegramUrl = `https://t.me/${cleanTelegramUsername}?text=${encodeURIComponent(
    `Здравствуйте! Мой номер заказа: ${orderNumber}\nТовар: ${product.title}\n${variantLabel}: ${flavor.name}\nЦена: ${product.price.toFixed(2)} BYN`
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-zinc-100 overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/50 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-500 shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-mono tracking-wide">
              Заказ сформирован!
            </h2>
            <p className="text-xs text-zinc-400">ISTERIKA Vape Store</p>
          </div>
        </div>

        {/* Product Brief summary */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 mb-4 space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Товар:</span>
            <span className="font-semibold text-zinc-200 text-right">{product.title}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Категория:</span>
            <span className="text-zinc-300">{CATEGORY_LABELS[product.category]}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>{variantLabel}:</span>
            <span className="font-semibold text-amber-400">{flavor.name}</span>
          </div>
          <div className="flex justify-between text-zinc-400 pt-1.5 border-t border-zinc-800">
            <span>Сумма к оплате:</span>
            <span className="font-black text-amber-400 font-mono text-base">{product.price.toFixed(2)} BYN</span>
          </div>
        </div>

        {/* Order Code Box */}
        <div className="mb-4 text-center">
          <p className="text-xs text-zinc-400 font-medium mb-1.5">
            Ваш уникальный номер заказа:
          </p>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border-2 border-amber-500/40 shadow-inner">
            <span className="text-xl sm:text-2xl font-black tracking-widest text-amber-400 font-mono pl-2">
              {orderNumber}
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                copied
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-amber-600 hover:bg-amber-500 text-zinc-950'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning Text */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-snug font-medium">
            Скопируйте номер заказа и отправьте его нашему менеджеру в Telegram.
          </p>
        </div>

        {/* Action Button to Telegram */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm sm:text-base shadow-sm transition-all transform active:scale-95"
        >
          <Send className="w-5 h-5" />
          <span>Перейти к менеджеру в Telegram</span>
        </a>

      </div>
    </div>
  );
};
