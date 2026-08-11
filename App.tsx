import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  syncUserProfile, 
  subscribeToProducts, 
  createOrder, 
  generateOrderNumber, 
  fetchAppConfig,
  checkRedirectResult,
  SUPER_ADMIN_EMAIL
} from './firebase';
import { Product, Flavor, Category, UserProfile, AppConfig, CATEGORY_LABELS } from './types';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { ProductGrid } from './components/ProductGrid';
import { OrderModal } from './components/OrderModal';
import { AdminPanel } from './components/AdminPanel';
import { Toast } from './components/Toast';
import { ConfirmationModal } from './components/ConfirmationModal';
import { UserOrdersModal } from './components/UserOrdersModal';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Config (Telegram username)
  const [appConfig, setAppConfig] = useState<AppConfig>({ telegramUsername: 'isterika_vape_manager' });

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // User Orders History modal state
  const [showUserOrders, setShowUserOrders] = useState(false);

  // Active Order Modal state
  const [activeOrder, setActiveOrder] = useState<{
    orderNumber: string;
    product: Product;
    flavor: Flavor;
  } | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  // Helper to show custom site-native Toast
  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    setToast({ message, type });
  };

  // Helper to show custom site-native Confirmation Modal
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false
  ) => {
    setConfirmModal({
      title,
      message,
      onConfirm,
      isDanger,
    });
  };

  // Check if running inside Telegram Mini App (TWA)
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);

  // Listen to Auth State and process OAuth redirect results
  useEffect(() => {
    checkRedirectResult().catch((err) => console.warn('Redirect auth check:', err));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Products (Realtime)
  useEffect(() => {
    const unsubscribe = subscribeToProducts((fetchedProducts) => {
      setProducts(fetchedProducts);
    });
    return () => unsubscribe();
  }, []);

  // Fetch App Config (Telegram handle)
  useEffect(() => {
    fetchAppConfig().then((config) => {
      if (config) setAppConfig(config);
    });
  }, []);

  // Determine if logged in user is admin
  const isSuperAdmin = currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isSuperAdmin || userProfile?.role === 'admin';

  // Handle Google Login
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      showToast('Успешный вход через Google!', 'success');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        showToast('Ошибка при входе через Google. Попробуйте еще раз.', 'error');
      }
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setShowAdminPanel(false);
      setShowUserOrders(false);
      showToast('Вы успешно вышли из аккаунта', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle Create Order (Instant Modal display, Firestore write in background for maximum speed)
  const handleOrder = (product: Product, selectedFlavor: Flavor) => {
    const orderNumber = generateOrderNumber();

    // 1. Show modal instantly for instant snappy UX
    setActiveOrder({
      orderNumber,
      product,
      flavor: selectedFlavor,
    });

    // 2. Persist order in Firestore asynchronously
    createOrder({
      orderNumber,
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      flavorName: selectedFlavor.name,
      price: product.price,
      userId: currentUser?.uid || '',
      userEmail: currentUser?.email || '',
      userName: currentUser?.displayName || '',
    }).catch((error) => {
      console.error('Error saving order to Firestore:', error);
    });
  };

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate counts per category
  const productCounts: Record<string, number> = {
    all: products.length,
    liquids: products.filter((p) => p.category === 'liquids').length,
    consumables: products.filter((p) => p.category === 'consumables').length,
    snus: products.filter((p) => p.category === 'snus').length,
    pods: products.filter((p) => p.category === 'pods').length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-zinc-400 tracking-widest uppercase animate-pulse">
            ISTERIKA...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 flex flex-col justify-between">
      
      {/* Header */}
      <Header
        user={userProfile}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onLogout={handleLogout}
        showAdminPanel={showAdminPanel}
        onToggleAdminPanel={() => setShowAdminPanel(!showAdminPanel)}
        onOpenUserOrders={() => setShowUserOrders(true)}
        isTelegramWebApp={isTelegramWebApp}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">

        {/* Category Navigation (Adapted for mobile without horizontal scrollbars) */}
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          productCounts={productCounts}
        />

        {/* Active Category Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-base sm:text-xl font-bold text-gray-200">
            {selectedCategory === 'all'
              ? 'Все товары'
              : CATEGORY_LABELS[selectedCategory]}
            {searchQuery && (
              <span className="text-xs sm:text-sm font-normal text-amber-400 ml-2">
                (Поиск: «{searchQuery}»)
              </span>
            )}
          </h2>

          <span className="text-xs text-gray-400 font-mono">
            Найдено: {filteredProducts.length}
          </span>
        </div>

        {/* Product Grid (Strictly 2 cards per row on mobile screens) */}
        <ProductGrid
          products={filteredProducts}
          onOrder={handleOrder}
          isAdmin={isAdmin}
          onAddProduct={() => setShowAdminPanel(true)}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-6 sm:py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-zinc-500 space-y-2">
          <p className="font-mono text-zinc-400">
            © {new Date().getFullYear()} ISTERIKA Vape Catalog. Все права защищены.
          </p>
          <p className="text-[11px] text-zinc-500">
            Продукция предназначена только для лиц, достигших совершеннолетия (18+).
          </p>
        </div>
      </footer>

      {/* Admin Panel (Accessible strictly to Admin) */}
      {showAdminPanel && isAdmin && (
        <AdminPanel
          products={products}
          onClose={() => setShowAdminPanel(false)}
          onShowToast={showToast}
          onShowConfirm={showConfirm}
        />
      )}

      {/* User Orders Modal */}
      {showUserOrders && userProfile && (
        <UserOrdersModal
          user={userProfile}
          products={products}
          onClose={() => setShowUserOrders(false)}
          onRepeatOrder={(product, flavorName) => {
            const foundFlavor = product.flavors.find((f) => f.name === flavorName) || product.flavors[0];
            if (foundFlavor) {
              handleOrder(product, foundFlavor);
            }
          }}
          onShowToast={showToast}
        />
      )}

      {/* Order Modal */}
      {activeOrder && (
        <OrderModal
          orderNumber={activeOrder.orderNumber}
          product={activeOrder.product}
          flavor={activeOrder.flavor}
          telegramUsername={appConfig.telegramUsername}
          onClose={() => setActiveOrder(null)}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <ConfirmationModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
          isDanger={confirmModal.isDanger}
        />
      )}

      {/* Custom Site-Native Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}
