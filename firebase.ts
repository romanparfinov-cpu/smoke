import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { Product, Order, UserProfile, AppConfig, OrderStatus } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';

const firebaseConfig = {
  apiKey: "AIzaSyByOxuteEKwId8W85KLLn_gStv5ObV2zWM",
  authDomain: "isterikaai.firebaseapp.com",
  databaseURL: "https://isterikaai-default-rtdb.firebaseio.com",
  projectId: "isterikaai",
  storageBucket: "isterikaai.firebasestorage.app",
  messagingSenderId: "285709727430",
  appId: "1:285709727430:web:05542c9dbc2470d4b309c7",
  measurementId: "G-9L6R6RMX2G"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore
export const db = getFirestore(app);

export const SUPER_ADMIN_EMAIL = 'romanparfinov@gmail.com';

// Sign in with Google (Supports both Popup & Redirect for Telegram WebApp / WebViews)
export const loginWithGoogle = async (): Promise<User | null> => {
  const isTelegram = /Telegram/i.test(navigator.userAgent) || !!(window as any).Telegram?.WebApp;
  const isRestrictedWebView = isTelegram || /FBAN|FBAV|Instagram|Line|MicroMessenger|wv/i.test(navigator.userAgent);
  
  if (isRestrictedWebView) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await syncUserProfile(result.user);
      } catch (sErr) {
        console.warn('Sync profile notice during popup login:', sErr);
      }
      return result.user;
    } catch (popupErr: any) {
      if (popupErr?.code === 'auth/unauthorized-domain') {
        throw new Error('UNAUTHORIZED_DOMAIN');
      }
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr: any) {
        if (redirectErr?.code === 'auth/unauthorized-domain') {
          throw new Error('UNAUTHORIZED_DOMAIN');
        }
        if (isTelegram) {
          throw new Error('TELEGRAM_WEBVIEW_BLOCKED');
        }
        throw redirectErr;
      }
    }
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    try {
      await syncUserProfile(result.user);
    } catch (sErr) {
      console.warn('Sync profile notice during login:', sErr);
    }
    return result.user;
  } catch (popupErr: any) {
    if (popupErr?.code === 'auth/unauthorized-domain') {
      throw new Error('UNAUTHORIZED_DOMAIN');
    }
    if (
      popupErr?.code === 'auth/popup-blocked' || 
      popupErr?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr: any) {
        if (redirectErr?.code === 'auth/unauthorized-domain') {
          throw new Error('UNAUTHORIZED_DOMAIN');
        }
        throw redirectErr;
      }
    }
    throw popupErr;
  }
};

// Check sign in redirect result when app loads
export const checkRedirectResult = async (): Promise<UserProfile | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return await syncUserProfile(result.user);
    }
  } catch (err) {
    console.warn('Notice handling redirect login result:', err);
  }
  return null;
};

// Sign out
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
};

// Sync User Profile in Firestore
export const syncUserProfile = async (user: User): Promise<UserProfile> => {
  if (!user || !user.uid) throw new Error('User not provided');

  const email = (user.email || '').toLowerCase().trim();
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL.toLowerCase();

  const fallbackProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
    photoURL: user.photoURL || '',
    role: isSuperAdmin ? 'admin' : 'user',
    isBlocked: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let profile: UserProfile;

    if (userSnap.exists()) {
      const existingData = userSnap.data() as UserProfile;
      const role = isSuperAdmin ? 'admin' : (existingData.role || 'user');

      profile = {
        ...existingData,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
        photoURL: user.photoURL || '',
        role,
        lastLoginAt: new Date().toISOString(),
      };

      try {
        await updateDoc(userRef, {
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: profile.role,
          lastLoginAt: profile.lastLoginAt,
        });
      } catch (updErr) {
        console.warn('Notice updating user doc in Firestore:', updErr);
      }
    } else {
      profile = fallbackProfile;
      try {
        await setDoc(userRef, profile);
      } catch (setErr) {
        console.warn('Notice creating user doc in Firestore:', setErr);
      }
    }

    return profile;
  } catch (err) {
    console.warn('Firestore user profile sync notice (using fallback profile):', err);
    return fallbackProfile;
  }
};

// Get User Profile from Firestore
export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Get all registered users (for Admin)
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as UserProfile);
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Update User Role or Block status (Admin action)
export const updateUserStatus = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
};

// ==================== PRODUCTS ====================

// Helper to retrieve cached or initial seed products
export const getCachedOrDefaultProducts = (): Product[] => {
  try {
    const cached = localStorage.getItem('isterika_cached_products');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error parsing cached products:', e);
  }
  return INITIAL_PRODUCTS;
};

// Subscribe to Products (Realtime with Initial Products Fallback)
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    if (products.length > 0) {
      try {
        localStorage.setItem('isterika_cached_products', JSON.stringify(products));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      callback(products);
    } else {
      callback(getCachedOrDefaultProducts());
    }
  }, (error) => {
    console.warn('Firestore products subscription notice (using fallback products):', error?.message || error);
    callback(getCachedOrDefaultProducts());
  });
};

// Add Product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date().toISOString();
  let newId = 'prod_' + Math.random().toString(36).substring(2, 9);
  
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: now,
      updatedAt: now,
    });
    newId = docRef.id;
  } catch (err) {
    console.warn('Firestore addProduct warning (saving locally):', err);
  }

  // Also update local cache
  const current = getCachedOrDefaultProducts();
  const newProduct: Product = { ...productData, id: newId, createdAt: now, updatedAt: now };
  const updated = [newProduct, ...current];
  try {
    localStorage.setItem('isterika_cached_products', JSON.stringify(updated));
  } catch (e) {}

  return newId;
};

// Update Product
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore updateProduct warning (updating locally):', err);
  }

  const current = getCachedOrDefaultProducts();
  const updated = current.map(p => p.id === productId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
  try {
    localStorage.setItem('isterika_cached_products', JSON.stringify(updated));
  } catch (e) {}
};

// Delete Product
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } catch (err) {
    console.warn('Firestore deleteProduct warning (deleting locally):', err);
  }

  const current = getCachedOrDefaultProducts();
  const updated = current.filter(p => p.id !== productId);
  try {
    localStorage.setItem('isterika_cached_products', JSON.stringify(updated));
  } catch (e) {}
};

// ==================== ORDERS ====================

// Generate Order Number (#IST-XXXX)
export const generateOrderNumber = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `#IST-${randomNum}`;
};

// Create New Order
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
  const now = new Date().toISOString();
  let newId = 'order_' + Math.random().toString(36).substring(2, 9);
  
  const newOrder: Order = {
    ...orderData,
    id: newId,
    status: 'new',
    createdAt: now,
  };

  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'new',
      createdAt: now,
    });
    newOrder.id = docRef.id;
  } catch (err) {
    console.warn('Firestore createOrder warning (saving locally):', err);
  }

  // Store in local history as fallback
  try {
    const localOrdersRaw = localStorage.getItem('isterika_local_orders');
    const localOrders: Order[] = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
    localStorage.setItem('isterika_local_orders', JSON.stringify([newOrder, ...localOrders]));
  } catch (e) {}

  return newOrder;
};

// Subscribe to Orders (Admin Order History)
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    callback(orders);
  }, (error) => {
    console.warn('Firestore orders subscription notice:', error?.message || error);
    try {
      const localOrdersRaw = localStorage.getItem('isterika_local_orders');
      callback(localOrdersRaw ? JSON.parse(localOrdersRaw) : []);
    } catch (e) {
      callback([]);
    }
  });
};

// Subscribe to User Specific Orders
export const subscribeToUserOrders = (userId: string, callback: (orders: Order[]) => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(orders);
  }, (error) => {
    console.warn('Firestore user orders subscription notice:', error?.message || error);
    try {
      const localOrdersRaw = localStorage.getItem('isterika_local_orders');
      const localOrders: Order[] = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
      const userOrders = localOrders.filter(o => o.userId === userId);
      callback(userOrders);
    } catch (e) {
      callback([]);
    }
  });
};

// Update Order Status
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  } catch (err) {
    console.warn('Firestore updateOrderStatus warning:', err);
  }
};

// Delete Order
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (err) {
    console.warn('Firestore deleteOrder warning:', err);
  }
};

// ==================== APP CONFIG ====================

const CONFIG_DOC_ID = 'main_config';

export const fetchAppConfig = async (): Promise<AppConfig> => {
  try {
    const configRef = doc(db, 'config', CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);
    if (configSnap.exists()) {
      return configSnap.data() as AppConfig;
    }
  } catch (error: any) {
    console.warn('Firestore config fetch notice:', error?.message || error);
  }
  return { telegramUsername: 'isterika_vape_manager' };
};

export const updateAppConfig = async (config: AppConfig): Promise<void> => {
  try {
    const configRef = doc(db, 'config', CONFIG_DOC_ID);
    await setDoc(configRef, config, { merge: true });
  } catch (err) {
    console.warn('Firestore updateAppConfig warning:', err);
  }
};
