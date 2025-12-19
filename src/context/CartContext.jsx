// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "df_cart_v1";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}

export default function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, fee: 0, total: 0 });

  // Chargement depuis localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (e) {
      console.warn("Erreur lecture localStorage cart:", e);
    }
  }, []);

  // Sauvegarde + calcul des totaux
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Erreur écriture localStorage cart:", e);
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.unit_price_eur || 0) * (item.quantity || 0),
      0
    );
    const fee = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + fee) * 100) / 100;
    setTotals({ subtotal, fee, total });
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: (p.quantity || 0) + 1 }
            : p
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          unit_price_eur: product.unit_price_eur,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const setQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    totals,
    addToCart,
    removeFromCart,
    setQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
