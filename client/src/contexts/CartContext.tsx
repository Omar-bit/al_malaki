import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PackCartEntry } from '../types/pack';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  packs: PackCartEntry[];
  isCartOpen: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  addPack: (entry: PackCartEntry) => void;
  removePack: (packId: string) => void;
  totalItems: number;
  totalPrice: number;
  packDiscount: number;
}

const CART_STORAGE_KEY = 'al_malaki_cart';
const PACKS_STORAGE_KEY = 'al_malaki_packs';

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadPacksFromStorage(): PackCartEntry[] {
  try {
    const stored = localStorage.getItem(PACKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silently fail if localStorage is full
  }
}

function savePacksToStorage(packs: PackCartEntry[]) {
  try {
    localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(packs));
  } catch {
    // Silently fail if localStorage is full
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [packs, setPacks] = useState<PackCartEntry[]>(loadPacksFromStorage);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  useEffect(() => {
    savePacksToStorage(packs);
  }, [packs]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, []);

  const addPack = useCallback((entry: PackCartEntry) => {
    setPacks((prev) => [...prev, entry]);
    setIsCartOpen(true);
  }, []);

  const removePack = useCallback((packId: string) => {
    setPacks((prev) => prev.filter((p) => p.packId !== packId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPacks([]);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const regularSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const packSubtotal = packs.reduce((sum, pack) => sum + pack.subtotal, 0);
  const totalItems =
    items.reduce((sum, item) => sum + item.quantity, 0) +
    packs.reduce((sum, pack) => sum + pack.selections.length, 0);
  const totalPrice = regularSubtotal + packSubtotal;
  const packDiscount = packs.reduce((sum, pack) => sum + pack.discountAmount, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        packs,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        addPack,
        removePack,
        totalItems,
        totalPrice,
        packDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
