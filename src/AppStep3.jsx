import { useState } from "react";
import "./styles.css";

import AuthProvider from "./auth/AuthContext.jsx"; // ⬅️ on utilise maintenant AuthProvider (fake)
import CartProvider from "./context/CartContext.jsx";

import CartPage from "./screens/Cart.jsx";
import Catalog from "./screens/Catalog.jsx";
import Checkout from "./screens/Checkout.jsx";
import Home from "./screens/Home.jsx";

export default function AppStep3() {
  const [screen, setScreen] = useState("home");

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
          <header className="p-4 border-b border-gray-800 bg-gray-900 flex flex-wrap items-start gap-2 text-sm">
            <div className="flex-1 min-w-[150px]">
              <div className="font-medium text-white">DutyFree</div>

              <div className="text-[12px] text-gray-400">
                demo@dutyfree.test
              </div>
              <div className="text-[11px] text-gray-500 break-all">
                demo-user-123
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

              {/* désactivés pour l’instant */}
              <button
                className="px-3 py-1 rounded bg-gray-800 border border-gray-700 text-white font-medium opacity-40 cursor-not-allowed"
                disabled
              >
                Mes demandes
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-800 border border-gray-700 text-white font-medium opacity-40 cursor-not-allowed"
                disabled
              >
                Mes voyageurs
              </button>

              <button
                className="px-3 py-1 rounded bg-gray-700 border border-gray-600 text-white font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                Logout
              </button>
            </nav>
          </header>

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
          </main>
        </div>
      </CartProvider>
    </AuthProvider>
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
