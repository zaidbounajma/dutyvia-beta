// src/screens/Profile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import ResetTestSessionButton from "../components/ResetTestSessionButton.jsx";

const LS_BUYER_NAME = "dutyvia_buyer_name";
const LS_DEFAULT_CITY = "dutyvia_default_city";

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();

  const [buyerName, setBuyerName] = useState("");
  const [defaultCity, setDefaultCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    // localStorage (source MVP)
    try {
      setBuyerName(localStorage.getItem(LS_BUYER_NAME) || "");
    } catch {
      setBuyerName("");
    }
    try {
      setDefaultCity(localStorage.getItem(LS_DEFAULT_CITY) || "");
    } catch {
      setDefaultCity("");
    }
  }, []);

  useEffect(() => {
    // si profiles existe, on propose ses valeurs
    if (profile?.username && !buyerName) setBuyerName(profile.username);
    if (profile?.default_city && !defaultCity) setDefaultCity(profile.default_city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const save = async () => {
    setErr("");
    setMsg("");

    try {
      setSaving(true);

      // 1) toujours garder localStorage (MVP)
      try {
        localStorage.setItem(LS_BUYER_NAME, buyerName || "");
        localStorage.setItem(LS_DEFAULT_CITY, defaultCity || "");
      } catch {
        // ignore
      }

      // 2) best effort DB (profiles) si table/policies prêtes
      const res = await updateProfile({
        username: buyerName || null,
        default_city: defaultCity || null,
      });

      if (res?.ok) setMsg("✅ Profil sauvegardé.");
      else setMsg("✅ Profil sauvegardé (local)."); // si profiles pas prêt, on ne bloque pas
    } catch (e) {
      console.error("❌ save profile error:", e);
      setErr(e?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setErr("");
    setMsg("");
    try {
      await signOut();
    } catch (e) {
      console.error("❌ signOut error:", e);
      setErr(e?.message || "Impossible de se déconnecter.");
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          border: "1px solid rgba(255,215,0,0.18)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 950, color: "#f6f0da" }}>Profil (Bêta)</div>
        <div style={{ marginTop: 6, color: "#a3a092", fontSize: 12 }}>
          Connecté en tant que : <b>{user?.email || "—"}</b>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Prénom affiché</div>
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Ex: Zaid"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "#f6f0da",
                outline: "none",
                fontWeight: 800,
              }}
            />
            <div style={{ marginTop: 6, color: "#a3a092", fontSize: 11, lineHeight: 1.4 }}>
              Utilisé comme <code>requester_name</code> lors de la création de demandes.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Ville par défaut (optionnel)</div>
            <input
              value={defaultCity}
              onChange={(e) => setDefaultCity(e.target.value)}
              placeholder="Ex: Paris"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "#f6f0da",
                outline: "none",
                fontWeight: 800,
              }}
            />
            <div style={{ marginTop: 6, color: "#a3a092", fontSize: 11, lineHeight: 1.4 }}>
              (Tu pourras t’en servir plus tard pour préremplir <code>target_city</code>.)
            </div>
          </div>
        </div>

        {err && (
          <div style={{ marginTop: 10, color: "#fecaca", fontSize: 12, whiteSpace: "pre-wrap" }}>
            ❌ {err}
          </div>
        )}
        {msg && (
          <div style={{ marginTop: 10, color: "#bbf7d0", fontSize: 12, whiteSpace: "pre-wrap" }}>
            {msg}
          </div>
        )}

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
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
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>

          <ResetTestSessionButton onReset={() => setMsg("✅ Session réinitialisée.")} />

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.90)",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
