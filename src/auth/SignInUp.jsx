// src/auth/SignInUp.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

// IMPORTANT : ce composant ne dépend d'aucun AuthContext.
// Il marche même si AuthProvider/FakeAuthContext sont cassés.

export default function SignInUp() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErr("");
    setMsg("");

    const clean = String(email || "").trim().toLowerCase();
    if (!clean) {
      setErr("Merci de saisir un email.");
      return;
    }

    try {
      setLoading(true);

      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      setMsg(
        "✅ Lien envoyé ! Ouvre ton email et clique sur le lien pour te connecter."
      );
    } catch (e) {
      console.error("❌ signInWithOtp error:", e);
      setErr(e?.message || "Impossible d’envoyer le lien. Réessaie.");
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
        Crée ton compte (bêta) = connexion par email (Magic Link)
      </div>

      {/* Build stamp: si tu ne le vois pas en prod, c'est que Vercel n'a pas pris le dernier code */}
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>
        BUILD: 2025-12-28-OTP-DIRECT
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
          Email
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
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
              whiteSpace: "pre-wrap",
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
              whiteSpace: "pre-wrap",
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
          {loading ? "Envoi..." : "Recevoir mon lien de connexion"}
        </button>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Sur mobile : ouvre le lien dans Safari/Chrome (évite le navigateur interne Gmail/Instagram).
        </div>
      </form>
    </div>
  );
}
