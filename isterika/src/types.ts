export type Category = 'liquids' | 'consumables' | 'snus' | 'pods';

export const CATEGORY_LABELS: Record<Category, string> = {
  liquids: 'Жидкости',
  consumables: 'Расходники',
  snus: 'Снюсы',
  pods: 'Под-системы',
};

// Vector SVG placeholder for drawn vape bottle / device instead of random photos
export const DEFAULT_VAPE_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%"><rect width="300" height="300" fill="%230d0d12"/><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2371717a" stop-opacity="0.2"/><stop offset="100%" stop-color="%23a1a1aa" stop-opacity="0.05"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><circle cx="150" cy="150" r="100" fill="url(%23g1)" stroke="%2327272a" stroke-width="2"/><g transform="translate(110, 65)"><rect x="25" y="10" width="30" height="20" rx="4" fill="%2327272a" stroke="%2352525b" stroke-width="2"/><rect x="33" y="0" width="14" height="10" rx="2" fill="%2318181b"/><path d="M 10 35 Q 10 30 15 30 L 65 30 Q 70 30 70 35 L 75 145 Q 75 155 65 155 L 15 155 Q 5 155 5 145 Z" fill="%2318181b" stroke="%233f3f46" stroke-width="3"/><path d="M 12 80 C 25 75, 55 85, 68 80 L 72 143 Q 72 150 63 150 L 17 150 Q 8 150 8 143 Z" fill="url(%23g2)" opacity="0.85"/><rect x="15" y="50" width="50" height="50" rx="6" fill="%2309090b" stroke="%23f59e0b" stroke-width="1.5"/><text x="40" y="72" fill="%23f4f4f5" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">ISTERIKA</text><text x="40" y="85" fill="%23f59e0b" font-size="8" font-family="sans-serif" text-anchor="middle">VAPE 30ml</text><path d="M 40 100 C 35 110, 32 118, 40 124 C 48 118, 45 110, 40 100 Z" fill="%23fbbf24"/></g></svg>`;

export function getVariantLabel(category: Category, format: 'singular' | 'plural' | 'title' = 'singular'): string {
  switch (category) {
    case 'pods':
      if (format === 'plural') return 'Цвета';
      if (format === 'title') return 'Список цветов';
      return 'Цвет';
    case 'consumables':
      if (format === 'plural') return 'Типы / Варианты';
      if (format === 'title') return 'Список типов / вариантов';
      return 'Тип';
    case 'snus':
      if (format === 'plural') return 'Варианты (Вкус / Крепость)';
      if (format === 'title') return 'Список вариантов (Вкус / Крепость)';
      return 'Вкус / Крепость';
    case 'liquids':
    default:
      if (format === 'plural') return 'Вкусы';
      if (format === 'title') return 'Список вкусов';
      return 'Вкус';
  }
}

export type FlavorStatus = 'in_stock' | 'reserved' | 'out_of_stock';

export const FLAVOR_STATUS_LABELS: Record<FlavorStatus, { label: string; color: string; badgeBg: string; textClass: string }> = {
  in_stock: {
    label: 'В наличии',
    color: '#10B981', // green-500
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    textClass: 'text-emerald-400',
  },
  reserved: {
    label: 'Забронировано',
    color: '#F59E0B', // amber-500
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    textClass: 'text-amber-400',
  },
  out_of_stock: {
    label: 'Нет в наличии',
    color: '#EF4444', // red-500
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    textClass: 'text-rose-400',
  },
};

export interface Flavor {
  id: string;
  name: string;
  status: FlavorStatus;
}

export interface Product {
  id: string;
  title: string;
  category: Category;
  price: number; // in BYN
  imageUrl: string;
  description: string;
  flavors: Flavor[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'new' | 'processing' | 'completed' | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; badgeBg: string }> = {
  new: { label: 'Новый', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  processing: { label: 'В обработке', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  completed: { label: 'Завершен', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  cancelled: { label: 'Отменен', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

export interface Order {
  id: string;
  orderNumber: string; // e.g. #IST-7482
  productId: string;
  productTitle: string;
  category: Category;
  flavorName: string;
  price: number; // in BYN
  createdAt: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  status: OrderStatus;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  telegramUsername?: string;
  role: 'admin' | 'user';
  isBlocked?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AppConfig {
  telegramUsername: string; // e.g. isterika_vape_manager
}
