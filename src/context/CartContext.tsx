import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { CartItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  addToCart: (
    productId: string,
    quantity?: number,
    color?: string,
    size?: string
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadCart(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setItems((data as CartItem[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (session) {
      loadCart(session.user.id);
    } else {
      setItems([]);
    }
  }, [session]);

  const addToCart: CartContextValue['addToCart'] = async (
    productId,
    quantity = 1,
    color = '',
    size = ''
  ) => {
    if (!session) return;
    const existing = items.find(
      (i) =>
        i.product_id === productId && i.color === color && i.size === size
    );
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
    } else {
      const { data } = await supabase
        .from('cart_items')
        .insert({
          user_id: session.user.id,
          product_id: productId,
          quantity,
          color,
          size,
        })
        .select('*, product:products(*)')
        .maybeSingle();
      if (data) setItems((prev) => [data as CartItem, ...prev]);
    }
  };

  const updateQuantity: CartContextValue['updateQuantity'] = async (
    itemId,
    quantity
  ) => {
    if (!session) return;
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const removeItem: CartContextValue['removeItem'] = async (itemId) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = async () => {
    if (!session) return;
    await supabase.from('cart_items').delete().eq('user_id', session.user.id);
    setItems([]);
  };

  const refreshCart = async () => {
    if (session) await loadCart(session.user.id);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
