import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  serviceId: string;
  slug: string;
  name: string;
  platform: string;
  quantity: number;
  unitPrice: number;
  unitSize: number;
  total: number;
  target: string;
  note?: string;
};

const KEY = "viralhub_cart_v1";
const EVENT = "viralhub-cart-change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((item: CartItem) => {
    const next = [...read().filter((i) => i.serviceId !== item.serviceId), item];
    write(next);
  }, []);

  const remove = useCallback((serviceId: string) => {
    write(read().filter((i) => i.serviceId !== serviceId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const total = items.reduce((sum, i) => sum + i.total, 0);

  return { items, add, remove, clear, total, ready, count: items.length };
}
