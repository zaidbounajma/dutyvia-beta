// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);
  const didInitRef = useRef(false);

  const fetchProfile = async (uid) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, default_city, created_at, updated_at")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.warn("⚠️ fetchProfile warning:", error);
        setProfile(null);
        return;
      }
      setProfile(data || null);
    } catch (e) {
      console.warn("⚠️ fetchProfile exception:", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const watchdog = window.setTimeout(() => {
      console.warn("⏳ Auth watchdog: getSession trop long → on débloque l’UI");
      setLoading(false);
    }, 2500);

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("⚠️ getSession error:", error);

        const sess = data?.session || null;
        setSession(sess);
        setUser(sess?.user || null);

        if (sess?.user?.id) await fetchProfile(sess.user.id);
      } catch (e) {
        console.error("❌ Auth init exception:", e);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        window.clearTimeout(watchdog);
        setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const u = newSession?.user || null;
      setUser(u);

      if (u?.id) await fetchProfile(u.id);
      else setProfile(null);

      setLoading(false);
    });

    return () => {
      window.clearTimeout(watchdog);
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  const signInWithEmail = async (email) => {
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) throw new Error("Veuillez saisir une adresse email.");

    const redirectTo = window.location.origin;

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

  const updateProfile = async (patch) => {
    const uid = user?.id;
    if (!uid) throw new Error("Vous devez être connecté.");

    const payload = {
      id: uid,
      username: patch?.username ?? null,
      default_city: patch?.default_city ?? null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("id, username, default_city, created_at, updated_at")
        .single();

      if (error) {
        console.warn("⚠️ updateProfile warning:", error);
        return { ok: false, error };
      }

      setProfile(data || null);
      return { ok: true, profile: data };
    } catch (e) {
      console.warn("⚠️ updateProfile exception:", e);
      return { ok: false, error: e };
    }
  };

  const value = useMemo(
    () => ({
      loading,
      session,
      user,
      profile,
      signInWithEmail,
      signOut,
      updateProfile,
      refetchProfile: () => fetchProfile(user?.id),
    }),
    [loading, session, user, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
