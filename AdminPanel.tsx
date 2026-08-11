import React, { useState, useEffect } from 'react';
import { 
  Product, 
  Flavor, 
  Category, 
  FlavorStatus, 
  Order, 
  OrderStatus, 
  UserProfile, 
  AppConfig,
  CATEGORY_LABELS,
  FLAVOR_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  getVariantLabel,
  DEFAULT_VAPE_IMAGE
} from '../types';
import { 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  subscribeToOrders, 
  updateOrderStatus, 
  deleteOrder, 
  fetchAllUsers, 
  updateUserStatus,
  fetchAppConfig,
  updateAppConfig
} from '../firebase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  Package, 
  Settings, 
  Upload, 
  X, 
  Search, 
  Check, 
  UserX, 
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface AdminPanelProps {
  products: Product[];
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onShowConfirm: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  onClose,
  onShowToast,
  onShowConfirm
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'settings'>('products');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // App Config state
  const [config, setConfig] = useState<AppConfig>({ telegramUsername: 'isterika_vape_manager' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedMessage, setConfigSavedMessage] = useState(false);

  // Product Modal / Form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('liquids');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFlavors, setFormFlavors] = useState<Array<{ id: string; name: string; status: FlavorStatus }>>([
    { id: 'fl_1', name: 'Стандартный', status: 'in_stock' }
  ]);
  const [savingProduct, setSavingProduct] = useState(false);

  // Subscribe to orders real-time
  useEffect(() => {
    const unsubscribe = subscribeToOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
    });
    return () => unsubscribe();
  }, []);

  // Fetch users & config on mount
  useEffect(() => {
    loadUsers();
    loadConfig();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const u = await fetchAllUsers();
    setUsers(u);
    setLoadingUsers(false);
  };

  const loadConfig = async () => {
    const c = await fetchAppConfig();
    setConfig(c);
  };

  // Handle Save App Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updateAppConfig(config);
      onShowToast('Настройки Telegram менеджера сохранены!', 'success');
      setConfigSavedMessage(true);
      setTimeout(() => setConfigSavedMessage(false), 3000);
    } catch (err) {
      console.error(err);
      onShowToast('Ошибка при сохранении настроек', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Open product modal for creation
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setFormTitle('');
    setFormCategory('liquids');
    setFormPrice('');
    setFormImageUrl('');
    setFormDescription('');
    setFormFlavors([
      { id: `fl_${Date.now()}_1`, name: 'Классический', status: 'in_stock' }
    ]);
    setIsProductModalOpen(true);
  };

  // Open product modal for editing
  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormImageUrl(p.imageUrl || '');
    setFormDescription(p.description || '');
    setFormFlavors(
      p.flavors && p.flavors.length > 0
        ? p.flavors.map((f) => ({ ...f }))
        : [{ id: `fl_${Date.now()}`, name: 'Основной', status: 'in_stock' }]
    );
    setIsProductModalOpen(true);
  };

  // Add new flavor row in form
  const handleAddFlavorRow = () => {
    setFormFlavors((prev) => [
      ...prev,
      { id: `fl_${Date.now()}_${prev.length + 1}`, name: '', status: 'in_stock' },
    ]);
  };

  // Remove flavor row in form
  const handleRemoveFlavorRow = (index: number) => {
    if (formFlavors.length <= 1) {
      onShowToast('У товара должен быть хотя бы один вариант вкуса', 'warning');
      return;
    }
    setFormFlavors((prev) => prev.filter((_, i) => i !== index));
  };

  // Image Upload helper (FileReader to Data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Файл слишком большой. Выберите изображение менее 2 МБ.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
        onShowToast('Изображение успешно загружено', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('Введите название товара', 'warning');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      onShowToast('Укажите корректную цену в BYN', 'warning');
      return;
    }

    const cleanedFlavors = formFlavors
      .filter((f) => f.name.trim().length > 0)
      .map((f, i) => ({
        id: f.id || `fl_${Date.now()}_${i}`,
        name: f.name.trim(),
        status: f.status,
      }));

    if (cleanedFlavors.length === 0) {
      onShowToast('Укажите хотя бы один вариант вкуса', 'warning');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProductId) {
        await updateProduct(editingProductId, {
          title: formTitle.trim(),
          category: formCategory,
          price: priceNum,
          imageUrl: formImageUrl.trim(),
          description: formDescription.trim(),
          flavors: cleanedFlavors,
        });
        onShowToast('Товар успешно обновлен', 'success');
      } else {
        await addProduct({
          title: formTitle.trim(),
          category: formCategory,
          price: priceNum,
          imageUrl: formImageUrl.trim(),
          description: formDescription.trim(),
          flavors: cleanedFlavors,
        });
        onShowToast('Товар успешно добавлен в каталог', 'success');
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
      onShowToast('Ошибка при сохранении товара', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    onShowConfirm(
      'Удаление товара',
      'Вы действительно хотите удалить этот товар из каталога?',
      async () => {
        try {
          await deleteProduct(productId);
          onShowToast('Товар удален', 'success');
        } catch (err) {
          console.error(err);
          onShowToast('Ошибка при удалении товара', 'error');
        }
      },
      true
    );
  };

  // Update order status
  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      onShowToast('Статус заказа обновлен', 'info');
    } catch (err) {
      console.error(err);
      onShowToast('Не удалось обновить статус заказа', 'error');
    }
  };

  // Delete order
  const handleDeleteOrder = (orderId: string) => {
    onShowConfirm(
      'Удаление заказа',
      'Удалить этот заказ из истории сообщений?',
      async () => {
        try {
          await deleteOrder(orderId);
          onShowToast('Заказ удален из истории', 'success');
        } catch (err) {
          console.error(err);
          onShowToast('Ошибка при удалении заказа', 'error');
        }
      },
      true
    );
  };

  // Toggle user admin role
  const handleToggleAdmin = (u: UserProfile) => {
    if (u.email === 'romanparfinov@gmail.com') {
      onShowToast('Нельзя изменить права главного администратора', 'warning');
      return;
    }
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    const actionName = newRole === 'admin' ? 'сделать администратором' : 'снять права администратора';

    onShowConfirm(
      'Изменение роли пользователя',
      `Вы уверены, что хотите ${actionName} для ${u.displayName || u.email}?`,
      async () => {
        try {
          await updateUserStatus(u.uid, { role: newRole });
          loadUsers();
          onShowToast('Роль пользователя изменена', 'success');
        } catch (err) {
          console.error(err);
          onShowToast('Ошибка при изменении роли', 'error');
        }
      }
    );
  };

  // Toggle user block status
  const handleToggleBlock = (u: UserProfile) => {
    if (u.email === 'romanparfinov@gmail.com') {
      onShowToast('Нельзя заблокировать главного администратора', 'warning');
      return;
    }
    const newBlocked = !u.isBlocked;
    const actionName = newBlocked ? 'заблокировать' : 'разблокировать';

    onShowConfirm(
      `${newBlocked ? 'Блокировка' : 'Разблокировка'} пользователя`,
      `Вы уверены, что хотите ${actionName} пользователя ${u.displayName || u.email}?`,
      async () => {
        try {
          await updateUserStatus(u.uid, { isBlocked: newBlocked });
          loadUsers();
          onShowToast(`Пользователь ${newBlocked ? 'заблокирован' : 'разблокирован'}`, newBlocked ? 'warning' : 'success');
        } catch (err) {
          console.error(err);
          onShowToast('Ошибка обновления статуса блокировки', 'error');
        }
      },
      newBlocked
    );
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesQuery =
      !orderSearch ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.productTitle.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.flavorName && o.flavorName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    return (
      !userSearch ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-lg flex flex-col">
      
      {/* Top Admin Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-600 text-zinc-950 font-bold">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-zinc-100 font-mono">
              Панель Администратора
            </h1>
            <p className="text-xs text-zinc-400">Управление каталогом ISTERIKA</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/50 transition-all"
          title="Закрыть админку"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-amber-600 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Товары ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-600 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>История заказов ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-amber-600 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Пользователи ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-600 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Настройки</span>
          </button>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Управление товарами</h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Добавляйте новые товары с динамическими вариантами (вкусы, цвета, типы) и статусами
                </p>
              </div>

              <button
                onClick={handleOpenCreateProduct}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-sm shadow-sm transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить товар</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl my-4 text-zinc-400">
                В каталоге еще нет товаров. Нажмите «Добавить товар», чтобы наполнить каталог.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                  const pluralLabel = getVariantLabel(p.category, 'plural');
                  return (
                    <div
                      key={p.id}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex gap-3 mb-3">
                          <img
                            src={p.imageUrl || DEFAULT_VAPE_IMAGE}
                            alt={p.title}
                            className="w-16 h-16 rounded-xl object-cover bg-zinc-950 border border-zinc-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_VAPE_IMAGE;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-300 border border-zinc-800 font-semibold uppercase">
                              {CATEGORY_LABELS[p.category]}
                            </span>
                            <h3 className="text-sm font-bold text-white truncate mt-1">{p.title}</h3>
                            <p className="text-sm font-mono font-bold text-amber-400">{p.price.toFixed(2)} BYN</p>
                          </div>
                        </div>

                        {/* Flavors / Colors / Types list */}
                        <div className="mt-2 text-xs space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 max-h-28 overflow-y-auto">
                          <span className="text-[10px] text-zinc-400 block font-semibold mb-1">
                            {pluralLabel} ({p.flavors?.length || 0}):
                          </span>
                          {p.flavors?.map((fl) => (
                            <div key={fl.id} className="flex justify-between items-center text-zinc-300 py-0.5">
                              <span className="truncate pr-2">• {fl.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${FLAVOR_STATUS_LABELS[fl.status]?.badgeBg}`}>
                                {FLAVOR_STATUS_LABELS[fl.status]?.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Редактировать</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs transition-all"
                          title="Удалить товар"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">История заказов</h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Все заказы, сгенерированные клиентами на сайте
                </p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'new', 'processing', 'completed', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      orderStatusFilter === st
                        ? 'bg-amber-600 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {st === 'all' ? 'Все' : ORDER_STATUS_LABELS[st].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Orders */}
            <div className="mb-4 relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по номеру #IST-..., товару или почте..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400">
                Заказов не найдено.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-amber-400">
                          {o.orderNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${ORDER_STATUS_LABELS[o.status]?.badgeBg}`}
                        >
                          {ORDER_STATUS_LABELS[o.status]?.label}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {new Date(o.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">
                        {o.productTitle} — <span className="text-amber-400">{o.flavorName}</span>
                      </div>

                      <div className="text-xs text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Сумма: <strong className="text-amber-400 font-mono">{o.price.toFixed(2)} BYN</strong></span>
                        {o.userEmail && <span>Пользователь: {o.userEmail}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
                      <div className="w-36">
                        <CustomSelect
                          options={[
                            { value: 'new', label: 'Новый', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
                            { value: 'processing', label: 'В обработке', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                            { value: 'completed', label: 'Завершен', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                            { value: 'cancelled', label: 'Отменен', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                          ]}
                          value={o.status}
                          onChange={(val) => handleStatusChange(o.id, val as OrderStatus)}
                          size="sm"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteOrder(o.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs"
                        title="Удалить из истории"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Зарегистрированные пользователи</h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Выдача администраторских прав и блокировка аккаунтов
                </p>
              </div>

              <button
                onClick={loadUsers}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Обновить список</span>
              </button>
            </div>

            <div className="mb-4 relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400">
                Пользователи не найдены.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const isMainAdmin = u.email === 'romanparfinov@gmail.com';

                  return (
                    <div
                      key={u.uid}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                          alt={u.displayName}
                          className="w-10 h-10 rounded-full border border-zinc-700 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{u.displayName}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                {isMainAdmin ? 'Главный Админ' : 'Администратор'}
                              </span>
                            )}
                            {u.isBlocked && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                                Заблокирован
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </div>
                      </div>

                      {!isMainAdmin && (
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {u.role === 'admin' ? 'Снять админку' : 'Дать админку'}
                          </button>

                          <button
                            onClick={() => handleToggleBlock(u)}
                            className={`p-2 rounded-xl text-xs transition-all ${
                              u.isBlocked
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                            title={u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                          >
                            {u.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-xl">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">Настройки приложения</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6">
              Укажите контакты менеджера для получения заказов
            </p>

            <form onSubmit={handleSaveConfig} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Имя пользователя менеджера Telegram (без @)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
                  <input
                    type="text"
                    value={config.telegramUsername}
                    onChange={(e) => setConfig({ ...config, telegramUsername: e.target.value.replace(/^@/, '') })}
                    placeholder="isterika_vape_manager"
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  На этот аккаунт клиент перейдет после нажатия кнопки «Перейти к менеджеру»
                </p>
              </div>

              {configSavedMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Настройки успешно сохранены!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-sm shadow-sm transition-all"
              >
                {savingConfig ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100 my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingProductId ? 'Редактировать товар' : 'Добавить новый товар'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Общее название товара *
                </label>
                <input
                  type="text"
                  placeholder="например: Monomax Salt 30ml"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Категория *
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'liquids', label: 'Жидкости' },
                      { value: 'consumables', label: 'Расходники' },
                      { value: 'snus', label: 'Снюсы' },
                      { value: 'pods', label: 'Под-системы' },
                    ]}
                    value={formCategory}
                    onChange={(val) => setFormCategory(val as Category)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Цена в BYN *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Image URL or File Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Ссылка на фото или загрузка файла
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... или выберите файл справа"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Файл</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Описание товара (опционально)
                </label>
                <textarea
                  rows={2}
                  placeholder="Краткое описание, крепость, характеристики..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* DYNAMIC MULTI-VARIANTS SECTION (Flavors / Colors / Types) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-amber-400">
                    {getVariantLabel(formCategory, 'title')}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFlavorRow}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить {getVariantLabel(formCategory, 'singular').toLowerCase()}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formFlavors.map((fl, index) => (
                    <div key={fl.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Название (${getVariantLabel(formCategory, 'singular').toLowerCase()})`}
                        value={fl.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormFlavors((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, name: val } : item))
                          );
                        }}
                        className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                        required
                      />

                      <div className="w-36 shrink-0">
                        <CustomSelect
                          options={[
                            { value: 'in_stock', label: 'В наличии', badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                            { value: 'reserved', label: 'Забронировано', badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
                            { value: 'out_of_stock', label: 'Нет в наличии', badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
                          ]}
                          value={fl.status}
                          onChange={(val) => {
                            setFormFlavors((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, status: val as FlavorStatus } : item))
                            );
                          }}
                          size="sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFlavorRow(index)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold transition-all shadow-sm"
                >
                  {savingProduct ? 'Сохранение...' : editingProductId ? 'Сохранить изменения' : 'Создать товар'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
