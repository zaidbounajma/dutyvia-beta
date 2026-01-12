// src/auth/SignInUp.jsx
import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

export default function SignInUp() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    const e = email.trim();
    const p = password;
    return e.length > 3 && p.length >= 6 && !loading;
  }, [email, password, loading]);

  const resetAlerts = () => {
    setMsg("");
    setErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetAlerts();

    const eMail = email.trim().toLowerCase();
    const pwd = password;

    if (!eMail) {
      setErr("Email requis.");
      return;
    }
    if (!pwd || pwd.length < 6) {
      setErr("Mot de passe : minimum 6 caractères.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        // ✅ Création de compte email + mot de passe
        const { data, error } = await supabase.auth.signUp({
          email: eMail,
          password: pwd,
          options: {
            // Si tu as "Confirm email" activé, Supabase enverra un email de confirmation.
            // redirectTo: window.location.origin, // optionnel
          },
        });

        if (error) throw error;

        // Deux cas :
        // - confirm email OFF → user est connecté direct
        // - confirm email ON → user doit confirmer par email avant login
        const needsEmailConfirm = !data?.session;

        if (needsEmailConfirm) {
          setMsg(
            "✅ Compte créé. Vérifie ton email pour confirmer ton inscription, puis reviens te connecter."
          );
        } else {
          setMsg("✅ Compte créé et connecté !");
        }
      } else {
        // ✅ Connexion email + mot de passe
        const { data, error } = await supabase.auth.signInWithPassword({
          email: eMail,
          password: pwd,
        });

        if (error) throw error;

        if (data?.session) {
          setMsg("✅ Connecté !");
        } else {
          setMsg("Connexion effectuée.");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);

      // Messages un peu plus clairs
      const raw = error?.message || String(error);

      if (raw.toLowerCase().includes("invalid login")) {
        setErr("❌ Email ou mot de passe incorrect.");
      } else if (raw.toLowerCase().includes("email not confirmed")) {
        setErr("❌ Email non confirmé. Vérifie ton email puis réessaie.");
      } else if (raw.toLowerCase().includes("user already registered")) {
        setErr("❌ Ce compte existe déjà. Essaie “Se connecter”.");
      } else {
        setErr(`❌ ${raw}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        color: "rgba(255,255,255,0.92)",
        background:
          "radial-gradient(1200px 700px at 10% 0%, rgba(20,40,80,0.55) 0%, rgba(0,0,0,0) 55%)," +
          "radial-gradient(1000px 700px at 90% 10%, rgba(255,215,0,0.12) 0%, rgba(0,0,0,0) 55%)," +
          "linear-gradient(180deg, #070B14 0%, #05070D 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: 0.2 }}>
          DutyFree
        </div>

        <div style={{ marginTop: 10, opacity: 0.9 }}>
          {mode === "signup" ? "Crée ton compte" : "Connecte-toi pour continuer"}
        </div>

        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          BUILD: OTP-REMOVED-2026-01-12
        </div>

        {err && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(248, 113, 113, 0.5)",
              background: "rgba(248, 113, 113, 0.12)",
              color: "#fecaca",
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {err}
          </div>
        )}

        {msg && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(34, 197, 94, 0.45)",
              background: "rgba(34, 197, 94, 0.12)",
              color: "#bbf7d0",
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {msg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            padding: 14,
          }}
        >
          <label style={{ display: "block", fontSize: 12, opacity: 0.85 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              resetAlerts();
            }}
            placeholder="ex: prenom.nom@gmail.com"
            autoComplete="email"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.35)",
              color: "rgba(255,255,255,0.92)",
              outline: "none",
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: 12,
              opacity: 0.85,
              marginTop: 12,
            }}
          >
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              resetAlerts();
            }}
            placeholder="Min 6 caractères"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.35)",
              color: "rgba(255,255,255,0.92)",
              outline: "none",
            }}
          />

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            {mode === "signup"
              ? "En créant un compte, tu acceptes l’usage en bêta (tests)."
              : "Mot de passe oublié ? (on pourra ajouter ça plus tard)"}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: canSubmit ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.25)",
              color: canSubmit ? "#0b0f18" : "rgba(255,255,255,0.65)",
              fontWeight: 900,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {loading
              ? "Veuillez patienter..."
              : mode === "signup"
              ? "Créer mon compte"
              : "Se connecter"}
          </button>

          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}
            </div>

            <button
              type="button"
              onClick={() => {
                resetAlerts();
                setMode(mode === "signup" ? "signin" : "signup");
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,215,0,0.22)",
                background: "rgba(255,215,0,0.10)",
                color: "#FFD700",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {mode === "signup" ? "Se connecter" : "Créer un compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
