// src/screens/AppAuth.jsx
import React, { useEffect, useMemo, useState } from "react";

// Screens
import Catalog from "./Catalog.jsx";
import Cart from "./Cart.jsx";
import Checkout from "./Checkout.jsx";
import MyRequests from "./MyRequests.jsx";
import Travelers from "./Travelers.jsx";
import Orders from "./Orders.jsx";
import Profile from "./Profile.jsx";

// Components
import StripeReturnHandler from "../components/StripeReturnHandler.jsx";
import ResetTestSessionButton from "../components/ResetTestSessionButton.jsx";

// Auth
import { useAuth } from "../auth/AuthContext.jsx";
import SignIn from "../auth/SignIn.jsx";

// Context
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
  { key: "profile", label: "Profil" },
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

function OnboardingCard({ onClose, goTo }) {
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
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: "#FFD700" }}>Comment ça marche (bêta) ✈️🛍️</div>
          <div style={{ marginTop: 10, opacity: 0.92, lineHeight: 1.55, fontSize: 13 }}>
            <div style={{ marginTop: 6 }}>
              <b>1)</b> L’acheteur crée une <b>demande</b> (produit + ville + quantité + budget).
            </div>
            <div style={{ marginTop: 6 }}>
              <b>2)</b> Un <b>voyageur</b> accepte s’il peut acheter en duty free.
            </div>
            <div style={{ marginTop: 6 }}>
              <b>3)</b> Paiement Stripe (test) → <b>remise</b> du produit à l’arrivée.
            </div>
            <div style={{ marginTop: 10, opacity: 0.8 }}>
              En bêta, certaines infos sont stockées localement (localStorage). Tu peux réinitialiser à tout moment.
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => goTo("catalog")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,215,0,0.10)",
                color: "#FFD700",
                cursor: "pointer",
                fontWeight: 950,
              }}
            >
              🛒 Acheter (Catalogue)
            </button>

            <button
              type="button"
              onClick={() => goTo("travelers")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.90)",
                cursor: "pointer",
                fontWeight: 950,
              }}
            >
              ✈️ Voyager (Demandes)
            </button>
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
            whiteSpace: "nowrap",
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
        MVP : chat simplifié dans <b>Mes demandes</b> et <b>Mes voyageurs</b> (via <code>requests.chat_log</code>).
      </div>
    </div>
  );
}

export default function AppAuth() {
  const { clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();

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

  const reopenOnboarding = () => {
    setLS(LS.onboardingSeen, "0");
    setShowOnboarding(true);
  };

  const headerRight = useMemo(() => {
    const displayName = buyerName?.trim() ? buyerName.trim() : "—";
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Connecté</div>
          <div style={{ fontSize: 14, fontWeight: 950, color: "rgba(255,255,255,0.92)" }}>{displayName}</div>
        </div>

        <button
          type="button"
          onClick={reopenOnboarding}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.90)",
            cursor: "pointer",
            fontWeight: 950,
          }}
          title="Revoir le guide"
        >
          ❔ Guide
        </button>

        <ResetTestSessionButton
          onReset={() => {
            clearCart();
            setBuyerName("");
            setActiveTab("catalog");
            setShowOnboarding(true);
          }}
        />
      </div>
    );
  }, [buyerName, clearCart]);

  // UI background
  const shellStyle = {
    minHeight: "100vh",
    padding: 18,
    color: "rgba(255,255,255,0.92)",
    background:
      "radial-gradient(1200px 700px at 10% 0%, rgba(20,40,80,0.55) 0%, rgba(0,0,0,0) 55%)," +
      "radial-gradient(1000px 700px at 90% 10%, rgba(255,215,0,0.12) 0%, rgba(0,0,0,0) 55%)," +
      "linear-gradient(180deg, #070B14 0%, #05070D 100%)",
  };

  if (authLoading) {
    return (
      <div style={shellStyle}>
        <div style={{ opacity: 0.8 }}>Chargement…</div>
      </div>
    );
  }

  // 🔐 Gate: pas connecté => écran login
  if (!user) {
    return (
      <div style={shellStyle}>
        <SignIn />
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <StripeReturnHandler />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.2 }}>
            Dutyvia <span style={{ color: "#FFD700" }}>(Bêta)</span>
          </div>
          <div style={{ marginTop: 4, opacity: 0.8, lineHeight: 1.4 }}>
            Marketplace Duty-Free — demandes acheteurs ↔ voyageurs
          </div>
          <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>
            Connecté : <b>{user?.email}</b>
          </div>
        </div>

        {headerRight}
      </div>

      {showOnboarding ? <OnboardingCard onClose={closeOnboarding} goTo={setActiveTab} /> : null}

      {/* Tabs */}
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

      {/* Content */}
      <div style={{ marginTop: 12 }}>
        {activeTab === "catalog" && <Catalog />}
        {activeTab === "cart" && <Cart />}
        {activeTab === "checkout" && <Checkout />}
        {activeTab === "myrequests" && <MyRequests />}
        {activeTab === "travelers" && <Travelers />}
        {activeTab === "chat" && <ChatPlaceholder />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "profile" && <Profile />}
      </div>

      <div style={{ marginTop: 18, opacity: 0.65, fontSize: 12 }}>
        Bêta : certaines données sont stockées en local (localStorage). Utilise “Réinitialiser la session de test” si besoin.
      </div>
    </div>
  );
}
