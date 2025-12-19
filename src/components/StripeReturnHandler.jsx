// src/components/StripeReturnHandler.jsx
// Retour Stripe : ?checkout=success&orderId=12
// Objectif MVP (comme avant) :
// - Ajouter l'orderId dans localStorage.dutyfree_paid_orders (pour l'UI)
// - Mettre la request liée en 'paid' (best effort)
// - (bonus) appeler confirm-payment pour tenter de marquer paid en DB
// - Vider panier + nettoyer URL
// - Ne rend rien à l'écran

import React, { useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const LS_PAID = "dutyfree_paid_orders";
const LS_CART = "dutyfree_cart";
const LS_REQ = "dutyfree_current_request_id";
const LS_ORDER = "dutyfree_current_order_id";

export default function StripeReturnHandler() {
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;

    let url;
    try {
      url = new URL(window.location.href);
    } catch (e) {
      console.error("❌ StripeReturnHandler: URL invalide", e);
      return;
    }

    const checkout = url.searchParams.get("checkout");
    const orderIdParam = url.searchParams.get("orderId");

    if (!checkout) return;
    doneRef.current = true;

    // cancel
    if (checkout === "cancel") {
      window.alert("Le paiement a été annulé.");
      url.searchParams.delete("checkout");
      url.searchParams.delete("orderId");
      window.history.replaceState({}, "", url.pathname + url.search);
      return;
    }

    // only success
    if (checkout !== "success") return;

    const orderId = Number(orderIdParam);
    if (!orderId || Number.isNaN(orderId)) {
      window.alert("Erreur : identifiant de commande invalide dans l'URL.");
      return;
    }

    (async () => {
      // 1) Lire request_id liée depuis localStorage
      let linkedRequestId = null;
      try {
        const raw = localStorage.getItem(LS_REQ);
        if (raw) {
          const n = Number(raw);
          if (!Number.isNaN(n) && n > 0) linkedRequestId = n;
        }
      } catch {
        linkedRequestId = null;
      }

      // 1bis) Si pas en local, essayer de lire orders.request_id (si RLS permet)
      if (!linkedRequestId) {
        try {
          const { data, error } = await supabase
            .from("orders")
            .select("request_id")
            .eq("id", orderId)
            .maybeSingle();

          if (!error && data?.request_id) {
            const n = Number(data.request_id);
            if (!Number.isNaN(n) && n > 0) linkedRequestId = n;
          }
        } catch {
          // ignore
        }
      }

      // 2) ✅ COMME AVANT : marquer payé en localStorage (UI)
      try {
        const raw = localStorage.getItem(LS_PAID);
        let arr = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed;
          } catch {}
        }
        if (!arr.includes(orderId)) arr.push(orderId);
        localStorage.setItem(LS_PAID, JSON.stringify(arr));
      } catch {
        // ignore
      }

      // 3) Bonus : tenter confirm-payment (DB) — best effort
      try {
        const { data, error } = await supabase.functions.invoke("confirm-payment", {
          body: { orderId },
        });
        if (error) {
          console.warn("⚠️ confirm-payment failed:", error);
        } else {
          // juste pour debug
          console.log("✅ confirm-payment response:", data);
        }
      } catch (e) {
        console.warn("⚠️ confirm-payment exception:", e);
      }

      // 4) ✅ COMME AVANT : mettre la demande liée en paid (best effort)
      if (linkedRequestId) {
        try {
          const { error } = await supabase
            .from("requests")
            .update({ status: "paid" })
            .eq("id", linkedRequestId);

          if (error) {
            console.warn("⚠️ update requests.status failed:", error);
          }
        } catch (e) {
          console.warn("⚠️ update requests.status exception:", e);
        }
      }

      // 5) vider local state
      try {
        localStorage.removeItem(LS_CART);
        localStorage.removeItem(LS_REQ);
        localStorage.removeItem(LS_ORDER);
      } catch {}

      window.alert(`✅ Paiement Stripe réussi pour la commande #${orderId}.`);

      // 6) nettoyer URL
      url.searchParams.delete("checkout");
      url.searchParams.delete("orderId");
      window.history.replaceState({}, "", url.pathname + url.search);
    })();
  }, []);

  return null;
}
