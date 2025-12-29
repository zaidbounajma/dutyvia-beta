// src/screens/AppAuth.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

// Screens
import Catalog from "./Catalog.jsx";
import Cart from "./Cart.jsx";
import Checkout from "./Checkout.jsx";
import MyRequests from "./MyRequests.jsx";
import Travelers from "./Travelers.jsx";
import Orders from "./Orders.jsx";

// Components
import StripeReturnHandler from "../components/StripeReturnHandler.jsx";
import ResetTestSessionButton from "../components/ResetTestSessionButton.jsx";

// Auth screen (OTP direct)
import SignInUp from "../auth/SignInUp.jsx";

// Context cart
import { useCart } from "../context/CartContext.jsx";

const LS = {
  buyerName: "dutyvia_buyer_name",
  onboardingSeen: "dutyvia_onboarding_seen",
};

function getLS(key, fallback = "") {
  try {
    const v = localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function setLS(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

const TABS = [
  { key: "catalog", label: "Catalogue" },
  { key: "cart", label: "Panier" },
  { key: "checkout", label: "Checkout" },
  { key: "myrequests", label: "Mes demandes" },
  { key: "travelers", label: "Mes voyageurs" },
  { key: "chat", label: "Chat" },
  { key: "orders", label: "Mes commandes" },
];

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: active ? "1px solid rgba(255,215,0,0.35)" : "1px solid rgba(255,255,255,0.08)",
        background: active ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.03)",
        color: active ? "#FFD700" : "rgba(255,255,255,0.85)",
        cursor: "pointer",
        fontWeight: 800,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function OnboardingCard({ onClose }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(255,215,0,0.18)",
        background: "rgba(10, 20, 35, 0.65)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#FFD700" }}>Comment ça marche (bêta) ✈️🛍️</div>
          <div style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.55 }}>
            <div style={{ marginTop: 6 }}>
              <b>1)</b> Choisis un produit et crée une <b>demande</b> (ville + quantité + budget).
            </div>
            <div style={{ marginTop: 6 }}>
              <b>2)</b> Un <b>voyageur</b> accepte la demande.
            </div>
            <div style={{ marginTop: 6 }}>
              <b>3)</b> Tu <b>paies</b>, le voyageur récupère l’article et vous organisez la <b>remise</b>.
            </div>
            <div style={{ marginTop: 10, opacity: 0.8 }}>
              Mode test : données locales (localStorage). Tu peux réinitialiser à tout moment.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.9)",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          J’ai compris
        </button>
      </div>
    </div>
  );
}

function ChatPlaceholder() {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900 }}>Chat</div>
      <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.5 }}>
        MVP : chat simplifié dans <b>Mes demandes</b> et <b>Mes voyageurs</b>.
      </div>
    </div>
  );
}

export default function AppAuth() {
  // ✅ Supabase session gate (sans AuthContext)
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setUser(data?.session?.user ?? null);
      } catch {
        if (!alive) return;
        setUser(null);
      } finally {
        if (!alive) return;
        setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      alive = false;
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  if (authLoading) {
    return <div style={{ padding: 18, color: "white" }}>Chargement…</div>;
  }

  if (!user) {
    return <SignInUp />;
  }

  // ----- Ton app (connecté) -----
  const cart = useCart();
  const clearCart = cart?.clearCart || (() => {});

  const [activeTab, setActiveTab] = useState("catalog");
  const [buyerName, setBuyerName] = useState(() => getLS(LS.buyerName, ""));
  const [showOnboarding, setShowOnboarding] = useState(() => getLS(LS.onboardingSeen, "") !== "1");

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = getLS(LS.buyerName, "");
      setBuyerName((prev) => (prev === v ? prev : v));
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  const closeOnboarding = () => {
    setLS(LS.onboardingSeen, "1");
    setShowOnboarding(false);
  };

  const headerRight = useMemo(() => {
    const displayName = buyerName?.trim() ? buyerName.trim() : "—";
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Connecté</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{displayName}</div>
        </div>

        <ResetTestSessionButton
          onReset={() => {
            clearCart();
            setBuyerName("");
            setActiveTab("catalog");
          }}
        />
      </div>
    );
  }, [buyerName, clearCart]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 18,
        color: "rgba(255,255,255,0.92)",
        background:
          "radial-gradient(1200px 700px at 10% 0%, rgba(20,40,80,0.55) 0%, rgba(0,0,0,0) 55%)," +
          "radial-gradient(1000px 700px at 90% 10%, rgba(255,215,0,0.12) 0%, rgba(0,0,0,0) 55%)," +
          "linear-gradient(180deg, #070B14 0%, #05070D 100%)",
      }}
    >
      <StripeReturnHandler />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.2 }}>
            Dutyvia <span style={{ color: "#FFD700" }}>(Bêta)</span>
          </div>
          <div style={{ marginTop: 4, opacity: 0.8, lineHeight: 1.4 }}>
            Marketplace Duty-Free — demandes acheteurs ↔ voyageurs
          </div>
        </div>
        {headerRight}
      </div>

      {showOnboarding ? <OnboardingCard onClose={closeOnboarding} /> : null}

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          padding: 10,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {TABS.map((t) => (
          <TabButton key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {activeTab === "catalog" && <Catalog />}
        {activeTab === "cart" && <Cart />}
        {activeTab === "checkout" && <Checkout />}
        {activeTab === "myrequests" && <MyRequests />}
        {activeTab === "travelers" && <Travelers />}
        {activeTab === "chat" && <ChatPlaceholder />}
        {activeTab === "orders" && <Orders />}
      </div>

      <div style={{ marginTop: 18, opacity: 0.65, fontSize: 12 }}>
        Bêta : données locales stockées sur cet appareil (localStorage).
      </div>
    </div>
  );
}
