import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
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
      await syncUserProfile(result.user);
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
    await syncUserProfile(result.user);
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
    console.error('Error handling redirect login result:', err);
  }
  return null;
};

// Sign out
export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('isterika_guest_profile');
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
};

// Login as Guest / Anonymous User (Works on ANY domain without OAuth restriction)
export const loginAsGuest = async (displayName?: string, telegramUsername?: string): Promise<UserProfile> => {
  const name = displayName?.trim() || 'Покупатель';
  const tg = telegramUsername?.replace(/^@/, '').trim() || '';

  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let profile: UserProfile;

    if (userSnap.exists()) {
      const existingData = userSnap.data() as UserProfile;
      profile = {
        ...existingData,
        displayName: name || existingData.displayName,
        telegramUsername: tg || existingData.telegramUsername,
        lastLoginAt: new Date().toISOString(),
      };
      await updateDoc(userRef, {
        displayName: profile.displayName,
        telegramUsername: profile.telegramUsername,
        lastLoginAt: profile.lastLoginAt,
      });
    } else {
      profile = {
        uid: user.uid,
        email: '',
        displayName: name,
        photoURL: '',
        role: 'user',
        telegramUsername: tg,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(userRef, profile);
    }
    localStorage.setItem('isterika_guest_profile', JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.warn('Firebase anonymous auth failed, creating local guest session:', err);
    let guestUid = localStorage.getItem('isterika_guest_uid');
    if (!guestUid) {
      guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('isterika_guest_uid', guestUid);
    }

    const profile: UserProfile = {
      uid: guestUid,
      email: '',
      displayName: name || `Покупатель #${guestUid.slice(-5)}`,
      photoURL: '',
      role: 'user',
      telegramUsername: tg,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    localStorage.setItem('isterika_guest_profile', JSON.stringify(profile));
    return profile;
  }
};

export const getLocalGuestProfile = (): UserProfile | null => {
  try {
    const cached = localStorage.getItem('isterika_guest_profile');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
};

// Sync User Profile in Firestore
export const syncUserProfile = async (user: User): Promise<UserProfile> => {
  if (!user || !user.uid) throw new Error('User not provided');
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const email = (user.email || '').toLowerCase().trim();
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL.toLowerCase();

  let profile: UserProfile;

  if (userSnap.exists()) {
    const existingData = userSnap.data() as UserProfile;
    
    // Super admin is ALWAYS admin
    const role = isSuperAdmin ? 'admin' : (existingData.role || 'user');

    profile = {
      ...existingData,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
      photoURL: user.photoURL || '',
      role,
      lastLoginAt: new Date().toISOString(),
    };

    await updateDoc(userRef, {
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      role: profile.role,
      lastLoginAt: profile.lastLoginAt,
    });
  } else {
    // New user
    profile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
      photoURL: user.photoURL || '',
      role: isSuperAdmin ? 'admin' : 'user',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await setDoc(userRef, profile);
  }

  return profile;
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

// Subscribe to Products (Realtime)
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    try {
      localStorage.setItem('isterika_cached_products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    callback(products);
  }, (error) => {
    console.error('Error subscribing to products:', error);
  });
};

// Add Product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const productsRef = collection(db, 'products');
  const now = new Date().toISOString();
  const docRef = await addDoc(productsRef, {
    ...productData,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

// Update Product
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

// Delete Product
export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};

// ==================== ORDERS ====================

// Generate Order Number (#IST-XXXX)
export const generateOrderNumber = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `#IST-${randomNum}`;
};

// Create New Order
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
  const ordersRef = collection(db, 'orders');
  const now = new Date().toISOString();
  
  const newOrder: Omit<Order, 'id'> = {
    ...orderData,
    status: 'new',
    createdAt: now,
  };

  const docRef = await addDoc(ordersRef, newOrder);
  return { id: docRef.id, ...newOrder };
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
    console.error('Error subscribing to orders:', error);
    callback([]);
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
    console.error('Error subscribing to user orders:', error);
    callback([]);
  });
};

// Update Order Status
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status });
};

// Delete Order
export const deleteOrder = async (orderId: string): Promise<void> => {
  const orderRef = doc(db, 'orders', orderId);
  await deleteDoc(orderRef);
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
  } catch (error) {
    console.error('Error fetching config:', error);
  }
  return { telegramUsername: 'isterika_vape_manager' };
};

export const updateAppConfig = async (config: AppConfig): Promise<void> => {
  const configRef = doc(db, 'config', CONFIG_DOC_ID);
  await setDoc(configRef, config, { merge: true });
};
