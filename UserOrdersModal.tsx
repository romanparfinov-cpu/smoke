import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  X, 
  Clock, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  RefreshCw,
  Search,
  PackageCheck
} from 'lucide-react';
import { Order, ORDER_STATUS_LABELS, CATEGORY_LABELS, UserProfile, Product } from '../types';
import { subscribeToUserOrders } from '../firebase';

interface UserOrdersModalProps {
  user: UserProfile;
  products: Product[];
  onClose: () => void;
  onRepeatOrder: (product: Product, flavorName: string) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const UserOrdersModal: React.FC<UserOrdersModalProps> = ({
  user,
  products,
  onClose,
  onRepeatOrder,
  onShowToast,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToUserOrders(user.uid, (myOrders) => {
      setOrders(myOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.productTitle.toLowerCase().includes(q) ||
      o.flavorName.toLowerCase().includes(q)
    );
  });

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    onShowToast(`Номер заказа ${num} скопирован в буфер обмена`, 'success');
  };

  const handleReorderClick = (order: Order) => {
    const foundProduct = products.find((p) => p.id === order.productId || p.title === order.productTitle);
    if (foundProduct) {
      onRepeatOrder(foundProduct, order.flavorName);
      onClose();
    } else {
      onShowToast(`Товар «${order.productTitle}» сейчас временно недоступен в каталоге`, 'warning');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-zinc-950 px-5 sm:px-8 py-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-mono">История заказов</h2>
              <p className="text-xs text-zinc-400">
                Заказы для аккаунта: <span className="text-zinc-200 font-medium">{user.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-800/60 bg-zinc-900/50 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по номеру или названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>Всего заказов: <strong className="text-amber-400 font-mono text-sm">{orders.length}</strong></span>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-mono">Загрузка ваших заказов...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 px-4 text-center bg-zinc-950/60 border border-zinc-800/80 rounded-2xl text-zinc-400 space-y-3">
              <PackageCheck className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="text-sm font-medium">
                {search ? 'Заказов по вашему запросу не найдено.' : 'У вас еще нет оформленных заказов.'}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Выберите товар в каталоге, нажмите «Заказать» и ваш номер заказа сохранится здесь!
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusInfo = ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.new;
              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl transition-all shadow-md space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-amber-400">
                        {order.orderNumber}
                      </span>
                      <button
                        onClick={() => handleCopyOrderNumber(order.orderNumber)}
                        className="p-1 rounded bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors"
                        title="Скопировать номер заказа"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold uppercase">
                        {CATEGORY_LABELS[order.category] || 'Товар'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusInfo.badgeBg}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{order.productTitle}</h4>
                      <p className="text-xs text-amber-400 font-medium mt-0.5">
                        Выбранный вариант: <span className="text-zinc-200">{order.flavorName}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span>{new Date(order.createdAt).toLocaleString('ru-RU')}</span>
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                      <span className="text-base font-mono font-bold text-amber-400">
                        {order.price.toFixed(2)} BYN
                      </span>

                      <button
                        onClick={() => handleReorderClick(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Повторить заказ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
