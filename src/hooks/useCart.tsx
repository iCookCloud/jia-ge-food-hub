import { useState, useCallback } from 'react';

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
  }
};

export const useCart = () => {
  const [items, setItemsState] = useState<CartItem[]>(() => cartStorage.get());

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