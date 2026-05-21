"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  handle: string;
  productName: string;
  categoryL1: string | null;
  categoryL3: string | null;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQty: number;
  isMounted: boolean;
  hasItem: (handle: string) => boolean;
  addItem: (item: Omit<CartItem, "qty">, qty: number) => void;
  updateQty: (handle: string, qty: number) => void;
  removeItem: (handle: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "sound-trade-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // localStorage が読めない・パース失敗時は空のまま
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // 容量超過などは握りつぶす
    }
  }, [items, isMounted]);

  const hasItem = useCallback(
    (handle: string) => items.some((i) => i.handle === handle),
    [items],
  );

  const addItem: CartContextValue["addItem"] = useCallback((item, qty) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.handle === item.handle);
      if (existing) {
        return prev.map((i) =>
          i.handle === item.handle ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const updateQty: CartContextValue["updateQty"] = useCallback(
    (handle, qty) => {
      setItems((prev) =>
        prev.map((i) => (i.handle === handle ? { ...i, qty: Math.max(1, qty) } : i)),
      );
    },
    [],
  );

  const removeItem: CartContextValue["removeItem"] = useCallback((handle) => {
    setItems((prev) => prev.filter((i) => i.handle !== handle));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalQty = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalQty,
      isMounted,
      hasItem,
      addItem,
      updateQty,
      removeItem,
      clear,
    }),
    [items, totalQty, isMounted, hasItem, addItem, updateQty, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
