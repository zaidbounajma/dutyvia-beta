// src/auth/SignInUp.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

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

      setMsg("✅ Lien envoyé ! Ouvre ton email et clique sur le lien pour te connecter.");
    } catch (e) {
      console.error("❌ signInWithOtp:", e);
      setErr(e?.message || "Impossible d’envoyer le lien. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 950 }}>DutyFree</div>
      <div style={{ marginTop: 6, opacity: 0.85 }}>Crée ton compte</div>

      {/* SI TU NE VOIS PAS ÇA SUR VERCEL → TU N'AS PAS LE BON BUILD */}
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        BUILD: OTP-DIRECT-2025-12-29
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Email</div>

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
            border: "1px solid rgba(0,0,0,0.15)",
          }}
        />

        {err ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#fee2e2" }}>
            ❌ {err}
          </div>
        ) : null}

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#dcfce7" }}>
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
            border: "1px solid rgba(0,0,0,0.15)",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 900,
          }}
        >
          {loading ? "Envoi..." : "Recevoir mon lien"}
        </button>
      </form>
    </div>
  );
}
