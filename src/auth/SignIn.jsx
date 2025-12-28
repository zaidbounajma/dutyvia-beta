// src/auth/SignIn.jsx
import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function SignIn() {
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      setLoading(true);
      await signInWithEmail(email);
      setMsg("✅ Lien envoyé ! Ouvre ton email et clique sur le lien pour te connecter.");
    } catch (e2) {
      console.error("SignIn error:", e2);
      setErr(e2?.message || "Impossible d’envoyer le lien. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "40px auto",
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.45)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 950 }}>DutyFree</div>
      <div style={{ opacity: 0.85, fontSize: 13, marginTop: 6 }}>
        Connecte-toi pour continuer
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex: prenom.nom@gmail.com"
          style={{
            width: "100%",
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.92)",
            outline: "none",
          }}
        />

        {err ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(248,113,113,0.10)",
              color: "#fecaca",
              fontSize: 12,
            }}
          >
            ❌ {err}
          </div>
        ) : null}

        {msg ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.35)",
              background: "rgba(34,197,94,0.10)",
              color: "#bbf7d0",
              fontSize: 12,
            }}
          >
            {msg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,215,0,0.25)",
            background: "rgba(255,215,0,0.14)",
            color: "#FFD700",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 950,
          }}
        >
          {loading ? "Envoi..." : "Recevoir un lien de connexion"}
        </button>
      </form>
    </div>
  );
}
