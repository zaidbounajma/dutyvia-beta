// src/screens/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import ResetTestSessionButton from "../components/ResetTestSessionButton.jsx";

const LS_ONBOARDING = "dutyvia_onboarding_seen";
const LS_BUYER_NAME = "dutyvia_buyer_name";

export default function Home({ goToTab }) {
  const { user } = useAuth();

  const [buyerName, setBuyerName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Onboarding: affichage “une fois”
    try {
      const seen = localStorage.getItem(LS_ONBOARDING);
      setShowOnboarding(!seen);
    } catch {
      setShowOnboarding(true);
    }

    // prénom acheteur
    try {
      const raw = localStorage.getItem(LS_BUYER_NAME) || "";
      setBuyerName(raw);
    } catch {
      setBuyerName("");
    }
  }, []);

  const displayName = useMemo(() => {
    return user?.username || user?.email || "👋";
  }, [user]);

  const persistBuyerName = (val) => {
    setBuyerName(val);
    try {
      localStorage.setItem(LS_BUYER_NAME, val);
    } catch {
      // ignore
    }
  };

  const markOnboardingSeen = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(LS_ONBOARDING, "1");
    } catch {
      // ignore
    }
  };

  const cardStyle = {
    borderRadius: 14,
    border: "1px solid rgba(255,215,0,0.18)",
    background:
      "radial-gradient(circle at top left, rgba(23,19,33,0.95), rgba(5,5,9,0.98))",
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
    padding: 14,
  };

  const titleStyle = {
    fontSize: 16,
    fontWeight: 800,
    color: "#f6f0da",
    letterSpacing: 0.2,
  };

  const muted = { color: "#a3a092", fontSize: 12, lineHeight: 1.45 };

  const ctaBtn = (variant) => ({
    width: "100%",
    textAlign: "left",
    borderRadius: 14,
    padding: "12px 12px",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
    transition: "transform 120ms ease, box-shadow 120ms ease",
    background:
      variant === "buyer"
        ? "linear-gradient(135deg, rgba(16,24,52,0.95), rgba(10,18,44,0.95))"
        : "linear-gradient(135deg, rgba(12,44,30,0.95), rgba(6,28,18,0.95))",
    color: "#f6f0da",
  });

  const smallPill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,215,0,0.18)",
    background: "rgba(255,215,0,0.06)",
    color: "#FFD700",
    fontWeight: 700,
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={titleStyle}>Bienvenue {displayName}</div>
            <div style={{ ...muted, marginTop: 4 }}>
              Dutyvia connecte des voyageurs et des acheteurs pour des achats duty free.
              <br />
              Objectif bêta : tester le flow “demande → acceptation → paiement → remise”.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={smallPill}>BÊTA</span>
          </div>
        </div>

        {/* mini profil */}
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#e5e7eb" }}>
            Votre prénom (affiché aux voyageurs)
          </label>
          <input
            value={buyerName}
            onChange={(e) => persistBuyerName(e.target.value)}
            placeholder="Ex: Zaid"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "#f6f0da",
              outline: "none",
            }}
          />
          <div style={{ ...muted }}>
            Astuce : ce prénom est stocké localement (session de test).
          </div>
        </div>

        {/* reset */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <ResetTestSessionButton
            onReset={() => {
              // best effort : reset UI state
              setBuyerName("");
              setShowOnboarding(true);
            }}
          />
        </div>
      </section>

      {/* Onboarding 3 étapes (affiché la 1ère fois) */}
      {showOnboarding && (
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={titleStyle}>Comment ça marche ?</div>
              <div style={{ ...muted, marginTop: 4 }}>
                En 3 étapes simples. Vous pouvez tester acheteur ou voyageur.
              </div>
            </div>
            <button
              onClick={markOnboardingSeen}
              style={{
                borderRadius: 12,
                padding: "8px 10px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "#f6f0da",
                cursor: "pointer",
                height: 36,
              }}
              title="Masquer ce guide"
            >
              OK, j’ai compris
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 800, color: "#f6f0da", fontSize: 13 }}>
                1) L’acheteur publie une demande
              </div>
              <div style={{ ...muted, marginTop: 4 }}>
                Choisissez un produit, une ville de rendez-vous, une quantité et un budget max.
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 800, color: "#f6f0da", fontSize: 13 }}>
                2) Un voyageur accepte
              </div>
              <div style={{ ...muted, marginTop: 4 }}>
                Le voyageur confirme qu’il peut acheter en duty free et vous discutez pour valider.
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 800, color: "#f6f0da", fontSize: 13 }}>
                3) Paiement puis remise
              </div>
              <div style={{ ...muted, marginTop: 4 }}>
                Paiement Stripe (test). Ensuite, remise en main propre à l’arrivée ✈️
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Choix de rôle */}
      <section style={cardStyle}>
        <div style={titleStyle}>Que voulez-vous faire ?</div>
        <div style={{ ...muted, marginTop: 4 }}>
          Choisissez un parcours. Vous pourrez basculer à tout moment.
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <button
            style={ctaBtn("buyer")}
            onClick={() => {
              if (typeof goToTab === "function") goToTab("catalog");
              else console.log("Go catalog");
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{ fontWeight: 900, fontSize: 13 }}>🛒 Je veux acheter un produit détaxé</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Je crée une demande, un voyageur l’accepte, puis je paie.
            </div>
          </button>

          <button
            style={ctaBtn("traveler")}
            onClick={() => {
              if (typeof goToTab === "function") goToTab("travelers");
              else console.log("Go travelers");
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{ fontWeight: 900, fontSize: 13 }}>✈️ Je voyage, je peux rapporter</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Je vois les demandes par ville et j’en accepte une.
            </div>
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (typeof goToTab === "function") goToTab("myRequests");
              else console.log("Go myRequests");
            }}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "#f6f0da",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            📌 Mes demandes
          </button>

          <button
            onClick={() => {
              if (typeof goToTab === "function") goToTab("orders");
              else console.log("Go orders");
            }}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "#f6f0da",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            🧾 Mes commandes
          </button>

          <button
            onClick={() => {
              if (typeof goToTab === "function") goToTab("chat");
              else console.log("Go chat");
            }}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "#f6f0da",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            💬 Ouvrir mes conversations
          </button>
        </div>
      </section>

      {/* Petit footer bêta */}
      <section style={{ ...muted, textAlign: "center" }}>
        En bêta, certaines informations (prénom, panier, commandes payées locales) sont stockées en local sur votre navigateur.
      </section>
    </div>
  );
}
