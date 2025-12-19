// src/App.jsx
import React from "react";
import CartProvider from "./context/CartContext.jsx";
import AppAuth from "./screens/AppAuth.jsx";

export default function App() {
  return (
    <CartProvider>
      <AppAuth />
    </CartProvider>
  );
}
