// @ts-nocheck
/// <reference lib="dom" />
/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import Stripe from "https://esm.sh/stripe@16.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Secrets
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");          // sk_test_...
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");  // whsec_...
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

// Clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});
const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Helper: MAJ de la commande
async function markOrderPaid(orderId: number, piId: string, sessionId?: string) {
  const { error } = await supa
    .from("orders")
    .update({
      payment_status: "paid",
      stripe_payment_intent: piId,
      stripe_session_id: sessionId ?? null,
    })
    .eq("id", orderId);

  if (error) throw error;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const raw = await req.text(); // important pour la vérification

  try {
    // Vérifie la signature Stripe
    const event = stripe.webhooks.constructEvent(raw, signature, STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as any; // Checkout Session
        const orderId = Number(s.client_reference_id); // <-- on lit l’orderId ici
        const pi = String(s.payment_intent);
        const sessionId = String(s.id);

        if (orderId && pi) await markOrderPaid(orderId, pi, sessionId);
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        // fallback si un jour on passe l’orderId en metadata
        const orderId = Number(pi.metadata?.order_id);
        if (orderId) await markOrderPaid(orderId, String(pi.id));
        break;
      }

      default:
        // on ignore les autres
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
