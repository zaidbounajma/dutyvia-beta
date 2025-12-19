import React from "react";

const KEYS_TO_CLEAR = [
  "dutyfree_cart",
  "dutyfree_paid_orders",
  "dutyfree_current_request_id",
  "dutyvia_buyer_name",
  "dutyvia_onboarding_seen",
  // optionnel si tu ajoutes un prénom voyageur plus tard :
  // "dutyvia_traveler_name",
];

export default function ResetTestSessionButton({ onReset }) {
  const handleReset = () => {
    const ok = window.confirm(
      "Réinitialiser la session de test ?\n\nCela va vider le panier, le suivi local des paiements et la demande en cours."
    );
    if (!ok) return;

    KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));

    // Permet au parent de clear les states React (cart, buyerName, etc.)
    if (typeof onReset === "function") onReset();

    // Option simple : reload propre (repart sur un état net)
    window.location.assign(window.location.pathname);
  };

  return (
    <button
      onClick={handleReset}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,215,0,0.25)",
        background: "rgba(255,215,0,0.08)",
        color: "#FFD700",
        cursor: "pointer",
        fontWeight: 700,
      }}
      title="Vider les données locales de test"
    >
      Réinitialiser la session de test
    </button>
  );
}
