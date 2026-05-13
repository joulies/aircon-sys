import React, { createContext, useContext, useState, useCallback } from 'react';
import { getCartCount } from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    try {
      const data = await getCartCount();
      setCartCount(data.total || 0);
    } catch (error) {
      console.error('Error refreshing cart count:', error);
    }
  }, []);

  const incrementCartCount = useCallback((amount = 1) => {
    setCartCount(prevCount => prevCount + amount);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCartCount, incrementCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
