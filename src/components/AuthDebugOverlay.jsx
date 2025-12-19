// src/components/AuthDebugOverlay.jsx
import React from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AuthDebugOverlay() {
  const { loading, user } = useAuth();

  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasAnon = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div
      style={{
        position: "fixed",
        right: 10,
        bottom: 10,
        zIndex: 9999,
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.55)",
        color: "rgba(255,255,255,0.9)",
        fontSize: 11,
        lineHeight: 1.35,
        maxWidth: 320,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 4 }}>Auth debug</div>
      <div>loading: <b>{String(loading)}</b></div>
      <div>user: <b>{user?.email || "null"}</b></div>
      <div>VITE_SUPABASE_URL: <b>{hasUrl ? "OK" : "MISSING"}</b></div>
      <div>VITE_SUPABASE_ANON_KEY: <b>{hasAnon ? "OK" : "MISSING"}</b></div>
    </div>
  );
}
