import { useState, useCallback, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  unit: string;
  image?: string;
  specifications?: string;
  supplier: {
    name: string;
    verified: boolean;
  };
  quantity: number;
}

// Simple state management for cart
const cartStorage = {
  get: (): CartItem[] => {
    try {
      const stored = localStorage.getItem('cart-items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  set: (items: CartItem[]) => {
    localStorage.setItem('cart-items', JSON.stringify(items));
    // 触发自定义事件，通知其他组件购物车已更新
    window.dispatchEvent(new Event('cart-updated'));
  }
};

export const useCart = () => {
  const [items, setItemsState] = useState<CartItem[]>(() => cartStorage.get());

  // 监听 localStorage 变化，确保跨页面状态同步
  useEffect(() => {
    const handleStorageChange = () => {
      setItemsState(cartStorage.get());
    };

    // 监听 storage 事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（同一标签页内的页面切换）
    window.addEventListener('cart-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleStorageChange);
    };
  }, []);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItemsState(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      const newItems = existingItem 
        ? prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...prevItems, { ...product, quantity }];
      
      cartStorage.set(newItems);
      return newItems;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItemsState(prevItems => {
      const newItems = prevItems.filter(item => item.id !== productId);
      cartStorage.set(newItems);
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItemsState(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      );
      cartStorage.set(newItems);
      return newItems;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItemsState([]);
    cartStorage.set([]);
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalAmount = useCallback(() => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  }, [items]);

  const getItemQuantity = useCallback((productId: string) => {
    const item = items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalAmount,
    getItemQuantity
  };
};