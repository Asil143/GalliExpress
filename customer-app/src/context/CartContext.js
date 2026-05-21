import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@galliexpress_cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // cart: { [itemId]: quantity }
  const [cart, setCart] = useState({});
  // cartShop: full shop object the cart belongs to
  const [cartShop, setCartShop] = useState(null);
  // menuItems keyed by id so CartScreen can reconstruct full items
  const [cartMenuItems, setCartMenuItems] = useState({});
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          setCart(saved.cart || {});
          setCartShop(saved.cartShop || null);
          setCartMenuItems(saved.cartMenuItems || {});
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  // Persist whenever cart changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cart, cartShop, cartMenuItems })
    ).catch(() => {});
  }, [cart, cartShop, cartMenuItems, hydrated]);

  const addToCart = useCallback((item, shop) => {
    // If adding from a different shop, clear the old cart first
    if (cartShop && cartShop.id !== shop.id) {
      setCart({ [item.id]: 1 });
      setCartShop(shop);
      setCartMenuItems({ [item.id]: item });
      return;
    }
    if (!cartShop) setCartShop(shop);
    setCartMenuItems((prev) => ({ ...prev, [item.id]: item }));
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  }, [cartShop]);

  const removeFromCart = useCallback((itemId) => {
    setCart((prev) => {
      const qty = prev[itemId] || 0;
      if (qty <= 1) {
        const next = { ...prev };
        delete next[itemId];
        if (Object.keys(next).length === 0) {
          // Cart is now empty — clear shop too
          setCartShop(null);
          setCartMenuItems({});
        }
        return next;
      }
      return { ...prev, [itemId]: qty - 1 };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setCartShop(null);
    setCartMenuItems({});
  }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, quantity]) => ({ ...(cartMenuItems[id] || { id }), quantity }));

  const cartTotal = cartItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartShop,
        cartItems,
        cartCount,
        cartTotal,
        hydrated,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
