// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const watchdog = window.setTimeout(() => {
      // Ne jamais bloquer l'UI si un truc se passe mal
      setLoading(false);
    }, 2500);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sess = data?.session || null;
        setSession(sess);
        setUser(sess?.user || null);
      } catch {
        setSession(null);
        setUser(null);
      } finally {
        window.clearTimeout(watchdog);
        setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      setLoading(false);
    });

    return () => {
      window.clearTimeout(watchdog);
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // ✅ Magic link (OTP)
  const signInWithEmail = async (email) => {
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) throw new Error("Merci de saisir un email.");

    const redirectTo = `${window.location.origin}/`; // important mobile
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return true;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo(
    () => ({
      loading,
      session,
      user,
      signInWithEmail,
      signOut,
    }),
    [loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
