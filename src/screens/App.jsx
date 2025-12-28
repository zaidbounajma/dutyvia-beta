// src/App.jsx
import React from "react";
import AppAuth from "./screens/AppAuth.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import CartProvider from "./context/CartContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppAuth />
      </CartProvider>
    </AuthProvider>
  );
}
