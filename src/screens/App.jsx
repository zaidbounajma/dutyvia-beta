// src/App.jsx
import React from "react";
import AppAuth from "./screens/AppAuth.jsx";
import CartProvider from "./context/CartContext.jsx";

export default function App() {
  return (
    <CartProvider>
      <AppAuth />
    </CartProvider>
  );
}
