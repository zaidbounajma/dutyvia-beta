import { useState } from "react";
import CartProvider from "../context/CartContext.jsx";

import CartPage from "./Cart.jsx";
import Catalog from "./Catalog.jsx";
import Checkout from "./Checkout.jsx";
import Home from "./Home.jsx";
import MyMatches from "./MyMatches.jsx";
import MyRequests from "./MyRequests.jsx";

/**
 * AppDebug = version SANS AuthProvider.
 *
 * On simule un utilisateur connecté pour que l'app tourne,
 * même si l'auth Supabase est cassée.
 *
 * ON REVIENDRA à la vraie App avec AuthProvider quand on aura
 * réglé le bug de logout.
 */

export default function AppDebug() {
  // on simule un "user" connecté
  const fakeUser = {
    id: "demo-user-123",           // pas UUID, c'est OK pour l'instant
    email: "demo@dutyfree.test",
  };

  // navigation interne
  const [screen, setScreen] = useState("home");

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
        {/* HEADER */}
        <header className="p-4 border-b border-gray-800 bg-gray-900 flex flex-wrap items-start gap-2 text-sm">
          <div className="flex-1 min-w-[150px]">
            <div className="font-medium text-white">DutyFree</div>

            <div className="text-[12px] text-gray-400">
              {fakeUser.email}
            </div>

            <div className="text-[11px] text-gray-500 break-all">
              {fakeUser.id}
            </div>
          </div>

          <nav className="flex gap-2 flex-wrap text-[12px]">
            <TabButton
              active={screen === "home"}
              onClick={() => setScreen("home")}
              label="Home"
            />
            <TabButton
              active={screen === "catalog"}
              onClick={() => setScreen("catalog")}
              label="Catalogue"
            />
            <TabButton
              active={screen === "cart"}
              onClick={() => setScreen("cart")}
              label="Panier"
            />
            <TabButton
              active={screen === "checkout"}
              onClick={() => setScreen("checkout")}
              label="Paiement"
            />
            <TabButton
              active={screen === "requests"}
              onClick={() => setScreen("requests")}
              label="Mes demandes"
            />
            <TabButton
              active={screen === "matches"}
              onClick={() => setScreen("matches")}
              label="Mes voyageurs"
            />

            <button
              className="px-3 py-1 rounded bg-gray-700 border border-gray-600 text-white font-medium opacity-50 cursor-not-allowed"
              disabled
            >
              Logout (désactivé)
            </button>
          </nav>
        </header>

        {/* CONTENU */}
        <main className="flex-1 p-4">
          {screen === "home" && <Home />}

          {screen === "catalog" && (
            <Catalog
              goCart={() => setScreen("cart")}
            />
          )}

          {screen === "cart" && (
            <CartPage
              goCheckout={() => setScreen("checkout")}
              goCatalog={() => setScreen("catalog")}
            />
          )}

          {screen === "checkout" && (
            <Checkout
              goCart={() => setScreen("cart")}
            />
          )}

          {screen === "requests" && (
            <MyRequests />
          )}

          {screen === "matches" && (
            <MyMatches />
          )}
        </main>
      </div>
    </CartProvider>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded ${
        active
          ? "bg-blue-600 text-white font-medium"
          : "bg-gray-800 border border-gray-700 text-white font-medium"
      }`}
    >
      {label}
    </button>
  );
}
