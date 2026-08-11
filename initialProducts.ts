import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_vaporesso_xros_3',
    title: 'Vaporesso XROS 3 Pod Kit',
    description: 'Надежная многоразовая POD-система с точной настройкой затяжки, аккумулятором 1000 мАч и картриджами с защитой от протечек COREX.',
    category: 'pods',
    price: 2490,
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=800',
    flavors: [
      { id: 'f31', name: 'Space Grey (Серый)', status: 'in_stock' },
      { id: 'f32', name: 'Black (Черный)', status: 'in_stock' },
      { id: 'f33', name: 'Royal Gold (Золотой)', status: 'reserved' },
      { id: 'f34', name: 'Sky Blue (Голубой)', status: 'in_stock' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_isterika_liquid_30ml',
    title: 'ISTERIKA Premium Salt Liquid 30ml',
    description: 'Премиальная линейка жидкостей на солевом никотине с глубоким насыщенным вкусом и мягким ударом по горлу.',
    category: 'liquids',
    price: 590,
    imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=800',
    flavors: [
      { id: 'f41', name: 'Ананас-Кокос (20 мг)', status: 'in_stock' },
      { id: 'f42', name: 'Энергетик-Лайм (20 мг)', status: 'in_stock' },
      { id: 'f43', name: 'Ягодный Микс (20 мг Strong)', status: 'in_stock' },
      { id: 'f44', name: 'Свежая Мята (20 мг)', status: 'reserved' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_cartridge_xros_06',
    title: 'Картриджи Vaporesso XROS Series (4 шт)',
    description: 'Сменные картриджи объемом 2 мл с верхней заправкой и сеточным испарителем для чистой вкусопередачи.',
    category: 'consumables',
    price: 350,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    flavors: [
      { id: 'f51', name: '0.6 Ом (1 шт)', status: 'in_stock' },
      { id: 'f52', name: '0.8 Ом (1 шт)', status: 'in_stock' },
      { id: 'f53', name: '1.2 Ом Mesh (1 шт)', status: 'in_stock' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_snus_iceberg_strong',
    title: 'ICEBERG Cold Dry Extreme',
    description: 'Бестабачные никпаки повышенной крепости с освежающим эффектом ледяной мяты.',
    category: 'snus',
    price: 450,
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&q=80&w=800',
    flavors: [
      { id: 'f61', name: 'Extreme Mint (75 мг)', status: 'in_stock' },
      { id: 'f62', name: 'Double Apple (75 мг)', status: 'in_stock' },
      { id: 'f63', name: 'Bubblegum (75 мг)', status: 'out_of_stock' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
